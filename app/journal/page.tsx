'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import type { JournalEntry, JournalContext, JournalMoodLabel } from '@/types/database';

const motivationalMessages = [
  "Prends le temps dont tu as besoin. Cet espace est à toi. 🌸",
  "Il n'y a pas de bonne ou de mauvaise façon d'écrire. Laisse-toi guider.",
  "Chaque mot que tu écris est un pas vers toi-même.",
  "Cet espace est sûr. Exprime-toi librement.",
];

const guidedQuestions = {
  jour_difficile: [
    "Qu'est-ce qui rend cette journée difficile ?",
    "Qu'est-ce qui t'a aidée aujourd'hui, même un tout petit peu ?",
    "Qu'est-ce que tu aimerais laisser partir ?",
    "Qui ou quoi t'a soutenue aujourd'hui ?",
  ],
  jour_joie: [
    "Qu'est-ce qui t'a fait sourire ou te sentir bien aujourd'hui ?",
    "Quelle petite victoire veux-tu célébrer ?",
    "Qui ou quoi t'a apporté de la lumière aujourd'hui ?",
    "Comment veux-tu te souvenir de ce moment ?",
  ],
  pas_par_ou_commencer: [
    "Comment te sens-tu en ce moment, physiquement et émotionnellement ?",
    "Qu'est-ce qui occupe ton esprit en ce moment ?",
    "Qu'est-ce qui t'a marquée aujourd'hui, même de façon subtile ?",
    "Pour quoi es-tu reconnaissante aujourd'hui ?",
  ],
};

const writingExercises = [
  {
    id: 'lettre-futur',
    title: 'Lettre à mon futur moi',
    description: 'Écris une lettre à la personne que tu seras dans 3 ou 6 mois. Que veux-tu lui dire ?',
    duration: '10-15 minutes',
    template: 'Cher futur moi...',
  },
  {
    id: 'forces-interieures',
    title: 'Mes forces intérieures',
    description: 'Liste tes ressources, tes qualités, ce qui te fait tenir. Reviens-y quand tu en as besoin.',
    duration: '5-10 minutes',
    template: 'Mes forces sont...',
  },
  {
    id: 'gratitude',
    title: 'Journal de gratitude',
    description: 'Note 3 choses pour lesquelles tu es reconnaissante aujourd\'hui, même petites.',
    duration: '5 minutes',
    template: 'Aujourd\'hui, je suis reconnaissante pour...',
  },
  {
    id: 'liberation',
    title: 'Libération émotionnelle',
    description: 'Écris ce que tu veux laisser partir aujourd\'hui.',
    duration: '10 minutes',
    template: 'Je veux laisser partir...',
  },
  {
    id: 'visualisation',
    title: 'Visualisation positive',
    description: 'Imagine-toi dans quelques mois. Comment te vois-tu ? Qu\'est-ce qui t\'aide à avancer ?',
    duration: '10-15 minutes',
    template: 'Dans quelques mois, je me vois...',
  },
  {
    id: 'corps',
    title: 'Conversation avec mon corps',
    description: 'Écris une lettre à ton corps. Remercie-le pour ce qu\'il fait, écoute ce qu\'il a à te dire.',
    duration: '10-15 minutes',
    template: 'Cher corps...',
  },
];

