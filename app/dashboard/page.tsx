'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import type { 
  DailyState, 
  TreatmentSession, 
  DayTask, 
  JournalEntry,
  TreatmentType,
  TreatmentStatus,
  TaskCategory,
  TaskPriority,
  TaskStatus,
  JournalContext
} from '@/types/database';

// Citations de motivation
const motivationalQuotes = [
  "Rien n'est facile, mais tout est possible.",
  "Aujourd'hui, on avance à ton rythme, pas à pas.",
  "Chaque petit pas compte, chaque jour est une victoire.",
  "Tu es plus forte que tu ne le penses.",
  "Prends soin de toi, une étape à la fois.",
];

export default function DashboardPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState<string | null>(null);
  const [motivationalQuote] = useState(
    motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
  );

  const [dailyState, setDailyState] = useState<DailyState | null>(null);
  const [nextAppointment, setNextAppointment] = useState<TreatmentSession | null>(null);
  const [todayTasks, setTodayTasks] = useState<DayTask[]>([]);
  const [lastJournalEntry, setLastJournalEntry] = useState<JournalEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const supabase = createClient();
        
        // Récupérer l'utilisateur actuel
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.error('❌ Error getting user:', authError);
          router.push('/login');
          return;
        }

        // Récupérer le prénom de l'utilisateur
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('first_name')
          .eq('id', user.id)
          .single();

        if (!userError && userData) {
          setFirstName(userData.first_name);
        }

        // Récupérer l'état du jour d'aujourd'hui
        const today = new Date().toISOString().split('T')[0];
        const { data: dailyStateData, error: dailyStateError } = await supabase
          .from('daily_states')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', today)
          .maybeSingle();

        if (!dailyStateError && dailyStateData) {
          console.log('✅ Daily state fetched:', dailyStateData);
          setDailyState(dailyStateData as DailyState);
        } else if (dailyStateError) {
          console.error('❌ Error fetching daily state:', dailyStateError);
          console.error('❌ Error details:', JSON.stringify(dailyStateError, null, 2));
        } else {
          console.log('⚠️ No daily state found for today');
        }

        // Récupérer le prochain rendez-vous (prochain start_datetime dans le futur)
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('treatment_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'scheduled')
          .gte('start_datetime', new Date().toISOString())
          .order('start_datetime', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (!appointmentsError && appointmentsData) {
          console.log('✅ Next appointment fetched:', appointmentsData);
          setNextAppointment(appointmentsData as TreatmentSession);
        } else if (appointmentsError) {
          console.error('❌ Error fetching appointments:', appointmentsError);
          console.error('❌ Error details:', JSON.stringify(appointmentsError, null, 2));
        } else {
          console.log('⚠️ No upcoming appointments found');
        }

        // Récupérer les tâches d'aujourd'hui
        // D'abord, récupérer le plan du jour d'aujourd'hui
        const { data: dayPlanData, error: dayPlanError } = await supabase
          .from('day_plans')
          .select('id')
          .eq('user_id', user.id)
          .eq('date', today)
          .maybeSingle();

        if (!dayPlanError && dayPlanData) {
          const { data: tasksData, error: tasksError } = await supabase
            .from('day_tasks')
            .select('*')
            .eq('day_plan_id', dayPlanData.id)
            .order('created_at', { ascending: true });

          if (!tasksError && tasksData) {
            setTodayTasks(tasksData as DayTask[]);
          } else if (tasksError) {
            console.error('❌ Error fetching tasks:', tasksError);
          }
        } else if (dayPlanError) {
          console.error('❌ Error fetching day plan:', dayPlanError);
        }

        // Récupérer la dernière entrée de journal
        const { data: journalData, error: journalError } = await supabase
          .from('journal_entries')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!journalError && journalData) {
          setLastJournalEntry(journalData as JournalEntry);
        }

      } catch (error) {
        console.error('💥 Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
    
    // Recharger les données si un paramètre refresh est présent dans l'URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('refresh')) {
      // Attendre un peu puis recharger les données
      setTimeout(() => {
        loadDashboardData();
      }, 1000);
    }
  }, [router]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(date.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Demain";
    if (diffDays <= 7) return `Dans ${diffDays} jours`;
    
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  };

  const getTreatmentTypeLabel = (type: TreatmentType) => {
    const labels: Record<TreatmentType, string> = {
      chimio: 'Chimiothérapie',
      radio: 'Radiothérapie',
      consultation: 'Consultation',
      examen: 'Examen',
      autre: 'Autre',
    };
    return labels[type];
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  const completedTasks = todayTasks.filter(t => t.status === 'done').length;
  const totalTasks = todayTasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calcul des offsets parallaxe pour chaque carte
  const getParallaxOffset = (index: number, baseOffset: number = 50) => {
    const speed = 0.3 + (index * 0.1);
    return scrollY * speed * 0.1 - (baseOffset * (index + 1));
  };

  // Afficher un loader pendant le chargement
  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[var(--beige-50)] via-white to-[var(--pink-50)] relative overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--pink-200)] border-t-[var(--pink-600)] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Chargement de ton espace...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--beige-50)] via-white to-[var(--pink-50)] relative overflow-hidden">
      {/* Éléments décoratifs animés */}
      <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-gradient-to-br from-[var(--pink-300)] to-[var(--pink-400)] rounded-full blur-[160px] opacity-25 animate-gentle-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-gradient-to-tr from-[var(--lavender-300)] to-[var(--lavender-200)] rounded-full blur-[160px] opacity-25 animate-gentle-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-[var(--pink-200)] to-[var(--lavender-200)] rounded-full blur-[140px] opacity-20 animate-gentle-pulse" style={{ animationDelay: '4s' }}></div>

      {/* Barre de navigation */}
      <nav className="relative z-50 px-6 py-6 md:py-8 backdrop-blur-md bg-white/70 border-b border-[var(--pink-200)]/30 sticky top-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-13 h-13 bg-gradient-to-br from-[var(--accent-soft)] to-[var(--accent-strong)] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 overflow-hidden">
              <Image
                src="/logo2.png"
                alt="BreastWise Logo"
                width={50}
                height={50}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-[var(--text-primary)] to-[var(--accent-strong)] bg-clip-text text-transparent">BreastWise</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[var(--pink-600)] to-[var(--pink-700)] rounded-xl hover:from-[var(--pink-700)] hover:to-[var(--pink-800)] transition-all duration-300 hover:scale-105 hover:shadow-md"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </nav>

      {/* Section principale */}
      <section className="relative px-6 py-8 md:py-12 z-10" ref={containerRef}>
        <div className="max-w-7xl mx-auto">
          {/* Header amélioré avec statistiques */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="mb-6">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-light text-[var(--text-primary)] mb-4 tracking-tight inline-flex items-center gap-3">
                <span>Bonjour{firstName ? `, ${firstName}` : ''}</span>
                <span className="text-4xl md:text-5xl lg:text-6xl animate-gentle-float">🌸</span>
              </h1>
            </div>
            
            {/* Badge de citation avec animation */}
            <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-white/90 via-[var(--pink-50)]/80 to-white/90 backdrop-blur-xl rounded-full border border-[var(--pink-200)]/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <span className="text-2xl animate-gentle-float">✨</span>
              <span className="text-lg md:text-xl text-[var(--text-secondary)] italic font-light">
                <span className="font-semibold not-italic text-[var(--text-primary)]">Message du jour :</span>{' '}
                {motivationalQuote}
              </span>
              <span className="text-2xl animate-gentle-float" style={{ animationDelay: '1s' }}>✨</span>
            </div>

            {/* Statistiques rapides */}
            {totalTasks > 0 && (
              <div className="mt-8 flex items-center justify-center gap-6">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-[var(--pink-200)]/50">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{completedTasks}</span>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-[var(--text-light)]">Tâches complétées</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{completionRate}%</p>
                  </div>
                </div>
                {dailyState && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-[var(--pink-200)]/50">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-soft)] to-[var(--accent-strong)] flex items-center justify-center">
                      <span className="text-white text-lg">⚡</span>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-[var(--text-light)]">Énergie du jour</p>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {dailyState.energy_level}/5
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Grille des cartes avec layout amélioré */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Carte 1 - État du jour avec graphique visuel */}
            <Link
              href="/etat-du-jour"
              className="group relative bg-gradient-to-br from-white/90 via-white/80 to-[var(--pink-50)]/50 backdrop-blur-xl rounded-3xl border-2 border-[var(--pink-200)]/50 shadow-2xl p-6 md:p-8 hover:border-[var(--accent-medium)] hover:shadow-[0_30px_80px_rgba(232,132,150,0.3)] transition-all duration-500 animate-fade-in hover:-translate-y-3 overflow-hidden flex flex-col"
            >
              {/* Effets de lumière animés */}
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--pink-200)]/20 via-transparent to-[var(--lavender-200)]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[var(--pink-300)]/40 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              <div className="relative z-10">
                {/* Icône animée */}
                <div className="w-20 h-20 bg-gradient-to-br from-[var(--accent-soft)] via-[var(--accent-medium)] to-[var(--accent-strong)] rounded-2xl flex items-center justify-center mb-6 shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                  <span className="text-4xl animate-gentle-float">📊</span>
                </div>
                
                <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-3">
                  Mon état du jour
                </h2>
                <p className="text-[var(--text-secondary)] mb-6 text-sm leading-relaxed">
                  Comment tu te sens aujourd'hui ?
                </p>
                
                {dailyState ? (
                  <div className="mb-6 space-y-4">
                    {/* Barres de progression visuelles */}
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                            <span>⚡</span> Énergie
                          </span>
                          <span className="text-xs text-[var(--text-light)]">{dailyState.energy_level}/5</span>
                        </div>
                        <div className="h-3 bg-[var(--pink-100)] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[var(--accent-soft)] to-[var(--accent-strong)] rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${(dailyState.energy_level / 5) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                            <span>😴</span> Fatigue
                          </span>
                          <span className="text-xs text-[var(--text-light)]">{dailyState.fatigue_level}/5</span>
                        </div>
                        <div className="h-3 bg-[var(--pink-100)] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[var(--lavender-200)] to-[var(--lavender-300)] rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${(dailyState.fatigue_level / 5) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                            <span>💝</span> Humeur
                          </span>
                          <span className="text-xs text-[var(--text-light)]">{dailyState.mood_level}/5</span>
                        </div>
                        <div className="h-3 bg-[var(--pink-100)] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[var(--accent-soft)] to-[var(--accent-strong)] rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${(dailyState.mood_level / 5) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 p-4 bg-[var(--pink-50)]/50 rounded-xl border border-[var(--pink-200)]/50">
                    <p className="text-sm text-[var(--text-light)] italic text-center">
                      Pas encore de données aujourd'hui
                    </p>
                  </div>
                )}
                
                <button className="w-full px-5 py-3.5 bg-gradient-to-r from-[var(--button-primary-bg)] via-[var(--pink-600)] to-[var(--button-primary-bg)] text-white rounded-xl font-semibold text-sm hover:from-[var(--pink-600)] hover:via-[var(--pink-700)] hover:to-[var(--pink-600)] transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 transform hover:-translate-y-1 relative overflow-hidden group/btn mt-auto" style={{ color: '#ffffff' }}>
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Mettre à jour mon état
                    <span className="group-hover/btn:translate-x-1 transition-transform duration-300">→</span>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
                </button>
              </div>
            </Link>

            {/* Carte 2 - Mon traitement avec badge de date */}
            <Link
              href="/traitement"
              className="group relative bg-gradient-to-br from-white/90 via-white/80 to-[var(--lavender-50)]/50 backdrop-blur-xl rounded-3xl border-2 border-[var(--lavender-200)]/50 shadow-2xl p-6 md:p-8 hover:border-[var(--lavender-300)] hover:shadow-[0_30px_80px_rgba(213,207,232,0.3)] transition-all duration-500 animate-fade-in hover:-translate-y-3 overflow-hidden flex flex-col"
              style={{ animationDelay: '0.1s' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--lavender-200)]/20 via-transparent to-[var(--pink-200)]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[var(--lavender-300)]/40 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-[var(--lavender-100)] via-[var(--lavender-200)] to-[var(--lavender-300)] rounded-2xl flex items-center justify-center mb-6 shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                  <span className="text-4xl animate-gentle-float" style={{ animationDelay: '1s' }}>📅</span>
                </div>
                
                <h2 className="text-2xl md:text-3xl font-bold text-[var(--accent-strong)] mb-3">
                  Mon traitement
                </h2>
                <p className="text-[var(--text-secondary)] mb-6 text-sm leading-relaxed">
                  Tes prochaines étapes médicales en un coup d'œil.
                </p>
                
                {nextAppointment ? (
                  <div className="mb-6 p-4 bg-gradient-to-br from-[var(--lavender-50)]/80 to-[var(--pink-50)]/80 rounded-2xl border-2 border-[var(--lavender-200)]/50 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-[var(--lavender-200)]/30 rounded-full blur-2xl"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-[var(--text-light)] uppercase tracking-wide">Prochain rendez-vous</span>
                        <span className="px-2 py-0.5 bg-[var(--lavender-200)]/50 rounded-full text-xs font-semibold text-[var(--text-primary)]">
                          {formatDate(nextAppointment.start_datetime)}
                        </span>
                      </div>
                      <p className="text-base font-bold text-[var(--text-primary)] mb-1">
                        {nextAppointment.title}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                        <span>🏥</span>
                        {getTreatmentTypeLabel(nextAppointment.type)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 p-4 bg-[var(--lavender-50)]/50 rounded-xl border border-[var(--lavender-200)]/50">
                    <p className="text-sm text-[var(--text-light)] italic text-center">
                      Aucun rendez-vous à venir
                    </p>
                  </div>
                )}
                
                <button className="w-full px-5 py-3.5 bg-gradient-to-r from-[var(--lavender-200)] via-[var(--lavender-300)] to-[var(--lavender-200)] text-white rounded-xl font-semibold text-sm hover:from-[var(--lavender-300)] hover:via-[var(--lavender-400)] hover:to-[var(--lavender-300)] transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 transform hover:-translate-y-1 relative overflow-hidden group/btn mt-auto">
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Voir mon suivi complet
                    <span className="group-hover/btn:translate-x-1 transition-transform duration-300">→</span>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
                </button>
              </div>
            </Link>

            {/* Carte 3 - Plan de ma journée avec progression */}
            <Link
              href="/plan-du-jour"
              className="group relative bg-gradient-to-br from-white/90 via-white/80 to-[var(--pink-50)]/50 backdrop-blur-xl rounded-3xl border-2 border-[var(--pink-200)]/50 shadow-2xl p-6 md:p-8 hover:border-[var(--accent-medium)] hover:shadow-[0_30px_80px_rgba(232,132,150,0.3)] transition-all duration-500 animate-fade-in hover:-translate-y-3 overflow-hidden"
              style={{ animationDelay: '0.2s' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--pink-200)]/20 via-transparent to-[var(--lavender-200)]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[var(--pink-300)]/40 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-[var(--accent-soft)] via-[var(--accent-medium)] to-[var(--accent-strong)] rounded-2xl flex items-center justify-center mb-6 shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                  <span className="text-4xl animate-gentle-float" style={{ animationDelay: '2s' }}>📝</span>
                </div>
                
                <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-3">
                  Plan de ma journée
                </h2>
                <p className="text-[var(--text-secondary)] mb-6 text-sm leading-relaxed">
                  Un petit plan adapté à ton énergie du jour.
                </p>
                
                {todayTasks.length > 0 ? (
                  <div className="mb-6 space-y-4">
                    {/* Barre de progression */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">
                          Progression du jour
                        </span>
                        <span className="text-xs font-bold text-[var(--accent-medium)]">{completionRate}%</span>
                      </div>
                      <div className="h-3 bg-[var(--pink-100)] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-400 via-green-500 to-green-600 rounded-full transition-all duration-1000 ease-out shadow-lg"
                          style={{ width: `${completionRate}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                        {todayTasks.length} action{todayTasks.length > 1 ? 's' : ''} proposée{todayTasks.length > 1 ? 's' : ''}
                      </p>
                      <div className="space-y-2">
                        {todayTasks.slice(0, 2).map((task) => (
                          <div
                            key={task.id}
                            className={`flex items-center gap-2 p-2.5 rounded-lg transition-all duration-300 ${
                              task.status === 'done'
                                ? 'bg-gradient-to-r from-green-50 to-green-100/50 border border-green-200/50'
                                : 'bg-[var(--pink-50)]/50 border border-[var(--pink-200)]/50'
                            }`}
                          >
                            <span className={`text-lg ${task.status === 'done' ? 'text-green-600' : 'text-[var(--text-light)]'}`}>
                              {task.status === 'done' ? '✓' : '○'}
                            </span>
                            <span className={`text-xs flex-1 ${task.status === 'done' ? 'text-green-700 line-through' : 'text-[var(--text-secondary)]'}`}>
                              {task.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 p-4 bg-[var(--pink-50)]/50 rounded-xl border border-[var(--pink-200)]/50">
                    <p className="text-sm text-[var(--text-light)] italic text-center">
                      Pas encore de plan pour aujourd'hui
                    </p>
                  </div>
                )}
                
                <button className="w-full px-5 py-3.5 bg-gradient-to-r from-[var(--button-primary-bg)] via-[var(--pink-600)] to-[var(--button-primary-bg)] text-white rounded-xl font-semibold text-sm hover:from-[var(--pink-600)] hover:via-[var(--pink-700)] hover:to-[var(--pink-600)] transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 transform hover:-translate-y-1 relative overflow-hidden group/btn" style={{ color: '#ffffff' }}>
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Voir mon plan du jour
                    <span className="group-hover/btn:translate-x-1 transition-transform duration-300">→</span>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
                </button>
              </div>
            </Link>

            {/* Carte 4 - Mon journal */}
            <Link
              href="/journal"
              className="group relative bg-gradient-to-br from-white/90 via-white/80 to-[var(--pink-50)]/50 backdrop-blur-xl rounded-3xl border-2 border-[var(--pink-200)]/50 shadow-2xl p-6 md:p-8 hover:border-[var(--accent-medium)] hover:shadow-[0_30px_80px_rgba(232,132,150,0.3)] transition-all duration-500 animate-fade-in hover:-translate-y-3 overflow-hidden"
              style={{ animationDelay: '0.3s' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--pink-200)]/20 via-transparent to-[var(--lavender-200)]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[var(--pink-300)]/40 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-[var(--accent-soft)] via-[var(--accent-medium)] to-[var(--accent-strong)] rounded-2xl flex items-center justify-center mb-6 shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                  <span className="text-4xl animate-gentle-float" style={{ animationDelay: '3s' }}>💝</span>
                </div>
                
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-[var(--text-primary)] mb-3 whitespace-nowrap">
                  Mon Espace Perso
                </h2>
                <p className="text-[var(--text-secondary)] mb-6 text-sm leading-relaxed">
                  Un espace pour déposer ce que tu ressens.
                </p>
                
                {lastJournalEntry ? (
                  <div className="mb-6 p-4 bg-gradient-to-br from-[var(--pink-50)]/80 to-[var(--lavender-50)]/80 rounded-2xl border-2 border-[var(--pink-200)]/50 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-[var(--pink-200)]/30 rounded-full blur-2xl"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-[var(--text-light)] uppercase tracking-wide">Dernière écriture</span>
                      </div>
                      <p className="text-base font-bold text-[var(--text-primary)] mb-1">
                        {new Date(lastJournalEntry.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                        })}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-2 italic">
                        "{lastJournalEntry.content}"
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 p-4 bg-[var(--pink-50)]/50 rounded-xl border border-[var(--pink-200)]/50">
                    <p className="text-sm text-[var(--text-light)] italic text-center">
                      Aucune entrée pour le moment
                    </p>
                  </div>
                )}
                
                <button className="w-full px-5 py-3.5 bg-gradient-to-r from-[var(--button-primary-bg)] via-[var(--pink-600)] to-[var(--button-primary-bg)] text-white rounded-xl font-semibold text-sm hover:from-[var(--pink-600)] hover:via-[var(--pink-700)] hover:to-[var(--pink-600)] transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 transform hover:-translate-y-1 relative overflow-hidden group/btn" style={{ color: '#ffffff' }}>
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Écrire dans mon journal
                    <span className="group-hover/btn:translate-x-1 transition-transform duration-300">→</span>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
                </button>
              </div>
            </Link>

            {/* Carte 5 - Prendre soin de moi */}
            <Link
              href="/bien-etre"
              className="group relative bg-gradient-to-br from-white/90 via-white/80 to-[var(--lavender-50)]/50 backdrop-blur-xl rounded-3xl border-2 border-[var(--lavender-200)]/50 shadow-2xl p-6 md:p-8 hover:border-[var(--lavender-300)] hover:shadow-[0_30px_80px_rgba(213,207,232,0.3)] transition-all duration-500 animate-fade-in hover:-translate-y-3 overflow-hidden"
              style={{ animationDelay: '0.4s' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--lavender-200)]/20 via-transparent to-[var(--pink-200)]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[var(--lavender-300)]/40 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-[var(--lavender-100)] via-[var(--lavender-200)] to-[var(--lavender-300)] rounded-2xl flex items-center justify-center mb-6 shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                  <span className="text-4xl animate-gentle-float" style={{ animationDelay: '4s' }}>🌸</span>
                </div>
                
                <h2 className="text-2xl md:text-3xl font-bold text-[var(--accent-strong)] mb-3">
                  Prendre soin de moi
                </h2>
                <p className="text-[var(--text-secondary)] mb-6 text-sm leading-relaxed">
                  Des exercices doux pour t'aider à souffler.
                </p>
                
                <div className="mb-6 p-4 bg-gradient-to-br from-[var(--lavender-50)]/80 to-[var(--pink-50)]/80 rounded-2xl border-2 border-[var(--lavender-200)]/50 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-[var(--lavender-200)]/30 rounded-full blur-2xl"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-[var(--text-light)] uppercase tracking-wide">Suggestion du moment</span>
                      <span className="px-2 py-0.5 bg-[var(--pink-200)]/50 rounded-full text-xs font-semibold text-[var(--text-primary)]">
                        Nouveau
                      </span>
                    </div>
                    <p className="text-base font-bold text-[var(--text-primary)] mb-1">
                      Exercice de respiration
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                      <span>⏱️</span> 5 minutes
                    </p>
                  </div>
                </div>
                
                <button className="w-full px-5 py-3.5 bg-gradient-to-r from-[var(--lavender-200)] via-[var(--lavender-300)] to-[var(--lavender-200)] text-white rounded-xl font-semibold text-sm hover:from-[var(--lavender-300)] hover:via-[var(--lavender-400)] hover:to-[var(--lavender-300)] transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 transform hover:-translate-y-1 relative overflow-hidden group/btn">
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Explorer les exercices
                    <span className="group-hover/btn:translate-x-1 transition-transform duration-300">→</span>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
                </button>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}