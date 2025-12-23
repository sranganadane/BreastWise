'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import type { TreatmentSession, TreatmentType, TreatmentStatus } from '@/types/database';

export default function TraitementPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<TreatmentSession[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'chimio' | 'radio' | 'consultation'>('all');
  const [editingSession, setEditingSession] = useState<TreatmentSession | null>(null);

  // Formulaire
  const [formData, setFormData] = useState({
    type: 'consultation' as TreatmentType,
    title: '',
    description: '',
    start_datetime: '',
    end_datetime: '',
    location: '',
    doctor_name: '',
    notes: '',
  });

  // Charger les données depuis Supabase
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const supabase = createClient();
        
        // Récupérer l'utilisateur actuel
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.error('❌ Error getting user:', authError);
          router.push('/login');
          return;
        }

        // Charger toutes les sessions de l'utilisateur
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('treatment_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('start_datetime', { ascending: true });

        if (!sessionsError && sessionsData) {
          setSessions(sessionsData as TreatmentSession[]);
        } else if (sessionsError) {
          console.error('❌ Error loading sessions:', sessionsError);
        }
      } catch (error) {
        console.error('💥 Error loading sessions:', error);
      }
    };

    loadSessions();
  }, [router]);

  const getTreatmentTypeLabel = (type: TreatmentType): string => {
    const labels: Record<TreatmentType, string> = {
      chimio: 'Chimiothérapie',
      radio: 'Radiothérapie',
      consultation: 'Consultation',
      examen: 'Examen',
      autre: 'Autre',
    };
    return labels[type];
  };

  const getTreatmentTypeIcon = (type: TreatmentType): string => {
    const icons: Record<TreatmentType, string> = {
      chimio: '💉',
      radio: '☢️',
      consultation: '👨‍⚕️',
      examen: '🔬',
      autre: '📋',
    };
    return icons[type];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDaysUntil = (dateString: string): number => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filteredSessions = sessions.filter(session => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return session.status === 'scheduled' && new Date(session.start_datetime) > new Date();
    if (filter === 'past') return session.status === 'completed' || new Date(session.start_datetime) < new Date();
    return session.type === filter;
  });

  const sortedSessions = [...filteredSessions].sort((a, b) => 
    new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
  );

  const upcomingSessions = sessions
    .filter(s => s.status === 'scheduled' && new Date(s.start_datetime) > new Date())
    .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())
    .slice(0, 3);

  const completedSessions = sessions.filter(s => s.status === 'completed' || new Date(s.start_datetime) < new Date());
  const totalSessions = sessions.filter(s => s.type === 'chimio').length;
  const progress = totalSessions > 0 ? Math.round((completedSessions.length / totalSessions) * 100) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const supabase = createClient();
      
      // Récupérer l'utilisateur actuel
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        alert('Erreur d\'authentification');
        return;
      }

      const sessionData = {
        id: editingSession?.id,
        user_id: user.id,
        type: formData.type,
        title: formData.title,
        description: formData.description || null,
        status: editingSession?.status || 'scheduled',
        start_datetime: formData.start_datetime,
        end_datetime: formData.end_datetime || null,
        location: formData.location || null,
        doctor_name: formData.doctor_name || null,
        notes: formData.notes || null,
        updated_at: new Date().toISOString(),
      };

      if (editingSession) {
        // Mettre à jour
        const { data: updatedData, error: updateError } = await supabase
          .from('treatment_sessions')
          .update(sessionData)
          .eq('id', editingSession.id)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Error updating session:', updateError);
          alert('Erreur lors de la modification du rendez-vous');
          return;
        }

        setSessions(sessions.map(s => s.id === editingSession.id ? updatedData as TreatmentSession : s));
      } else {
        // Créer
        const { data: newData, error: insertError } = await supabase
          .from('treatment_sessions')
          .insert({
            ...sessionData,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) {
          console.error('❌ Error creating session:', insertError);
          alert('Erreur lors de la création du rendez-vous');
          return;
        }

        setSessions([...sessions, newData as TreatmentSession]);
      }

      // Reset form
      setFormData({
        type: 'consultation',
        title: '',
        description: '',
        start_datetime: '',
        end_datetime: '',
        location: '',
        doctor_name: '',
        notes: '',
      });
      setShowAddForm(false);
      setEditingSession(null);
    } catch (error) {
      console.error('💥 Unexpected error:', error);
      alert('Une erreur inattendue s\'est produite');
    }
  };

  const handleEdit = (session: TreatmentSession) => {
    setEditingSession(session);
    setFormData({
      type: session.type,
      title: session.title,
      description: session.description || '',
      start_datetime: session.start_datetime.split('T')[0] + 'T' + session.start_datetime.split('T')[1].slice(0, 5),
      end_datetime: session.end_datetime ? session.end_datetime.split('T')[0] + 'T' + session.end_datetime.split('T')[1].slice(0, 5) : '',
      location: session.location || '',
      doctor_name: session.doctor_name || '',
      notes: session.notes || '',
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Es-tu sûre de vouloir supprimer ce rendez-vous ?')) {
      return;
    }

    try {
      const supabase = createClient();
      
      const { error: deleteError } = await supabase
        .from('treatment_sessions')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('❌ Error deleting session:', deleteError);
        alert('Erreur lors de la suppression du rendez-vous');
        return;
      }

      setSessions(sessions.filter(s => s.id !== id));
    } catch (error) {
      console.error('💥 Unexpected error:', error);
      alert('Une erreur inattendue s\'est produite');
    }
  };

  const handleMarkCompleted = async (id: string) => {
    try {
      const supabase = createClient();
      
      const { data: updatedData, error: updateError } = await supabase
        .from('treatment_sessions')
        .update({ 
          status: 'completed' as TreatmentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error marking session as completed:', updateError);
        alert('Erreur lors de la mise à jour');
        return;
      }

      setSessions(sessions.map(s => 
        s.id === id ? updatedData as TreatmentSession : s
      ));
    } catch (error) {
      console.error('💥 Unexpected error:', error);
      alert('Une erreur inattendue s\'est produite');
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

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
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-light text-[var(--text-primary)] mb-4 tracking-tight">
              Mon traitement
            </h1>
            <p className="text-lg text-[var(--text-secondary)]">
              Suis ton parcours médical et tes rendez-vous en un coup d'œil
            </p>
          </div>

          {/* Section "Où en es-tu ?" */}
          {totalSessions > 0 && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border-2 border-[var(--pink-200)]/50 shadow-2xl p-8 mb-8 animate-fade-in">
              <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-6">
                Où en es-tu ?
              </h2>
              <div className="space-y-4">
                <p className="text-lg text-[var(--text-secondary)]">
                  Tu es à la {completedSessions.length}ème séance de chimiothérapie sur {totalSessions} prévues.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-[var(--text-light)]">
                    <span>Progression</span>
                    <span className="font-semibold text-[var(--accent-strong)]">{progress}%</span>
                  </div>
                  <div className="h-4 bg-[var(--pink-100)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[var(--accent-soft)] to-[var(--accent-strong)] rounded-full transition-all duration-1000"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
                {upcomingSessions.length > 0 && (
                  <p className="text-lg text-[var(--text-secondary)] mt-4">
                    Prochaine étape : {upcomingSessions[0].title} le {formatDate(upcomingSessions[0].start_datetime)}.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Prochains rendez-vous */}
          {upcomingSessions.length > 0 && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border-2 border-[var(--lavender-200)]/50 shadow-2xl p-8 mb-8 animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-[var(--accent-strong)]">
                  Prochains rendez-vous
                </h2>
                <button
                  onClick={() => {
                    setFilter('upcoming');
                    document.getElementById('timeline')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-sm text-[var(--accent-strong)] font-semibold hover:underline"
                >
                  Voir tous les rendez-vous →
                </button>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {upcomingSessions.map((session) => {
                  const daysUntil = getDaysUntil(session.start_datetime);
                  return (
                    <div
                      key={session.id}
                      className="p-4 bg-gradient-to-br from-[var(--lavender-50)]/80 to-[var(--pink-50)]/80 rounded-xl border border-[var(--lavender-200)]/50"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{getTreatmentTypeIcon(session.type)}</span>
                        <span className="text-xs font-bold text-[var(--accent-strong)] uppercase">
                          {getTreatmentTypeLabel(session.type)}
                        </span>
                      </div>
                      <p className="font-semibold text-[var(--text-primary)] mb-1">{session.title}</p>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {formatDateTime(session.start_datetime)}
                      </p>
                      {daysUntil <= 7 && (
                        <p className="text-xs text-[var(--accent-strong)] font-semibold mt-2">
                          Dans {daysUntil} jour{daysUntil > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filtres et bouton ajouter */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex flex-wrap gap-2">
              {(['all', 'upcoming', 'past', 'chimio', 'radio', 'consultation'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    filter === f
                      ? 'bg-gradient-to-r from-[var(--accent-soft)] to-[var(--accent-strong)] text-white'
                      : 'bg-white/90 border-2 border-[var(--pink-200)]/50 text-[var(--text-primary)] hover:border-[var(--accent-medium)]'
                  }`}
                >
                  {f === 'all' ? 'Tous' : f === 'upcoming' ? 'À venir' : f === 'past' ? 'Passés' : getTreatmentTypeLabel(f)}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                setEditingSession(null);
                setFormData({
                  type: 'consultation',
                  title: '',
                  description: '',
                  start_datetime: '',
                  end_datetime: '',
                  location: '',
                  doctor_name: '',
                  notes: '',
                });
              }}
              className="px-6 py-3 bg-gradient-to-r from-[var(--button-primary-bg)] via-[var(--pink-600)] to-[var(--button-primary-bg)] text-white rounded-xl font-semibold hover:from-[var(--pink-600)] hover:via-[var(--pink-700)] hover:to-[var(--pink-600)] transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
            >
              {showAddForm ? 'Annuler' : '+ Ajouter un rendez-vous'}
            </button>
          </div>

          {/* Formulaire d'ajout/modification */}
          {showAddForm && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border-2 border-[var(--pink-200)]/50 shadow-2xl p-8 mb-8 animate-fade-in">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">
                {editingSession ? 'Modifier le rendez-vous' : 'Ajouter un rendez-vous'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                      Type de rendez-vous *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as TreatmentType })}
                      className="w-full px-4 py-3 bg-white/90 border-2 border-[var(--pink-200)]/50 rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-medium)] focus:ring-2 focus:ring-[var(--accent-light)] transition-all duration-300"
                      required
                    >
                      <option value="consultation">Consultation</option>
                      <option value="chimio">Chimiothérapie</option>
                      <option value="radio">Radiothérapie</option>
                      <option value="examen">Examen</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                      Titre *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Ex: Consultation oncologue"
                      className="w-full px-4 py-3 bg-white/90 border-2 border-[var(--pink-200)]/50 rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-light)] focus:outline-none focus:border-[var(--accent-medium)] focus:ring-2 focus:ring-[var(--accent-light)] transition-all duration-300"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description du rendez-vous"
                    rows={2}
                    className="w-full px-4 py-3 bg-white/90 border-2 border-[var(--pink-200)]/50 rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-light)] focus:outline-none focus:border-[var(--accent-medium)] focus:ring-2 focus:ring-[var(--accent-light)] transition-all duration-300"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                      Date et heure de début *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.start_datetime}
                      onChange={(e) => setFormData({ ...formData, start_datetime: e.target.value })}
                      className="w-full px-4 py-3 bg-white/90 border-2 border-[var(--pink-200)]/50 rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-medium)] focus:ring-2 focus:ring-[var(--accent-light)] transition-all duration-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                      Date et heure de fin
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.end_datetime}
                      onChange={(e) => setFormData({ ...formData, end_datetime: e.target.value })}
                      className="w-full px-4 py-3 bg-white/90 border-2 border-[var(--pink-200)]/50 rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-medium)] focus:ring-2 focus:ring-[var(--accent-light)] transition-all duration-300"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                      Lieu
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Nom du centre ou de l'hôpital"
                      className="w-full px-4 py-3 bg-white/90 border-2 border-[var(--pink-200)]/50 rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-light)] focus:outline-none focus:border-[var(--accent-medium)] focus:ring-2 focus:ring-[var(--accent-light)] transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                      Avec qui
                    </label>
                    <input
                      type="text"
                      value={formData.doctor_name}
                      onChange={(e) => setFormData({ ...formData, doctor_name: e.target.value })}
                      placeholder="Nom du médecin ou professionnel"
                      className="w-full px-4 py-3 bg-white/90 border-2 border-[var(--pink-200)]/50 rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-light)] focus:outline-none focus:border-[var(--accent-medium)] focus:ring-2 focus:ring-[var(--accent-light)] transition-all duration-300"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                    Notes personnelles
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Notes sur ce rendez-vous"
                    rows={3}
                    className="w-full px-4 py-3 bg-white/90 border-2 border-[var(--pink-200)]/50 rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-light)] focus:outline-none focus:border-[var(--accent-medium)] focus:ring-2 focus:ring-[var(--accent-light)] transition-all duration-300"
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-[var(--button-primary-bg)] via-[var(--pink-600)] to-[var(--button-primary-bg)] text-white rounded-xl font-semibold hover:from-[var(--pink-600)] hover:via-[var(--pink-700)] hover:to-[var(--pink-600)] transition-all duration-300 shadow-xl hover:shadow-2xl"
                  >
                    {editingSession ? 'Modifier' : 'Ajouter ce rendez-vous'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingSession(null);
                    }}
                    className="px-6 py-3 border-2 border-[var(--button-secondary-border)] text-[var(--text-primary)] rounded-xl font-semibold hover:border-[var(--button-secondary-hover-border)] hover:bg-gradient-to-r hover:from-[var(--pink-50)] hover:to-[var(--lavender-50)] transition-all duration-300"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Timeline */}
          <div id="timeline" className="bg-white/80 backdrop-blur-xl rounded-3xl border-2 border-[var(--pink-200)]/50 shadow-2xl p-8 animate-fade-in">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-8">
              Timeline du traitement
            </h2>
            {sortedSessions.length > 0 ? (
              <div className="relative">
                {/* Ligne verticale de la timeline */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[var(--accent-soft)] via-[var(--accent-medium)] to-[var(--accent-strong)]"></div>
                
                <div className="space-y-6">
                  {sortedSessions.map((session, index) => {
                    const isPast = session.status === 'completed' || new Date(session.start_datetime) < new Date();
                    const isUpcoming = session.status === 'scheduled' && new Date(session.start_datetime) > new Date();
                    const daysUntil = getDaysUntil(session.start_datetime);

                    return (
                      <div key={session.id} className="relative flex items-start gap-6">
                        {/* Point sur la timeline */}
                        <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-lg ${
                          isPast
                            ? 'bg-gradient-to-br from-green-400 to-green-600'
                            : isUpcoming
                            ? 'bg-gradient-to-br from-[var(--accent-soft)] to-[var(--accent-strong)]'
                            : 'bg-gradient-to-br from-orange-400 to-orange-600'
                        }`}>
                          {isPast ? '✅' : isUpcoming ? '📅' : '⏳'}
                        </div>

                        {/* Carte de l'événement */}
                        <div className={`flex-1 p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                          isPast
                            ? 'bg-gradient-to-br from-green-50/50 to-white border-green-200/50'
                            : isUpcoming
                            ? 'bg-gradient-to-br from-white to-[var(--pink-50)]/50 border-[var(--pink-200)]/50'
                            : 'bg-gradient-to-br from-orange-50/50 to-white border-orange-200/50'
                        }`}>
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl">{getTreatmentTypeIcon(session.type)}</span>
                                <span className="text-xs font-bold text-[var(--accent-strong)] uppercase tracking-wide">
                                  {getTreatmentTypeLabel(session.type)}
                                </span>
                                {isUpcoming && daysUntil <= 7 && (
                                  <span className="px-2 py-1 bg-[var(--accent-soft)] text-white rounded-full text-xs font-semibold">
                                    Dans {daysUntil} jour{daysUntil > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1">
                                {session.title}
                              </h3>
                              {session.description && (
                                <p className="text-sm text-[var(--text-secondary)] mb-2">
                                  {session.description}
                                </p>
                              )}
                              <p className="text-sm font-semibold text-[var(--text-primary)]">
                                {formatDateTime(session.start_datetime)}
                              </p>
                              {session.location && (
                                <p className="text-sm text-[var(--text-secondary)] flex items-center gap-1 mt-1">
                                  <span>📍</span> {session.location}
                                </p>
                              )}
                              {session.doctor_name && (
                                <p className="text-sm text-[var(--text-secondary)] flex items-center gap-1 mt-1">
                                  <span>👨‍⚕️</span> {session.doctor_name}
                                </p>
                              )}
                              {session.notes && (
                                <p className="text-sm text-[var(--text-secondary)] mt-3 p-3 bg-white/50 rounded-lg italic">
                                  "{session.notes}"
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2 ml-4">
                              {isUpcoming && (
                                <button
                                  onClick={() => handleMarkCompleted(session.id)}
                                  className="px-3 py-1 text-xs font-semibold bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                  title="Marquer comme terminé"
                                >
                                  ✓
                                </button>
                              )}
                              <button
                                onClick={() => handleEdit(session)}
                                className="px-3 py-1 text-xs font-semibold bg-[var(--accent-soft)] text-white rounded-lg hover:bg-[var(--accent-medium)] transition-colors"
                                title="Modifier"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDelete(session.id)}
                                className="px-3 py-1 text-xs font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                title="Supprimer"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-[var(--text-secondary)] mb-4">
                  {filter === 'all' 
                    ? "Tu n'as pas encore de rendez-vous enregistré. Ajoute ton premier rendez-vous pour commencer !"
                    : "Aucun rendez-vous ne correspond à ce filtre."}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
