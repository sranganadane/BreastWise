'use client';

import { useMemo, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

// Import des données d'exercices depuis la page principale (ou créer un fichier séparé)
const exercises: Record<string, { title: string; description: string; duration: string; category: string; emoji: string }> = {
  // Respiration
  'resp-478': { title: 'Respiration 4-7-8', description: 'Inspire 4s, retiens 7s, expire 8s pour calmer.', duration: '5 min', category: 'respiration', emoji: '🌬️' },
  'resp-coherence': { title: 'Cohérence cardiaque', description: '6 respirations/minute, rythme régulier.', duration: '5 min', category: 'respiration', emoji: '💙' },
  'resp-express': { title: 'Respiration express (1 minute)', description: 'Inspire 4s, retiens 2s, expire 6s. Répète 6 fois. Tu peux fermer les yeux et poser une main sur ton cœur.', duration: '1 min', category: 'respiration', emoji: '🌸' },
  'resp-douce': { title: 'Respiration douce', description: 'Respiration libre, observer sans jugement.', duration: '3-5 min', category: 'respiration', emoji: '🌸' },
  'resp-douleur': { title: 'Respiration pour la douleur', description: 'Respiration profonde + visualisation de détente.', duration: '5-10 min', category: 'respiration', emoji: '🕯️' },
  
  // Visualisation
  'visu-lieu-sur': { title: 'Mon lieu sûr', description: 'Visualiser un endroit où tu te sens en sécurité.', duration: '10 min', category: 'visualisation', emoji: '🏞️' },
  'visu-reparatrice': { title: 'Visualisation réparatrice', description: 'Imaginer le corps qui se régénère, lumière apaisante.', duration: '15 min', category: 'visualisation', emoji: '🌙' },
  
  // Méditation
  'med-pleine-conscience': { title: 'Méditation de pleine conscience', description: 'Observer souffle et pensées sans jugement.', duration: '5-15 min', category: 'meditation', emoji: '🧘' },
  'med-bienveillance': { title: 'Méditation de bienveillance', description: 'Cultiver la douceur envers toi-même.', duration: '10 min', category: 'meditation', emoji: '💝' },
  
  // Relaxation
  'relax-progressive': { title: 'Relaxation progressive', description: 'Contracter/relâcher chaque groupe musculaire.', duration: '15-20 min', category: 'relaxation', emoji: '🌊' },
  
  // Mouvement
  'move-assis': { title: 'Étirements assis', description: 'Étirements très doux adaptés à la fatigue.', duration: '5-10 min', category: 'mouvement', emoji: '🤲' },
  'move-fluide': { title: 'Mouvement fluide', description: 'Mouvements lents, comme une danse douce.', duration: '10 min', category: 'mouvement', emoji: '🌊' },
  'move-reveil': { title: 'Réveil corporel doux', description: 'Micro-mouvements pour réveiller le corps sans forcer.', duration: '5 min', category: 'energie', emoji: '🌅' },
  
  // Grounding
  'ground-5-sens': { title: 'Technique des 5 sens', description: 'Se reconnecter au présent par les sens.', duration: '5 min', category: 'grounding', emoji: '🌍' },
  'ground-ancrage': { title: 'Ancrage émotionnel', description: 'Observer et accueillir ses émotions, s\'ancrer.', duration: '5-10 min', category: 'grounding', emoji: '🌳' },
  
  // Créatif
  'crea-coloriage': { title: 'Coloriage apaisant', description: 'Colorier mandalas/motifs pour se concentrer et se détendre.', duration: '10-30 min', category: 'creatif', emoji: '🎨' },
  'crea-dessin': { title: 'Dessin libre', description: 'Dessiner sans jugement, laisser la main guider.', duration: '10-20 min', category: 'creatif', emoji: '✏️' },
  'crea-peinture': { title: 'Peinture intuitive', description: 'Peindre avec 2-3 couleurs qui résonnent avec ton émotion.', duration: '15-30 min', category: 'creatif', emoji: '🖌️' },
  'crea-lettre': { title: 'Écrire une lettre à soi-même', description: 'Lettre bienveillante "Chère moi…".', duration: '10-15 min', category: 'creatif', emoji: '💌' },
  'crea-collage': { title: 'Collage d\'émotions', description: 'Découper des images/mots/couleurs qui résonnent.', duration: '15-20 min', category: 'creatif', emoji: '✂️' },
  'crea-musique': { title: 'Musique & dessin', description: 'Laisser la musique guider le trait.', duration: '10-15 min', category: 'creatif', emoji: '🎵' },
  'crea-poeme': { title: 'Poème / haïku', description: 'Exprimer une émotion en quelques mots.', duration: '5-10 min', category: 'creatif', emoji: '📝' },
  'crea-tricot': { title: 'Tricot / Crochet', description: 'Rythme répétitif apaisant, quelques rangs pour se recentrer.', duration: '10-30 min', category: 'creatif', emoji: '🧶' },
  'crea-broderie': { title: 'Broderie / Point simple', description: 'Gestes lents et précis pour calmer l\'esprit.', duration: '10-30 min', category: 'creatif', emoji: '🪡' },
  'crea-pliage': { title: 'Pliage doux / Origami simple', description: 'Plier du papier en douceur pour apaiser et se concentrer.', duration: '10-20 min', category: 'creatif', emoji: '📄' },
  
  // Gratitude
  'gratitude-3': { title: '3 gratitudes', description: 'Noter 3 petites choses positives du jour.', duration: '5 min', category: 'gratitude', emoji: '🌷' },
  
  // Apaisement
  'apais-auto-compassion': { title: 'Auto-compassion', description: 'Main sur le cœur, respiration + phrase douce pour soi.', duration: '3 min', category: 'apaisement', emoji: '🤍' },
  'apais-resp-libre': { title: 'Respiration libre', description: 'Respirer sans contrainte, en conscience, pour se détendre.', duration: '3-5 min', category: 'apaisement', emoji: '😌' },
};

// Patterns de respiration (pour les exercices de respiration)
const breathingPatterns: Record<string, { inhale: number; hold: number; exhale: number }> = {
  'resp-478': { inhale: 4, hold: 7, exhale: 8 },
  'resp-coherence': { inhale: 5, hold: 0, exhale: 5 },
  'resp-express': { inhale: 4, hold: 2, exhale: 6 },
  'resp-douce': { inhale: 4, hold: 1, exhale: 5 },
  'resp-douleur': { inhale: 4, hold: 2, exhale: 6 },
  'apais-resp-libre': { inhale: 4, hold: 1, exhale: 5 },
};

type Phase = 'inhale' | 'hold' | 'exhale';

// Composant pour exercices de respiration
function BreathingExercise({ exerciseId, exercise }: { exerciseId: string; exercise: typeof exercises[string] }) {
  const pattern = breathingPatterns[exerciseId];
  const [phase, setPhase] = useState<Phase>('inhale');
  const [counter, setCounter] = useState(pattern?.inhale ?? 0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (pattern) {
      setCounter(pattern.inhale);
      setPhase('inhale');
      setRunning(false);
    }
  }, [pattern]);

  useEffect(() => {
    if (!pattern || !running) return;
    const interval = setInterval(() => {
      setCounter((c) => {
        if (c > 1) return c - 1;
        setPhase((p) => {
          if (p === 'inhale') {
            setCounter(pattern.hold || 1);
            return pattern.hold > 0 ? 'hold' : 'exhale';
          }
          if (p === 'hold') {
            setCounter(pattern.exhale);
            return 'exhale';
          }
          setCounter(pattern.inhale);
          return 'inhale';
        });
        return c;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [pattern, running]);

  const phaseLabel = phase === 'inhale' ? 'Inspire' : phase === 'hold' ? 'Retiens' : 'Expire';

  return (
    <>
      <div className="flex flex-col items-center gap-4">
        <div 
          className={`w-40 h-40 rounded-full border-2 flex items-center justify-center shadow-inner transition-all duration-500 ${
            phase === 'inhale' 
              ? 'bg-gradient-to-br from-[var(--pink-200)] to-[var(--pink-300)] border-[var(--pink-300)] scale-110' 
              : phase === 'hold'
              ? 'bg-gradient-to-br from-[var(--lavender-200)] to-[var(--lavender-300)] border-[var(--lavender-300)] scale-100'
              : 'bg-gradient-to-br from-[var(--pink-100)] to-[var(--lavender-100)] border-[var(--pink-200)] scale-90'
          }`}
        >
          <div className="text-center">
            <div className="text-sm text-[var(--text-light)] mb-1">{phaseLabel}</div>
            <div className="text-5xl font-bold text-[var(--text-primary)] tabular-nums">{counter}</div>
            <div className="text-xs text-[var(--text-secondary)] mt-1">secondes</div>
          </div>
        </div>
        <div className="text-sm text-[var(--text-light)]">
          Cycle : {pattern.inhale}s inspire
          {pattern.hold ? ` • ${pattern.hold}s retient` : ''} • {pattern.exhale}s expire
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        <button
          onClick={() => setRunning((r) => !r)}
          className="px-5 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[var(--button-primary-bg)] via-[var(--pink-600)] to-[var(--button-primary-bg)] hover:from-[var(--pink-600)] hover:via-[var(--pink-700)] hover:to-[var(--pink-600)] shadow-lg transition-all duration-300 hover:scale-105"
        >
          {running ? 'Pause' : 'Démarrer'}
        </button>
        <button
          onClick={() => {
            setRunning(false);
            setPhase('inhale');
            setCounter(pattern.inhale);
          }}
          className="px-4 py-3 rounded-xl font-semibold border border-[var(--pink-200)] text-[var(--text-primary)] bg-white hover:border-[var(--accent-medium)] transition-all duration-300"
        >
          Réinitialiser
        </button>
      </div>
    </>
  );
}

// Composant pour exercices guidés (visualisation, méditation, relaxation)
function GuidedExercise({ exercise }: { exercise: typeof exercises[string] }) {
  const [running, setRunning] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setTimeElapsed((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div className="flex flex-col items-center gap-6">
        <div className="text-6xl mb-4">{exercise.emoji}</div>
        <div className="text-center space-y-2">
          <p className="text-lg text-[var(--text-secondary)]">
            {running ? 'En cours...' : 'Prêt à commencer ?'}
          </p>
          {running && (
            <p className="text-3xl font-bold text-[var(--accent-strong)]">
              {formatTime(timeElapsed)}
            </p>
          )}
        </div>
        <div className="bg-[var(--pink-50)]/60 border border-[var(--pink-200)]/50 rounded-xl p-6 max-w-md">
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
            {exercise.description}
          </p>
          <p className="text-[var(--text-secondary)] text-sm mt-4 italic">
            Installe-toi confortablement, ferme les yeux si tu veux, et laisse-toi guider.
          </p>
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        <button
          onClick={() => setRunning((r) => !r)}
          className="px-5 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[var(--button-primary-bg)] via-[var(--pink-600)] to-[var(--button-primary-bg)] hover:from-[var(--pink-600)] hover:via-[var(--pink-700)] hover:to-[var(--pink-600)] shadow-lg transition-all duration-300 hover:scale-105"
        >
          {running ? 'Pause' : 'Démarrer'}
        </button>
        {running && (
          <button
            onClick={() => {
              setRunning(false);
              setTimeElapsed(0);
            }}
            className="px-4 py-3 rounded-xl font-semibold border border-[var(--pink-200)] text-[var(--text-primary)] bg-white hover:border-[var(--accent-medium)] transition-all duration-300"
          >
            Arrêter
          </button>
        )}
      </div>
    </>
  );
}

// Composant pour exercices créatifs
function CreativeExercise({ exerciseId, exercise }: { exerciseId: string; exercise: typeof exercises[string] }) {
  const instructions: Record<string, { steps: string[]; material?: string; special?: string }> = {
    'crea-coloriage': {
      steps: [
        '1. Télécharge ou imprime un mandala (liens fournis ci-dessous)',
        '2. Choisis des couleurs douces qui te font du bien',
        '3. Colorie sans pression, à ton rythme',
        '4. Concentre-toi sur le geste, laisse ton esprit se détendre',
      ],
      material: 'Mandalas à imprimer ou cahier de coloriage',
      special: 'Le coloriage est une méditation active. Chaque trait compte, pas le résultat final.',
    },
    'crea-dessin': {
      steps: [
        '1. Prends un crayon et du papier (ce que tu as sous la main)',
        '2. Laisse ta main guider, pas besoin de savoir dessiner',
        '3. Dessine ce qui te passe par la tête, sans jugement',
        '4. L\'important, c\'est de créer, pas le résultat',
      ],
      material: 'Papier, crayons, feutres',
      special: 'Dessine librement, sans objectif. Laisse ton intuition guider ta main.',
    },
    'crea-peinture': {
      steps: [
        '1. Choisis 2-3 couleurs qui résonnent avec ton émotion du moment',
        '2. Peins librement avec les doigts ou un pinceau',
        '3. Laisse les couleurs exprimer ce que tu ressens',
        '4. Pas besoin d\'être artiste, juste créer pour toi',
      ],
      material: 'Peinture (aquarelle, gouache), papier épais, pinceaux ou doigts',
      special: 'La peinture intuitive, c\'est laisser les couleurs parler pour toi. Choisis celles qui te font du bien.',
    },
    'crea-lettre': {
      steps: [
        '1. Commence par "Chère moi..."',
        '2. Écris avec bienveillance, comme à une amie chère',
        '3. Remercie-toi pour ce que tu traverses',
        '4. Sois douce avec toi-même, reconnais ta force',
      ],
      material: 'Papier et stylo, ou dans ton journal',
      special: 'Écris comme tu parlerais à une amie qui traverse la même chose. Sois bienveillante.',
    },
    'crea-collage': {
      steps: [
        '1. Rassemble des magazines, photos, papiers colorés',
        '2. Découpe des images, mots, couleurs qui résonnent avec ce que tu ressens',
        '3. Crée un collage libre, sans règles',
        '4. Laisse ton intuition guider, assemble ce qui te parle',
      ],
      material: 'Magazines, ciseaux, colle, papier',
      special: 'Le collage, c\'est assembler des fragments qui te parlent. Crée une composition qui te ressemble.',
    },
    'crea-musique': {
      steps: [
        '1. Mets une musique douce et apaisante (playlist fournie ou ton choix)',
        '2. Ferme les yeux et écoute quelques instants',
        '3. Prends un crayon et du papier',
        '4. Sans regarder, laisse ta main dessiner au rythme de la musique',
        '5. Laisse la musique guider ton trait, pas ton esprit',
      ],
      material: 'Musique (playlist apaisante), papier, crayon',
      special: 'La musique guide ton crayon. Ferme les yeux, écoute, et laisse ta main danser sur le papier.',
    },
    'crea-poeme': {
      steps: [
        '1. Exprime une émotion ou un moment en quelques mots',
        '2. Pas besoin d\'être poète, juste écrire ce qui vient',
        '3. Un haïku : 3 lignes (5-7-5 syllabes)',
        '4. Ou simplement quelques mots qui te font du bien',
      ],
      material: 'Papier et stylo, ou dans ton journal',
      special: 'Exemple de haïku : "Dans le silence / Je respire doucement / Un moment à moi"',
    },
    'crea-tricot': {
      steps: [
        '1. Si tu sais tricoter/crocheter, fais quelques rangs',
        '2. Si non, apprends un point simple (tutoriel fourni)',
        '3. Le rythme répétitif est apaisant',
        '4. Concentre-toi sur le geste, laisse ton esprit se détendre',
      ],
      material: 'Laine, aiguilles ou crochet',
      special: 'Le tricot, c\'est la répétition apaisante. Chaque point compte, chaque rang t\'ancrera.',
    },
    'crea-broderie': {
      steps: [
        '1. Choisis un motif simple ou libre',
        '2. Gestes lents et précis pour calmer l\'esprit',
        '3. Le point par point, sans précipitation',
        '4. Chaque point compte, prends ton temps',
      ],
      material: 'Fil, aiguille, tissu ou toile',
      special: 'La broderie, c\'est la précision douce. Chaque point est une méditation.',
    },
    'crea-pliage': {
      steps: [
        '1. Plie du papier en douceur',
        '2. Commence par des formes simples (origami débutant)',
        '3. Concentre-toi sur la précision du geste',
        '4. L\'important, c\'est le processus, pas le résultat',
      ],
      material: 'Papier (carrés de préférence)',
      special: 'Le pliage, c\'est la concentration douce. Chaque pli est une intention.',
    },
  };

  const exerciseData = instructions[exerciseId] || {
    steps: [
      '1. Prends le temps dont tu as besoin',
      '2. Crée sans jugement',
      '3. L\'important, c\'est de prendre soin de toi',
    ],
  };

  return (
    <>
      <div className="flex flex-col items-center gap-6">
        <div className="text-6xl mb-4">{exercise.emoji}</div>
        
        {/* Instructions spécifiques */}
        <div className="bg-[var(--pink-50)]/60 border border-[var(--pink-200)]/50 rounded-xl p-6 max-w-md w-full space-y-4">
          <h3 className="font-bold text-[var(--text-primary)] mb-4">Instructions :</h3>
          <ul className="space-y-3 text-[var(--text-secondary)] text-sm">
            {exerciseData.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[var(--accent-strong)] mt-1">•</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
          
          {/* Matériel nécessaire */}
          {exerciseData.material && (
            <div className="mt-4 pt-4 border-t border-[var(--pink-200)]/50">
              <p className="text-xs font-semibold text-[var(--accent-strong)] uppercase mb-2">Matériel nécessaire :</p>
              <p className="text-sm text-[var(--text-secondary)]">{exerciseData.material}</p>
            </div>
          )}
          
          {/* Note spéciale */}
          {exerciseData.special && (
            <div className="mt-4 pt-4 border-t border-[var(--pink-200)]/50">
              <p className="text-sm text-[var(--text-secondary)] italic">
                💡 {exerciseData.special}
              </p>
            </div>
          )}
        </div>
        
        <p className="text-[var(--text-secondary)] text-sm italic text-center max-w-md">
          Il n'y a pas besoin d'être artiste. L'important, c'est de créer pour toi. Prends le temps dont tu as besoin. 🌸
        </p>
      </div>
    </>
  );
}

// Composant pour exercices de gratitude
function GratitudeExercise({ exercise }: { exercise: typeof exercises[string] }) {
  const [gratitudes, setGratitudes] = useState(['', '', '']);

  return (
    <>
      <div className="flex flex-col items-center gap-6">
        <div className="text-6xl mb-4">{exercise.emoji}</div>
        <div className="bg-[var(--pink-50)]/60 border border-[var(--pink-200)]/50 rounded-xl p-6 max-w-md w-full space-y-4">
          <h3 className="font-bold text-[var(--text-primary)] mb-4 text-center">
            Note 3 petites choses positives du jour :
          </h3>
          {gratitudes.map((grat, i) => (
            <div key={i} className="space-y-1">
              <label className="text-sm text-[var(--text-secondary)]">
                Gratitude {i + 1} :
              </label>
              <input
                type="text"
                value={grat}
                onChange={(e) => {
                  const newGratitudes = [...gratitudes];
                  newGratitudes[i] = e.target.value;
                  setGratitudes(newGratitudes);
                }}
                placeholder={`Ex: Un moment de calme, une personne qui m'a souri...`}
                className="w-full px-4 py-2 rounded-lg border border-[var(--pink-200)] bg-white focus:outline-none focus:border-[var(--accent-medium)] transition-colors"
              />
            </div>
          ))}
        </div>
        <p className="text-[var(--text-secondary)] text-sm italic text-center max-w-md">
          Prends le temps de noter ce qui t'a fait du bien aujourd'hui, même les petites choses. 🌸
        </p>
      </div>
    </>
  );
}

// Composant pour exercices de grounding (5 sens)
function GroundingExercise({ exercise }: { exercise: typeof exercises[string] }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string[]>>({
    0: [], // 5 choses vues
    1: [], // 4 choses touchées
    2: [], // 3 choses entendues
    3: [], // 2 choses senties
    4: [], // 1 chose goûtée
  });

  const steps = [
    { label: '5 choses que tu vois', count: 5, emoji: '👁️' },
    { label: '4 choses que tu touches', count: 4, emoji: '✋' },
    { label: '3 choses que tu entends', count: 3, emoji: '👂' },
    { label: '2 choses que tu sens', count: 2, emoji: '👃' },
    { label: '1 chose que tu goûtes', count: 1, emoji: '👅' },
  ];

  const handleAdd = (stepIndex: number, value: string) => {
    if (!value.trim()) return;
    const newAnswers = { ...answers };
    if (!newAnswers[stepIndex]) newAnswers[stepIndex] = [];
    if (newAnswers[stepIndex].length < steps[stepIndex].count) {
      newAnswers[stepIndex] = [...newAnswers[stepIndex], value.trim()];
      setAnswers(newAnswers);
    }
  };

  if (exercise.id === 'ground-5-sens') {
    return (
      <>
        <div className="flex flex-col items-center gap-6">
          <div className="text-6xl mb-4">{exercise.emoji}</div>
          <div className="bg-[var(--pink-50)]/60 border border-[var(--pink-200)]/50 rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-bold text-[var(--text-primary)] mb-4 text-center">
              {steps[currentStep].emoji} {steps[currentStep].label}
            </h3>
            <div className="space-y-2">
              {answers[currentStep]?.map((ans, i) => (
                <div key={i} className="px-3 py-2 bg-white rounded-lg border border-[var(--pink-200)]">
                  {ans}
                </div>
              ))}
              {answers[currentStep]?.length < steps[currentStep].count && (
                <input
                  type="text"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAdd(currentStep, e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                  placeholder={`Ajoute une ${steps[currentStep].label.toLowerCase()}...`}
                  className="w-full px-4 py-2 rounded-lg border border-[var(--pink-200)] bg-white focus:outline-none focus:border-[var(--accent-medium)] transition-colors"
                />
              )}
            </div>
            <div className="flex gap-2 justify-center mt-4">
              {currentStep > 0 && (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-4 py-2 rounded-lg border border-[var(--pink-200)] text-[var(--text-primary)] bg-white hover:border-[var(--accent-medium)] transition-colors"
                >
                  ← Précédent
                </button>
              )}
              {currentStep < steps.length - 1 && answers[currentStep]?.length === steps[currentStep].count && (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-[var(--pink-600)] to-[var(--pink-700)] text-white hover:from-[var(--pink-700)] hover:to-[var(--pink-800)] transition-colors"
                >
                  Suivant →
                </button>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  // Ancrage émotionnel (autre exercice de grounding)
  return (
    <>
      <div className="flex flex-col items-center gap-6">
        <div className="text-6xl mb-4">{exercise.emoji}</div>
        <div className="bg-[var(--pink-50)]/60 border border-[var(--pink-200)]/50 rounded-xl p-6 max-w-md">
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
            {exercise.description}
          </p>
          <p className="text-[var(--text-secondary)] text-sm mt-4 italic">
            Prends quelques instants pour observer tes émotions, les accueillir avec bienveillance, et t'ancrer dans le présent.
          </p>
        </div>
      </div>
    </>
  );
}

// Composant principal
export default function ExercisePage() {
  const params = useParams();
  const exerciseId = params?.exerciseId as string;

  const exercise = useMemo(() => {
    if (!exerciseId) return undefined;
    return exercises[exerciseId];
  }, [exerciseId]);

  if (!exercise) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--beige-50)] via-white to-[var(--pink-50)]">
        <div className="text-center space-y-4 bg-white/80 backdrop-blur-xl border-2 border-[var(--pink-200)]/50 shadow-2xl rounded-3xl p-8">
          <p className="text-[var(--text-secondary)]">
            Exercice introuvable. ID: {exerciseId || 'non défini'}
          </p>
          <Link href="/bien-etre" className="text-[var(--accent-strong)] underline hover:text-[var(--accent-medium)] transition-colors">
            ← Retour à l'espace bien-être
          </Link>
        </div>
      </main>
    );
  }

  // Déterminer le type d'exercice et afficher le bon composant
  const isBreathing = exercise.category === 'respiration' || breathingPatterns[exerciseId];
  const isGuided = ['visualisation', 'meditation', 'relaxation'].includes(exercise.category);
  const isCreative = exercise.category === 'creatif';
  const isGratitude = exercise.category === 'gratitude';
  const isGrounding = exercise.category === 'grounding';
  const isApaisement = exercise.category === 'apaisement';

  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--beige-50)] via-white to-[var(--pink-50)] relative px-4 py-10">
      <div className="exercise-card max-w-xl w-full mx-auto bg-white/80 backdrop-blur-xl border-2 border-[var(--pink-200)]/50 shadow-2xl rounded-3xl p-8 space-y-6 text-center relative">
        {/* Bouton retour */}
        <Link
          href="/bien-etre"
          className="absolute top-4 left-4 z-10 w-10 h-10 flex items-center justify-center bg-white/90 backdrop-blur-md border-2 border-[var(--pink-200)]/50 rounded-full shadow-lg hover:bg-white hover:border-[var(--accent-medium)] hover:scale-110 transition-all duration-300 text-[var(--text-primary)] text-xl"
        >
          ←
        </Link>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-[var(--accent-strong)] uppercase">
            {exercise.category === 'respiration' ? 'Respiration guidée' :
             exercise.category === 'visualisation' ? 'Visualisation guidée' :
             exercise.category === 'meditation' ? 'Méditation guidée' :
             exercise.category === 'relaxation' ? 'Relaxation guidée' :
             exercise.category === 'mouvement' ? 'Mouvement doux' :
             exercise.category === 'grounding' ? 'Ancrage' :
             exercise.category === 'creatif' ? 'Activité créative' :
             exercise.category === 'gratitude' ? 'Gratitude' :
             exercise.category === 'apaisement' ? 'Apaisement' :
             'Exercice'}
          </p>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">{exercise.title}</h1>
          <p className="text-[var(--text-secondary)]">{exercise.description}</p>
        </div>

        {/* Afficher le bon composant selon le type */}
        {isBreathing && <BreathingExercise exerciseId={exerciseId} exercise={exercise} />}
        {isGuided && <GuidedExercise exercise={exercise} />}
        {isCreative && <CreativeExercise exerciseId={exerciseId} exercise={exercise} />}
        {isGratitude && <GratitudeExercise exercise={exercise} />}
        {isGrounding && <GroundingExercise exercise={exercise} />}
        {isApaisement && exercise.id === 'apais-auto-compassion' && (
          <div className="flex flex-col items-center gap-6">
            <div className="text-6xl mb-4">{exercise.emoji}</div>
            <div className="bg-[var(--pink-50)]/60 border border-[var(--pink-200)]/50 rounded-xl p-6 max-w-md">
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4">
                {exercise.description}
              </p>
              <p className="text-[var(--text-secondary)] text-sm italic">
                Pose une main sur ton cœur, respire doucement, et répète une phrase bienveillante pour toi.
              </p>
            </div>
          </div>
        )}

        {!isBreathing && !isGuided && !isCreative && !isGratitude && !isGrounding && !isApaisement && (
          <div className="flex flex-col items-center gap-6">
            <div className="text-6xl mb-4">{exercise.emoji}</div>
            <div className="bg-[var(--pink-50)]/60 border border-[var(--pink-200)]/50 rounded-xl p-6 max-w-md">
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                {exercise.description}
              </p>
            </div>
          </div>
        )}

        <p className="text-[var(--text-secondary)] text-sm italic">
          Tu peux t'arrêter quand tu veux. Prends soin de toi. 🌸
        </p>
      </div>

      <style jsx>{`
        .exercise-card {
          animation: exercise-float-glow 6s ease-in-out infinite;
        }
        @keyframes exercise-float-glow {
          0%, 100% { 
            transform: translateY(0); 
            box-shadow: 0 10px 30px rgba(232, 132, 150, 0.2);
          }
          50% { 
            transform: translateY(-8px); 
            box-shadow: 0 15px 40px rgba(232, 132, 150, 0.4);
          }
        }
      `}</style>
    </main>
  );
}