export default function JournalPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [writingMode, setWritingMode] = useState<'free' | 'guided' | 'template' | null>(null);
  const [selectedContext, setSelectedContext] = useState<JournalContext | ''>('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [content, setContent] = useState('');
  const [showBreathingExercise, setShowBreathingExercise] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<typeof writingExercises[0] | null>(null);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null);
  const [filter, setFilter] = useState<'all' | '7j' | '30j' | '3m'>('all');
  const [supportMessage, setSupportMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Charger les entrées depuis Supabase
  useEffect(() => {
    const loadEntries = async () => {
      try {
        const supabase = createClient();
        
        // Récupérer l'utilisateur actuel
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.error('❌ Error getting user:', authError);
          router.push('/login');
          return;
        }

        // Charger toutes les entrées de l'utilisateur
        const { data: entriesData, error: entriesError } = await supabase
          .from('journal_entries')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!entriesError && entriesData) {
          setEntries(entriesData as JournalEntry[]);
        } else if (entriesError) {
          console.error('❌ Error loading entries:', entriesError);
        }
      } catch (error) {
        console.error('💥 Error loading entries:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEntries();
  }, [router]);

  // Recharger les entrées quand le filtre change
  useEffect(() => {
    const loadFilteredEntries = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;

        let query = supabase
          .from('journal_entries')
          .select('*')
          .eq('user_id', user.id);

        if (filter !== 'all') {
          const today = new Date();
          const startDate = new Date();
          
          switch (filter) {
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

          query = query.gte('created_at', startDate.toISOString());
        }

        const { data: entriesData } = await query.order('created_at', { ascending: false });

        if (entriesData) {
          setEntries(entriesData as JournalEntry[]);
        }
      } catch (error) {
        console.error('💥 Error loading filtered entries:', error);
      }
    };

    loadFilteredEntries();
  }, [filter]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = today.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays <= 7) return `Il y a ${diffDays} jours`;
    
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getContextLabel = (context?: string): string => {
    const labels: Record<string, string> = {
      apres_rdv: 'Après mon rendez-vous',
      jour_difficile: 'Jour difficile',
      jour_joie: 'Jour de joie',
      gratitude: 'Gratitude',
      liberation: 'Libération',
    };
    return context ? labels[context] || context : '';
  };

  const handleSave = async () => {
    if (!content.trim()) {
      alert('Le contenu ne peut pas être vide');
      return;
    }

    setIsSaving(true);

    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ Auth error:', authError);
        alert('Erreur d\'authentification. Veuillez vous reconnecter.');
        setIsSaving(false);
        return;
      }

      // Sauvegarder le contenu avant le reset pour le message de soutien
      const savedContent = content.trim().toLowerCase();

      if (editingEntry) {
        // Mettre à jour l'entrée existante
        const updateData: any = {
          content: content.trim(),
          updated_at: new Date().toISOString(),
        };

        updateData.context = (selectedContext && selectedContext.trim()) ? selectedContext.trim() : null;

        const { data: updatedEntry, error: updateError } = await supabase
          .from('journal_entries')
          .update(updateData)
          .eq('id', editingEntry.id)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Error updating entry:', updateError);
          const errorMessage = (updateError as any).message || (updateError as any).code || String(updateError);
          alert(`Erreur lors de la modification : ${errorMessage}`);
          setIsSaving(false);
          return;
        }

        if (!updatedEntry) {
          alert('Erreur : aucune entrée retournée après modification');
          setIsSaving(false);
          return;
        }

        setEntries(entries.map(e => e.id === editingEntry.id ? updatedEntry as JournalEntry : e));
      } else {
        // Créer une nouvelle entrée
        const insertData = {
          user_id: user.id,
          content: content.trim(),
          context: (selectedContext && selectedContext.trim()) ? selectedContext.trim() : null,
        };

        console.log('🔍 Inserting entry into journal_entries:', {
          user_id: insertData.user_id,
          content_length: insertData.content.length,
          context: insertData.context,
        });

        const { data: newEntry, error: insertError } = await supabase
          .from('journal_entries')
          .insert(insertData)
          .select()
          .single();

        if (insertError) {
          console.error('❌ Error creating entry:', insertError);
          console.error('❌ Error code:', (insertError as any).code);
          console.error('❌ Error message:', (insertError as any).message);
          
          const errorCode = (insertError as any).code;
          const errorMessage = (insertError as any).message || String(insertError);
          
          let helpMessage = '';
          if (errorCode === '42501' || errorMessage.includes('row-level security') || errorMessage.includes('RLS') || errorMessage.includes('policy') || errorMessage.includes('permission denied')) {
            helpMessage = '\n\n💡 SOLUTION : Vérifie que les RLS policies sont bien créées dans Supabase.';
          } else if (errorMessage.includes('null value') || errorMessage.includes('NOT NULL')) {
            helpMessage = '\n\n💡 Solution : Vérifie que la colonne id a bien une valeur par défaut (gen_random_uuid()) dans Supabase.';
          }
          
          alert(`Erreur lors de la sauvegarde : ${errorMessage}${helpMessage}`);
          setIsSaving(false);
          return;
        }

        if (!newEntry) {
          alert('Erreur : aucune entrée retournée après création');
          setIsSaving(false);
          return;
        }

        console.log('✅ Entry created successfully:', newEntry);
        setEntries([newEntry as JournalEntry, ...entries]);
      }

      // Générer un message de soutien basé sur le contenu sauvegardé
      if (savedContent.includes('difficile') || savedContent.includes('fatigue') || savedContent.includes('fatigué')) {
        setSupportMessage("Tu as traversé une journée difficile. C'est normal de ressentir cela. Tu es forte, même quand tu ne le sens pas. 🌸");
      } else if (savedContent.includes('joie') || savedContent.includes('bien') || savedContent.includes('heureux')) {
        setSupportMessage("C'est beau de voir ces moments de lumière. Garde-les précieusement, ils font partie de ta force.");
      } else {
        setSupportMessage("Tu as pris le temps d'écrire aujourd'hui. C'est déjà un acte de bienveillance envers toi-même. 🌸");
      }

      // Reset
      setContent('');
      setWritingMode(null);
      setSelectedContext('');
      setCurrentQuestionIndex(0);
      setEditingEntry(null);
    } catch (error) {
      console.error('💥 Unexpected error:', error);
      alert(`Une erreur inattendue s'est produite : ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Es-tu sûre de vouloir supprimer cette entrée ?')) {
      return;
    }

    try {
      const supabase = createClient();
      
      const { error: deleteError } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('❌ Error deleting entry:', deleteError);
        alert('Erreur lors de la suppression de l\'entrée');
        return;
      }

      setEntries(entries.filter(e => e.id !== id));
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

  const filteredEntries = entries.filter(entry => {
    if (filter === 'all') return true;
    const entryDate = new Date(entry.created_at);
    const today = new Date();
    const diffTime = today.getTime() - entryDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (filter === '7j') return diffDays <= 7;
    if (filter === '30j') return diffDays <= 30;
    if (filter === '3m') return diffDays <= 90;
    return true;
  });

  const currentQuestions = selectedContext && selectedContext in guidedQuestions
    ? guidedQuestions[selectedContext as keyof typeof guidedQuestions]
    : [];

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[var(--beige-50)] via-white to-[var(--pink-50)] relative overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--pink-200)] border-t-[var(--pink-600)] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Chargement de ton journal...</p>
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
          {/* Message bienveillant */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-light text-[var(--text-primary)] mb-4 tracking-tight">
              Mon Espace Perso
            </h1>
            <p className="text-lg text-[var(--text-secondary)] mb-6">
              {motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]}
            </p>
            <button
              onClick={() => setShowBreathingExercise(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-[var(--lavender-100)] to-[var(--lavender-200)] text-[var(--text-primary)] rounded-xl font-semibold hover:from-[var(--lavender-200)] hover:to-[var(--lavender-300)] transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <span className="text-xl">🌬️</span>
              Prendre une pause
            </button>
          </div>

          {/* Exercice de respiration */}
          {showBreathingExercise && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
              <div className="bg-white/95 backdrop-blur-xl rounded-3xl border-2 border-[var(--pink-200)]/50 shadow-2xl p-8 max-w-md w-full">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6 text-center">
                  Exercice de respiration
                </h2>
                <div className="text-center space-y-6">
                  <div className="w-32 h-32 mx-auto bg-gradient-to-br from-[var(--accent-soft)] to-[var(--accent-strong)] rounded-full flex items-center justify-center animate-gentle-pulse">
                    <span className="text-5xl">🌬️</span>
                  </div>
                  <p className="text-[var(--text-secondary)]">
                    Inspire lentement par le nez... puis expire doucement par la bouche.
                  </p>
                  <p className="text-sm text-[var(--text-light)]">
                    Répète 5 fois. Prends ton temps.
                  </p>
                  <button
                    onClick={() => {
                      setShowBreathingExercise(false);
                      setSupportMessage("Tu es prête à écrire quand tu veux. 🌸");
                    }}
                    className="w-full px-6 py-3 bg-gradient-to-r from-[var(--button-primary-bg)] via-[var(--pink-600)] to-[var(--button-primary-bg)] text-white rounded-xl font-semibold hover:from-[var(--pink-600)] hover:via-[var(--pink-700)] hover:to-[var(--pink-600)] transition-all duration-300"
                  >
                    J'ai terminé
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Message de soutien */}
          {supportMessage && (
            <div className="bg-gradient-to-br from-[var(--pink-50)]/80 to-[var(--lavender-50)]/80 rounded-xl border-2 border-[var(--pink-200)]/50 shadow-lg p-6 mb-8 animate-fade-in">
              <p className="text-center text-[var(--text-secondary)] mb-4">{supportMessage}</p>
              <div className="flex justify-center gap-4">
                <Link
                  href="/bien-etre"
                  className="text-sm text-[var(--accent-strong)] font-semibold hover:underline"
                >
                  Faire un exercice de respiration →
                </Link>
                <Link
                  href="/plan-du-jour"
                  className="text-sm text-[var(--accent-strong)] font-semibold hover:underline"
                >
                  Adapter mon plan du jour →
                </Link>
              </div>
              <button
                onClick={() => setSupportMessage(null)}
                className="mt-4 mx-auto block text-sm text-[var(--text-light)] hover:text-[var(--text-primary)]"
              >
                Fermer
              </button>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8">
            {/* Section Écrire */}
            <div className="space-y-8">
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl border-2 border-[var(--pink-200)]/50 shadow-2xl p-8 animate-fade-in">
                <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-6">
                  Écrire aujourd'hui
                </h2>

                {!writingMode ? (
                  <div className="space-y-4">
                    <button
                      onClick={() => setWritingMode('free')}
                      className="w-full p-6 bg-gradient-to-br from-white to-[var(--pink-50)]/50 border-2 border-[var(--pink-200)]/50 rounded-xl hover:border-[var(--accent-medium)] transition-all duration-300 text-left"
                    >
                      <span className="text-2xl block mb-2">✍️</span>
                      <span className="text-lg font-semibold text-[var(--text-primary)] block mb-1">
                        Mode libre
                      </span>
                      <span className="text-sm text-[var(--text-secondary)]">
                        Écris ce qui te passe par la tête. Il n'y a pas de règles ici.
                      </span>
                    </button>

                    <button
                      onClick={() => setWritingMode('guided')}
                      className="w-full p-6 bg-gradient-to-br from-white to-[var(--lavender-50)]/50 border-2 border-[var(--lavender-200)]/50 rounded-xl hover:border-[var(--lavender-300)] transition-all duration-300 text-left"
                    >
                      <span className="text-2xl block mb-2">💝</span>
                      <span className="text-lg font-semibold text-[var(--text-primary)] block mb-1">
                        Mode guidé
                      </span>
                      <span className="text-sm text-[var(--text-secondary)]">
                        Réponds à des questions bienveillantes pour t'aider à commencer.
                      </span>
                    </button>

                    <button
                      onClick={() => setWritingMode('template')}
                      className="w-full p-6 bg-gradient-to-br from-white to-[var(--pink-50)]/50 border-2 border-[var(--pink-200)]/50 rounded-xl hover:border-[var(--accent-medium)] transition-all duration-300 text-left"
                    >
                      <span className="text-2xl block mb-2">📝</span>
                      <span className="text-lg font-semibold text-[var(--text-primary)] block mb-1">
                        Utiliser un template
                      </span>
                      <span className="text-sm text-[var(--text-secondary)] block mb-3">
                        Choisis un exercice d'écriture thérapeutique.
                      </span>

                      {/* Aperçu rapide sous forme de badges */}
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-[var(--accent-soft)] to-[var(--accent-strong)] text-white shadow-sm">
                          Lettre à mon futur moi · 10-15 min
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-[var(--pink-100)] to-[var(--pink-200)] text-[var(--text-primary)] shadow-sm">
                          Forces intérieures · 5-10 min
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-[var(--lavender-100)] to-[var(--lavender-200)] text-[var(--text-primary)] shadow-sm">
                          Gratitude · 5 min
                        </span>
                      </div>
                    </button>
                  </div>
                ) : writingMode === 'free' ? (
                  <div className="space-y-4">
                    <button
                      onClick={() => { setWritingMode(null); setContent(''); setEditingEntry(null); }}
                      className="text-sm text-[var(--accent-strong)] font-semibold hover:underline"
                    >
                      ← Retour
                    </button>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Écris ce qui te passe par la tête. Il n'y a pas de règles ici."
                      rows={12}
                      disabled={isSaving}
                      className="w-full px-4 py-3 bg-white/90 border-2 border-[var(--pink-200)]/50 rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-light)] focus:outline-none focus:border-[var(--accent-medium)] focus:ring-2 focus:ring-[var(--accent-light)] transition-all duration-300 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <div className="flex gap-4">
                      <button
                        onClick={handleSave}
                        disabled={!content.trim() || isSaving}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-[var(--button-primary-bg)] via-[var(--pink-600)] to-[var(--button-primary-bg)] text-white rounded-xl font-semibold hover:from-[var(--pink-600)] hover:via-[var(--pink-700)] hover:to-[var(--pink-600)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isSaving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Enregistrement...
                          </>
                        ) : (
                          'Enregistrer'
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setWritingMode(null);
                          setContent('');
                          setEditingEntry(null);
                        }}
                        className="px-6 py-3 border-2 border-[var(--button-secondary-border)] text-[var(--text-primary)] rounded-xl font-semibold hover:border-[var(--button-secondary-hover-border)] transition-all duration-300"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : writingMode === 'guided' ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => { setWritingMode(null); setSelectedContext(''); setContent(''); setCurrentQuestionIndex(0); }}
                        className="text-sm text-[var(--accent-strong)] font-semibold hover:underline"
                      >
                        ← Retour
                      </button>
                      {selectedContext && (
                        <button
                          onClick={() => { setSelectedContext(''); setContent(''); setCurrentQuestionIndex(0); }}
                          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        >
                          Changer de contexte
                        </button>
                      )}
                    </div>
                    {!selectedContext ? (
                      <div className="space-y-3">
                        <p className="text-[var(--text-secondary)] mb-4">
                          Choisis un contexte pour commencer :
                        </p>
                        {[
                          { value: 'jour_difficile', label: 'Un jour difficile', emoji: '😔' },
                          { value: 'jour_joie', label: 'Un jour de joie', emoji: '😊' },
                          { value: 'pas_par_ou_commencer', label: 'Je ne sais pas par où commencer', emoji: '🤔' },
                        ].map((ctx) => (
                          <button
                            key={ctx.value}
                            onClick={() => setSelectedContext(ctx.value as JournalContext)}
                            className="w-full p-4 bg-gradient-to-br from-white to-[var(--pink-50)]/50 border-2 border-[var(--pink-200)]/50 rounded-xl hover:border-[var(--accent-medium)] transition-all duration-300 text-left"
                          >
                            <span className="text-xl mr-2">{ctx.emoji}</span>
                            <span className="font-semibold text-[var(--text-primary)]">{ctx.label}</span>
                          </button>
                        ))}
                        <button
                          onClick={() => setWritingMode('free')}
                          className="w-full p-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        >
                          Je veux juste écrire librement →
                        </button>
                      </div>
                    ) : currentQuestions.length > 0 ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-gradient-to-br from-[var(--pink-50)]/80 to-[var(--lavender-50)]/80 rounded-xl border border-[var(--pink-200)]/50">
                          <p className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                            {currentQuestions[currentQuestionIndex]}
                          </p>
                          <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Ta réponse..."
                            rows={6}
                            disabled={isSaving}
                            className="w-full px-4 py-3 bg-white/90 border-2 border-[var(--pink-200)]/50 rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-light)] focus:outline-none focus:border-[var(--accent-medium)] transition-all duration-300 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>
                        <div className="flex gap-4">
                          {currentQuestionIndex < currentQuestions.length - 1 ? (
                            <button
                              onClick={() => {
                                setCurrentQuestionIndex(currentQuestionIndex + 1);
                                setContent('');
                              }}
                              className="flex-1 px-6 py-3 bg-gradient-to-r from-[var(--accent-soft)] to-[var(--accent-medium)] text-white rounded-xl font-semibold hover:from-[var(--accent-medium)] hover:to-[var(--accent-strong)] transition-all duration-300"
                            >
                              Question suivante →
                            </button>
                          ) : (
                            <button
                              onClick={handleSave}
                              disabled={!content.trim() || isSaving}
                              className="flex-1 px-6 py-3 bg-gradient-to-r from-[var(--button-primary-bg)] via-[var(--pink-600)] to-[var(--button-primary-bg)] text-white rounded-xl font-semibold hover:from-[var(--pink-600)] hover:via-[var(--pink-700)] hover:to-[var(--pink-600)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              {isSaving ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  Enregistrement...
                                </>
                              ) : (
                                "J'ai fini de répondre"
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedContext('');
                              setCurrentQuestionIndex(0);
                              setContent('');
                            }}
                            className="px-6 py-3 border-2 border-[var(--button-secondary-border)] text-[var(--text-primary)] rounded-xl font-semibold hover:border-[var(--button-secondary-hover-border)] transition-all duration-300"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : writingMode === 'template' ? (
                  <div className="space-y-4">
                    <button
                      onClick={() => { setWritingMode(null); setSelectedExercise(null); setContent(''); }}
                      className="text-sm text-[var(--accent-strong)] font-semibold hover:underline"
                    >
                      ← Retour
                    </button>
                    {!selectedExercise ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {writingExercises.map((exercise) => (
                          <button
                            key={exercise.id}
                            onClick={() => {
                              setSelectedExercise(exercise);
                              setContent(exercise.template + '\n\n');
                            }}
                            className="w-full p-4 bg-gradient-to-br from-white to-[var(--pink-50)]/50 border-2 border-[var(--pink-200)]/50 rounded-xl hover:border-[var(--accent-medium)] transition-all duration-300 text-left"
                          >
                            <span className="text-lg font-semibold text-[var(--text-primary)] block mb-1">
                              {exercise.title}
                            </span>
                            <span className="text-sm text-[var(--text-secondary)] block mb-2">
                              {exercise.description}
                            </span>
                            <span className="text-xs text-[var(--text-light)]">
                              ⏱️ {exercise.duration}
                            </span>
                          </button>
                        ))}
                        <button
                          onClick={() => setWritingMode(null)}
                          className="w-full p-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        >
                          Retour
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-4 bg-gradient-to-br from-[var(--pink-50)]/80 to-[var(--lavender-50)]/80 rounded-xl border border-[var(--pink-200)]/50">
                          <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                            {selectedExercise.title}
                          </h3>
                          <p className="text-sm text-[var(--text-secondary)] mb-2">
                            {selectedExercise.description}
                          </p>
                        </div>
                        <textarea
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder={selectedExercise.template}
                          rows={10}
                          disabled={isSaving}
                          className="w-full px-4 py-3 bg-white/90 border-2 border-[var(--pink-200)]/50 rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-light)] focus:outline-none focus:border-[var(--accent-medium)] transition-all duration-300 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <div className="flex gap-4">
                          <button
                            onClick={handleSave}
                            disabled={!content.trim() || isSaving}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-[var(--button-primary-bg)] via-[var(--pink-600)] to-[var(--button-primary-bg)] text-white rounded-xl font-semibold hover:from-[var(--pink-600)] hover:via-[var(--pink-700)] hover:to-[var(--pink-600)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {isSaving ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Enregistrement...
                              </>
                            ) : (
                              'Enregistrer'
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedExercise(null);
                              setContent('');
                            }}
                            className="px-6 py-3 border-2 border-[var(--button-secondary-border)] text-[var(--text-primary)] rounded-xl font-semibold hover:border-[var(--button-secondary-hover-border)] transition-all duration-300"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Section Mes écrits */}
            <div className="space-y-8">
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl border-2 border-[var(--pink-200)]/50 shadow-2xl p-8 animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
                    Mes écrits
                  </h2>
                  <div className="flex gap-2">
                    {(['all', '7j', '30j', '3m'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-300 ${
                          filter === f
                            ? 'bg-gradient-to-r from-[var(--accent-soft)] to-[var(--accent-strong)] text-white'
                            : 'bg-[var(--pink-100)] text-[var(--text-primary)] hover:bg-[var(--pink-200)]'
                        }`}
                      >
                        {f === 'all' ? 'Tous' : f === '7j' ? '7j' : f === '30j' ? '30j' : '3m'}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredEntries.length > 0 ? (
                  <div className="space-y-4">
                    {filteredEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-4 bg-gradient-to-br from-white to-[var(--pink-50)]/50 rounded-xl border border-[var(--pink-200)]/50 hover:border-[var(--accent-medium)] transition-all duration-300 cursor-pointer"
                        onClick={() => setViewingEntry(entry)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">
                              {formatDate(entry.created_at)}
                            </p>
                            {entry.context && (
                              <p className="text-xs text-[var(--accent-strong)] font-semibold mt-1">
                                {getContextLabel(entry.context)}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingEntry(entry);
                                setContent(entry.content);
                                setSelectedContext(entry.context || '');
                                setWritingMode('free');
                              }}
                              className="text-xs px-2 py-1 bg-[var(--accent-soft)] text-white rounded-lg hover:bg-[var(--accent-medium)] transition-colors"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(entry.id);
                              }}
                              className="text-xs px-2 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] line-clamp-3">
                          {entry.content}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-[var(--text-secondary)]">
                      {filter === 'all'
                        ? "Cet espace t'attend. Tu peux commencer par écrire librement ou répondre à une question guidée."
                        : "Aucune entrée ne correspond à ce filtre."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modal de lecture complète */}
      {viewingEntry && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl border-2 border-[var(--pink-200)]/50 shadow-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-lg font-semibold text-[var(--text-primary)]">
                  {formatDate(viewingEntry.created_at)}
                </p>
                {viewingEntry.context && (
                  <p className="text-sm text-[var(--accent-strong)] font-semibold mt-1">
                    {getContextLabel(viewingEntry.context)}
                  </p>
                )}
              </div>
              <button
                onClick={() => setViewingEntry(null)}
                className="text-2xl text-[var(--text-light)] hover:text-[var(--text-primary)]"
              >
                ×
              </button>
            </div>
            <p className="text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
              {viewingEntry.content}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}