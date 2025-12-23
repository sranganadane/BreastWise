'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type ExerciseCategory =
  | 'respiration'
  | 'visualisation'
  | 'meditation'
  | 'relaxation'
  | 'mouvement'
  | 'grounding'
  | 'creatif'
  | 'gratitude'
  | 'apaisement'
  | 'energie';

type Exercise = {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: ExerciseCategory;
  emoji: string;
};

const exercises: Exercise[] = [
  // Respiration
  { id: 'resp-478', title: 'Respiration 4-7-8', description: 'Inspire 4s, retiens 7s, expire 8s pour calmer.', duration: '5 min', category: 'respiration', emoji: '🌬️' },
  { id: 'resp-coherence', title: 'Cohérence cardiaque', description: '6 respirations/minute pour harmoniser et apaiser.', duration: '5 min', category: 'respiration', emoji: '💙' },
  { id: 'resp-express', title: 'Respiration express (1 minute)', description: 'Inspire 4s, retiens 2s, expire 6s. Répète 6 fois. Tu peux fermer les yeux et poser une main sur ton cœur.', duration: '1 min', category: 'respiration', emoji: '🌸' },
  { id: 'resp-douce', title: 'Respiration douce', description: 'Respiration libre, observer sans jugement.', duration: '3-5 min', category: 'respiration', emoji: '🌸' },
  { id: 'resp-douleur', title: 'Respiration pour la douleur', description: 'Respiration profonde + visualisation de détente.', duration: '5-10 min', category: 'respiration', emoji: '🕯️' },

  // Visualisation
  { id: 'visu-lieu-sur', title: 'Mon lieu sûr', description: 'Visualiser un endroit où tu te sens en sécurité.', duration: '10 min', category: 'visualisation', emoji: '🏞️' },
  { id: 'visu-reparatrice', title: 'Visualisation réparatrice', description: 'Imaginer le corps qui se régénère, lumière apaisante.', duration: '15 min', category: 'visualisation', emoji: '🌙' },

  // Méditation
  { id: 'med-pleine-conscience', title: 'Méditation de pleine conscience', description: 'Observer souffle et pensées sans jugement.', duration: '5-15 min', category: 'meditation', emoji: '🧘' },
  { id: 'med-bienveillance', title: 'Méditation de bienveillance', description: 'Cultiver la douceur envers toi-même.', duration: '10 min', category: 'meditation', emoji: '💝' },

  // Relaxation
  { id: 'relax-progressive', title: 'Relaxation progressive', description: 'Contracter/relâcher chaque groupe musculaire.', duration: '15-20 min', category: 'relaxation', emoji: '🌊' },

  // Mouvement doux / énergie
  { id: 'move-assis', title: 'Étirements assis', description: 'Étirements très doux adaptés à la fatigue.', duration: '5-10 min', category: 'mouvement', emoji: '🤲' },
  { id: 'move-fluide', title: 'Mouvement fluide', description: 'Mouvements lents, comme une danse douce.', duration: '10 min', category: 'mouvement', emoji: '🌊' },
  { id: 'move-reveil', title: 'Réveil corporel doux', description: 'Micro-mouvements pour réveiller le corps sans forcer.', duration: '5 min', category: 'energie', emoji: '🌅' },

  // Grounding / ancrage
  { id: 'ground-5-sens', title: 'Technique des 5 sens', description: 'Se reconnecter au présent par les sens.', duration: '5 min', category: 'grounding', emoji: '🌍' },
  { id: 'ground-ancrage', title: 'Ancrage émotionnel', description: 'Observer et accueillir ses émotions, s\'ancrer.', duration: '5-10 min', category: 'grounding', emoji: '🌳' },

  // Créatif & artistique / expression
  { id: 'crea-coloriage', title: 'Coloriage apaisant', description: 'Colorier mandalas/motifs pour se concentrer et se détendre.', duration: '10-30 min', category: 'creatif', emoji: '🎨' },
  { id: 'crea-dessin', title: 'Dessin libre', description: 'Dessiner sans jugement, laisser la main guider.', duration: '10-20 min', category: 'creatif', emoji: '✏️' },
  { id: 'crea-peinture', title: 'Peinture intuitive', description: 'Peindre avec 2-3 couleurs qui résonnent avec ton émotion.', duration: '15-30 min', category: 'creatif', emoji: '🖌️' },
  { id: 'crea-lettre', title: 'Écrire une lettre à soi-même', description: 'Lettre bienveillante "Chère moi…".', duration: '10-15 min', category: 'creatif', emoji: '💌' },
  { id: 'crea-collage', title: 'Collage d\'émotions', description: 'Découper des images/mots/couleurs qui résonnent.', duration: '15-20 min', category: 'creatif', emoji: '✂️' },
  { id: 'crea-musique', title: 'Musique & dessin', description: 'Laisser la musique guider le trait.', duration: '10-15 min', category: 'creatif', emoji: '🎵' },
  { id: 'crea-poeme', title: 'Poème / haïku', description: 'Exprimer une émotion en quelques mots.', duration: '5-10 min', category: 'creatif', emoji: '📝' },

  // Apaisement / gratitude
  { id: 'gratitude-3', title: '3 gratitudes', description: 'Noter 3 petites choses positives du jour.', duration: '5 min', category: 'gratitude', emoji: '🌷' },
  { id: 'apais-auto-compassion', title: 'Auto-compassion', description: 'Main sur le cœur, respiration + phrase douce pour soi.', duration: '3 min', category: 'apaisement', emoji: '🤍' },
  { id: 'apais-resp-libre', title: 'Respiration libre', description: 'Respirer sans contrainte, en conscience, pour se détendre.', duration: '3-5 min', category: 'apaisement', emoji: '😌' },
  { id: 'crea-tricot', title: 'Tricot / Crochet', description: 'Rythme répétitif apaisant, quelques rangs pour se recentrer.', duration: '10-30 min', category: 'creatif', emoji: '🧶' },
  { id: 'crea-broderie', title: 'Broderie / Point simple', description: 'Gestes lents et précis pour calmer l\'esprit.', duration: '10-30 min', category: 'creatif', emoji: '🪡' },
  { id: 'crea-pliage', title: 'Pliage doux / Origami simple', description: 'Plier du papier en douceur pour apaiser et se concentrer.', duration: '10-20 min', category: 'creatif', emoji: '📄' },
];

