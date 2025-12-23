'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import type { DailyState } from '@/types/database';

export default function EtatDuJourPage() {
  const router = useRouter();
  const [energyLevel, setEnergyLevel] = useState(3);
  const [fatigueLevel, setFatigueLevel] = useState(3);
  const [moodLevel, setMoodLevel] = useState(3);
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [todayState, setTodayState] = useState<DailyState | null>(null);
  const [history, setHistory] = useState<DailyState[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'7j' | '30j' | '3m'>('7j');
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Charger l'état du jour actuel et l'historique
  useEffect(() => {
    const loadDailyState = async () => {
      try {
        const supabase = createClient();
        
        // Récupérer l'utilisateur actuel
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.error('❌ Error getting user:', authError);
          router.push('/login');
          return;
        }

        const today = new Date().toISOString().split('T')[0];

        // Récupérer l'état du jour d'aujourd'hui
        const { data: dailyStateData, error: dailyStateError } = await supabase
          .from('daily_states')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', today)
          .maybeSingle();

        if (!dailyStateError && dailyStateData) {
          setTodayState(dailyStateData as DailyState);
          setEnergyLevel(dailyStateData.energy_level);
          setFatigueLevel(dailyStateData.fatigue_level);
          setMoodLevel(dailyStateData.mood_level);
          setNote(dailyStateData.note || '');
        }

        // Charger l'historique selon la période sélectionnée
        await loadHistory(user.id, selectedPeriod);

      } catch (error) {
        console.error('💥 Error loading daily state:', error);
        setSaveMessage({ type: 'error', text: 'Erreur lors du chargement des données' });
      } finally {
        setIsLoadingData(false);
      }
    };

    loadDailyState();
  }, [router, selectedPeriod]);

  const loadHistory = async (userId: string, period: '7j' | '30j' | '3m') => {
    try {
      const supabase = createClient();
      const today = new Date();
      const startDate = new Date();

      // Calculer la date de début selon la période
      switch (period) {
        case '7j':
          startDate.setDate(today.getDate() - 7);
          break;
        case '30j':
          startDate.setDate(today.getDate() - 30);
          break;
        case '3m':
          startDate.setMonth(today.getMonth() - 3);
          break;
      }

      const { data: historyData, error: historyError } = await supabase
        .from('daily_states')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', today.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (historyError) {
        console.error('❌ Error loading history:', historyError);
        console.error('❌ Error details:', JSON.stringify(historyError, null, 2));
        setHistory([]);
        return;
      }

      if (historyData && historyData.length > 0) {
        console.log(`✅ Loaded ${historyData.length} history entries`);
        historyData.forEach((entry, idx) => {
          console.log(`Entry ${idx + 1}: date=${entry.date}, energy=${entry.energy_level}, fatigue=${entry.fatigue_level}, mood=${entry.mood_level}`);
        });
        setHistory(historyData as DailyState[]);
      } else {
        console.log('⚠️ No history data found for period:', period);
        setHistory([]);
      }
    } catch (error) {
      console.error('💥 Error loading history:', error);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setSaveMessage(null);

    try {
      const supabase = createClient();
      
      // Récupérer l'utilisateur actuel
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setSaveMessage({ type: 'error', text: 'Erreur d\'authentification' });
        setIsLoading(false);
        return;
      }

      const today = new Date().toISOString().split('T')[0];

      // Upsert (insert ou update) l'état du jour
      const { data: savedData, error: saveError } = await supabase
        .from('daily_states')
        .upsert({
          id: todayState?.id,
          user_id: user.id,
          date: today,
          energy_level: energyLevel,
          fatigue_level: fatigueLevel,
          mood_level: moodLevel,
          note: note.trim() || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,date',
        })
        .select()
        .single();

      if (saveError) {
        console.error('❌ Error saving daily state:', saveError);
        setSaveMessage({ type: 'error', text: 'Erreur lors de la sauvegarde. Réessaye.' });
        return;
      }

      // Mettre à jour l'état local
      if (savedData) {
        console.log('✅ Data saved successfully:', savedData);
        setTodayState(savedData as DailyState);
        setSaveMessage({ type: 'success', text: 'Ton état du jour a été enregistré ! 🌸' });
        
        // Recharger l'historique pour mettre à jour les graphiques
        console.log('🔄 Reloading history...');
        await loadHistory(user.id, selectedPeriod);
      }

    } catch (error) {
      console.error('💥 Unexpected error:', error);
      setSaveMessage({ type: 'error', text: 'Une erreur inattendue s\'est produite' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  const energyEmojis = {
    1: { emoji: '😴', label: 'Très faible' },
    2: { emoji: '😔', label: 'Faible' },
    3: { emoji: '😐', label: 'Moyen' },
    4: { emoji: '😊', label: 'Bon' },
    5: { emoji: '🌟', label: 'Excellent' },
  };

  const fatigueEmojis = {
    1: { emoji: '😴', label: 'Très fatiguée' },
    2: { emoji: '😔', label: 'Fatiguée' },
    3: { emoji: '😐', label: 'Un peu fatiguée' },
    4: { emoji: '😊', label: 'Peu fatiguée' },
    5: { emoji: '🌟', label: 'Pas fatiguée' },
  };

  const moodEmojis = {
    1: { emoji: '😢', label: 'Très difficile' },
    2: { emoji: '😔', label: 'Difficile' },
    3: { emoji: '😐', label: 'Neutre' },
    4: { emoji: '😊', label: 'Positif' },
    5: { emoji: '🌟', label: 'Très positif' },
  };

  const getMaxValue = () => {
    if (history.length === 0) return 5;
    const max = Math.max(...history.map(h => Math.max(
      Number(h.energy_level) || 0,
      Number(h.fatigue_level) || 0,
      Number(h.mood_level) || 0
    )));
    // S'assurer que maxValue est au moins 5 pour avoir une bonne échelle
    const result = Math.max(max, 5);
    console.log('📊 Max value calculated:', result, 'from', history.length, 'entries');
    return result;
  };

  const maxValue = getMaxValue();

  // Afficher un loader pendant le chargement initial
  if (isLoadingData) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[var(--beige-50)] via-white to-[var(--pink-50)] relative overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--pink-200)] border-t-[var(--pink-600)] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Chargement de tes données...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--beige-50)] via-white to-[var(--pink-50)] relative overflow-hidden">
      {/* Éléments décoratifs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-[var(--pink-300)] to-[var(--pink-400)] rounded-full blur-[140px] opacity-25 animate-gentle-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-[var(--lavender-300)] to-[var(--lavender-200)] rounded-full blur-[140px] opacity-25 animate-gentle-pulse" style={{ animationDelay: '2s' }}></div>

      {/* Navigation */}
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
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm font-semibold text-[var(--text-primary)] border-2 border-[var(--button-secondary-border)] rounded-xl hover:border-[var(--button-secondary-hover-border)] hover:bg-gradient-to-r hover:from-[var(--pink-50)] hover:to-[var(--lavender-50)] transition-all duration-300 hover:scale-105 hover:shadow-md"
            >
              ← Retour au tableau de bord
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[var(--pink-600)] to-[var(--pink-700)] rounded-xl hover:from-[var(--pink-700)] hover:to-[var(--pink-800)] transition-all duration-300 hover:scale-105 hover:shadow-md"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </nav>

      {/* Contenu principal */}
      <section className="relative px-6 py-8 md:py-12 z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-light text-[var(--text-primary)] mb-4 tracking-tight">
              Mon état du jour
            </h1>
            <p className="text-lg text-[var(--text-secondary)]">
              Prends un moment pour toi et partage comment tu te sens aujourd'hui
            </p>
          </div>

          {/* Message de succès/erreur */}
          {saveMessage && (
            <div className={`mb-6 p-4 rounded-xl animate-fade-in ${
              saveMessage.type === 'success'
                ? 'bg-gradient-to-r from-green-50 to-green-100 border border-green-200'
                : 'bg-gradient-to-r from-red-50 to-red-100 border border-red-200'
            }`}>
              <p className={`text-center font-semibold ${
                saveMessage.type === 'success' ? 'text-green-700' : 'text-red-700'
              }`}>
                {saveMessage.text}
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8">
            {/* Formulaire de saisie */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border-2 border-[var(--pink-200)]/50 shadow-2xl p-8 animate-fade-in">
              <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-6">
                Comment tu te sens aujourd'hui ?
              </h2>

              {/* Niveau d'énergie */}
              <div className="mb-8 space-y-4">
                <label className="block text-lg font-semibold text-[var(--text-primary)]">
                  Niveau d'énergie
                </label>
                <div className="space-y-3">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={energyLevel}
                    onChange={(e) => setEnergyLevel(Number(e.target.value))}
                    className="w-full h-3 bg-[var(--pink-100)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-strong)]"
                  />
                  <div className="flex justify-between items-center">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setEnergyLevel(val)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-300 ${
                          energyLevel === val
                            ? 'bg-gradient-to-br from-[var(--accent-soft)] to-[var(--accent-strong)] text-white scale-110'
                            : 'hover:bg-[var(--pink-50)]'
                        }`}
                      >
                        <span className="text-2xl">{energyEmojis[val as keyof typeof energyEmojis].emoji}</span>
                        <span className="text-xs font-medium">{energyEmojis[val as keyof typeof energyEmojis].label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Niveau de fatigue */}
              <div className="mb-8 space-y-4">
                <label className="block text-lg font-semibold text-[var(--text-primary)]">
                  Niveau de fatigue
                </label>
                <div className="space-y-3">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={fatigueLevel}
                    onChange={(e) => setFatigueLevel(Number(e.target.value))}
                    className="w-full h-3 bg-[var(--pink-100)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-strong)]"
                  />
                  <div className="flex justify-between items-center">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setFatigueLevel(val)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-300 ${
                          fatigueLevel === val
                            ? 'bg-gradient-to-br from-[var(--accent-soft)] to-[var(--accent-strong)] text-white scale-110'
                            : 'hover:bg-[var(--pink-50)]'
                        }`}
                      >
                        <span className="text-2xl">{fatigueEmojis[val as keyof typeof fatigueEmojis].emoji}</span>
                        <span className="text-xs font-medium">{fatigueEmojis[val as keyof typeof fatigueEmojis].label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Humeur */}
              <div className="mb-8 space-y-4">
                <label className="block text-lg font-semibold text-[var(--text-primary)]">
                  Humeur
                </label>
                <div className="space-y-3">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={moodLevel}
                    onChange={(e) => setMoodLevel(Number(e.target.value))}
                    className="w-full h-3 bg-[var(--pink-100)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-strong)]"
                  />
                  <div className="flex justify-between items-center">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setMoodLevel(val)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-300 ${
                          moodLevel === val
                            ? 'bg-gradient-to-br from-[var(--accent-soft)] to-[var(--accent-strong)] text-white scale-110'
                            : 'hover:bg-[var(--pink-50)]'
                        }`}
                      >
                        <span className="text-2xl">{moodEmojis[val as keyof typeof moodEmojis].emoji}</span>
                        <span className="text-xs font-medium">{moodEmojis[val as keyof typeof moodEmojis].label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Note optionnelle */}
              <div className="mb-8">
                <label className="block text-lg font-semibold text-[var(--text-primary)] mb-3">
                  Note (optionnelle)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Tu peux ajouter une note sur comment tu te sens..."
                  className="w-full px-4 py-3 bg-white/90 border-2 border-[var(--pink-200)]/50 rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-light)] focus:outline-none focus:border-[var(--accent-medium)] focus:ring-2 focus:ring-[var(--accent-light)] transition-all duration-300 resize-none"
                  rows={4}
                />
              </div>

              {/* Bouton de sauvegarde */}
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="w-full px-6 py-4 bg-gradient-to-r from-[var(--button-primary-bg)] via-[var(--pink-600)] to-[var(--button-primary-bg)] text-white rounded-xl font-semibold text-lg hover:from-[var(--pink-600)] hover:via-[var(--pink-700)] hover:to-[var(--pink-600)] transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group/btn"
                style={{ color: '#ffffff' }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <span>Enregistrer mon état</span>
                      <span className="group-hover/btn:translate-x-1 transition-transform duration-300">→</span>
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
              </button>
            </div>

            {/* Graphiques d'historique */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border-2 border-[var(--pink-200)]/50 shadow-2xl p-8 animate-fade-in">
              <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-6">
                Évolution
              </h2>

              {/* Filtres de période */}
              <div className="flex gap-2 mb-6">
                {(['7j', '30j', '3m'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${
                      selectedPeriod === period
                        ? 'bg-gradient-to-r from-[var(--accent-soft)] to-[var(--accent-strong)] text-white'
                        : 'bg-[var(--pink-50)] text-[var(--text-secondary)] hover:bg-[var(--pink-100)]'
                    }`}
                  >
                    {period === '7j' ? '7 jours' : period === '30j' ? '30 jours' : '3 mois'}
                  </button>
                ))}
              </div>

              {/* Graphiques */}
              {history.length > 0 ? (
                <div className="space-y-8">
                  {/* Graphique Énergie */}
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                      <span>⚡</span> Énergie
                    </h3>
                    <div className="h-32 bg-[var(--pink-50)] rounded-xl p-4 flex items-end justify-between gap-1">
                      {history.map((state, index) => {
                        const energyHeight = ((Number(state.energy_level) || 0) / maxValue) * 100;
                        return (
                          <div
                            key={state.id || index}
                            className="flex-1 flex flex-col items-center gap-1"
                          >
                            <div
                              className="w-full bg-gradient-to-t from-[var(--accent-soft)] to-[var(--accent-strong)] rounded-t transition-all duration-500"
                              style={{ 
                                height: `${energyHeight}%`,
                                minHeight: energyHeight > 0 ? '4px' : '0',
                              }}
                              title={`Énergie: ${state.energy_level}/5`}
                            ></div>
                            <span className="text-xs text-[var(--text-light)] mt-1">
                              {new Date(state.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Graphique Fatigue */}
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                      <span>😴</span> Fatigue
                    </h3>
                    <div className="h-32 bg-[var(--pink-50)] rounded-xl p-4 flex items-end justify-between gap-1">
                      {history.map((state, index) => {
                        const fatigueHeight = ((Number(state.fatigue_level) || 0) / maxValue) * 100;
                        return (
                          <div
                            key={state.id || index}
                            className="flex-1 flex flex-col items-center gap-1"
                          >
                            <div
                              className="w-full bg-gradient-to-t from-[var(--lavender-200)] to-[var(--lavender-300)] rounded-t transition-all duration-500"
                              style={{ 
                                height: `${fatigueHeight}%`,
                                minHeight: fatigueHeight > 0 ? '4px' : '0',
                              }}
                              title={`Fatigue: ${state.fatigue_level}/5`}
                            ></div>
                            <span className="text-xs text-[var(--text-light)] mt-1">
                              {new Date(state.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Graphique Humeur */}
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                      <span>💝</span> Humeur
                    </h3>
                    <div className="h-32 bg-[var(--pink-50)] rounded-xl p-4 flex items-end justify-between gap-1">
                      {history.map((state, index) => {
                        const moodHeight = ((Number(state.mood_level) || 0) / maxValue) * 100;
                        return (
                          <div
                            key={state.id || index}
                            className="flex-1 flex flex-col items-center gap-1"
                          >
                            <div
                              className="w-full bg-gradient-to-t from-[var(--accent-soft)] to-[var(--accent-strong)] rounded-t transition-all duration-500"
                              style={{ 
                                height: `${moodHeight}%`,
                                minHeight: moodHeight > 0 ? '4px' : '0',
                              }}
                              title={`Humeur: ${state.mood_level}/5`}
                            ></div>
                            <span className="text-xs text-[var(--text-light)] mt-1">
                              {new Date(state.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-[var(--text-light)] italic">
                    Aucune donnée pour le moment. Enregistre ton premier état du jour pour voir l'évolution ! 🌸
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