const categoryLabels: Record<ExerciseCategory | 'all', string> = {
  all: 'Tous',
  respiration: 'Respiration',
  visualisation: 'Visualisation',
  meditation: 'Méditation',
  relaxation: 'Relaxation',
  mouvement: 'Mouvement doux',
  grounding: 'Ancrage',
  creatif: 'Créatif',
  gratitude: 'Gratitude',
  apaisement: 'Apaisement',
  energie: 'Énergie',
};

export default function BienEtrePage() {
  const [filter, setFilter] = useState<ExerciseCategory | 'all'>('all');

  const filtered = filter === 'all'
    ? exercises
    : exercises.filter((ex) => ex.category === filter);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--beige-50)] via-white to-[var(--pink-50)] relative overflow-hidden">
      {/* Décors */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-[var(--pink-300)] to-[var(--pink-400)] rounded-full blur-[140px] opacity-25 animate-gentle-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-[var(--lavender-300)] to-[var(--lavender-200)] rounded-full blur-[140px] opacity-25 animate-gentle-pulse" style={{ animationDelay: '2s' }}></div>

      {/* Nav */}
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
              className="nav-button px-4 py-2 text-sm font-semibold text-[var(--text-primary)] border-2 border-[var(--button-secondary-border)] rounded-xl hover:border-[var(--button-secondary-hover-border)] hover:bg-gradient-to-r hover:from-[var(--pink-50)] hover:to-[var(--lavender-50)] transition-all duration-300 hover:scale-105 hover:shadow-md"
            >
              ← Retour au tableau de bord
            </Link>
            <Link
              href="/"
              className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-[var(--pink-600)] to-[var(--pink-700)] rounded-xl hover:from-[var(--pink-700)] hover:to-[var(--pink-800)] transition-all duration-300 hover:scale-105 hover:shadow-md"
              style={{ color: '#ffffff' }}
            >
            Se déconnecter
            </Link>
          </div>
        </div>
      </nav>

      {/* Contenu */}
      <section className="relative px-6 py-10 md:py-14 z-10">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Hero */}
          <div className="flex flex-col items-center text-center space-y-4 md:space-y-6 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-light text-[var(--text-primary)] tracking-tight">
              Espace bien-être
            </h1>
            <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-3xl leading-relaxed">
              Des exercices doux pour respirer, apaiser, te ressourcer. Choisis ce qui te fait du bien, à ton rythme.
            </p>
          </div>

          {/* Filtres */}
          <div className="flex flex-wrap justify-center gap-3">
            {(['all', 'respiration', 'visualisation', 'meditation', 'creatif', 'mouvement', 'grounding', 'apaisement', 'energie'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  filter === cat
                    ? 'bg-gradient-to-r from-[var(--accent-soft)] to-[var(--accent-strong)] text-white shadow-lg'
                    : 'bg-white/90 border-2 border-[var(--pink-200)]/50 text-[var(--text-primary)] hover:border-[var(--accent-medium)]'
                }`}
              >
                {categoryLabels[cat]}
              </button>
            ))}
          </div>

          {/* Grille d'exercices */}
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {filtered.map((ex) => (
              <div
                key={ex.id}
                className="bien-etre-card group relative bg-white/80 backdrop-blur-xl rounded-3xl border-2 border-[var(--pink-200)]/50 shadow-2xl p-6 hover:border-[var(--accent-medium)] hover:shadow-[0_25px_60px_rgba(232,132,150,0.25)] transition-all duration-500 overflow-hidden transform translate-y-0 hover:-translate-y-2"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[var(--pink-200)]/30 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{ex.emoji}</span>
                    <div>
                      <p className="text-xs font-semibold text-[var(--accent-strong)] uppercase">
                        {categoryLabels[ex.category]}
                      </p>
                      <h3 className="text-xl font-bold text-[var(--text-primary)]">{ex.title}</h3>
                    </div>
                  </div>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    {ex.description}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-[var(--text-light)]">
                    <span>⏱️ {ex.duration}</span>
                  </div>
                  <Link
                    href={`/bien-etre/${ex.id}`}
                    className="w-full mt-2 px-4 py-3 inline-flex justify-center items-center bg-gradient-to-r from-[var(--pink-600)] to-[var(--pink-700)] text-white rounded-xl font-bold text-base shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 border-[var(--pink-500)]/30"
                    style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
                  >
                    Démarrer →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Bloc respiration rapide */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border-2 border-[var(--pink-200)]/50 shadow-2xl p-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[var(--accent-strong)] uppercase">Besoin d'une pause ?</p>
                <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Respiration express (1 minute)</h2>
                <p className="text-[var(--text-secondary)] max-w-2xl">
                  Inspire 4s, retiens 2s, expire 6s. Répète 6 fois. Tu peux fermer les yeux et poser une main sur ton cœur.
                </p>
              </div>
              <Link
                href="/bien-etre/resp-express"
                className="self-start px-6 py-3 bg-gradient-to-r from-[var(--button-primary-bg)] via-[var(--pink-600)] to-[var(--button-primary-bg)] text-white rounded-xl font-semibold hover:from-[var(--pink-600)] hover:via-[var(--pink-700)] hover:to-[var(--pink-600)] transition-all duration-300 shadow-xl hover:shadow-2xl"
                style={{ color: '#ffffff' }}
              >
                Lancer la minute calme
              </Link>
            </div>
          </div>

          {/* Moments doux */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border-2 border-[var(--pink-200)]/50 shadow-2xl p-8 animate-fade-in">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-4">
              Petits rappels bienveillants
            </h2>
            <div className="grid md:grid-cols-3 gap-4 text-[var(--text-secondary)]">
              <div className="p-4 bg-[var(--pink-50)]/60 border border-[var(--pink-200)]/50 rounded-xl">
                🌸 Tu peux faire une pause quand tu veux. Cet espace est là pour toi.
              </div>
              <div className="p-4 bg-[var(--lavender-50)]/60 border border-[var(--lavender-200)]/50 rounded-xl">
                💗 Chaque respiration calme ton corps. Prends ton temps.
              </div>
              <div className="p-4 bg-[var(--pink-50)]/60 border border-[var(--pink-200)]/50 rounded-xl">
                ✨ Les petits pas comptent. Tu avances, à ton rythme.
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .bien-etre-card {
          animation: be-float 6s ease-in-out infinite;
        }
        .bien-etre-card:hover {
          animation-play-state: paused;
        }
        @keyframes be-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .nav-button {
          animation: nav-float 4s ease-in-out infinite;
        }
        @keyframes nav-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </main>
  );
}