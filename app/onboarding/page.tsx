'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { DailyState, TreatmentSession, DayPlan, DayTask, TreatmentType, TaskCategory, TaskPriority } from '@/types/database';

type TreatmentStatusPhase = 'none' | 'diagnostic' | 'in_treatment' | 'follow_up' | 'unknown';
type TreatmentTypeOption = 'chimio' | 'radio' | 'chirurgie' | 'hormono' | 'immuno' | 'autre';
type PlanChoice = 'yes' | 'no' | '';

const MOOD_OPTIONS = [
  { emoji: '😌', label: 'Calme', value: 'calme' },
  { emoji: '😰', label: 'Anxieuse', value: 'anxieuse' },
  { emoji: '😴', label: 'Fatiguée', value: 'fatiguee' },
  { emoji: '💪', label: 'Motivée', value: 'motivee' },
  { emoji: '😢', label: 'Triste', value: 'triste' },
  { emoji: '☺️', label: 'Sereine', value: 'sereine' },
  { emoji: '😟', label: 'Inquiète', value: 'inquiete' },
  { emoji: '🌟', label: 'Optimiste', value: 'optimiste' },
];

const ENERGY_LABELS = {
  1: 'Très faible',
  2: 'Faible',
  3: 'Moyen',
  4: 'Bon',
  5: 'Très bonne',
};

const FATIGUE_LABELS = {
  1: 'Pas fatiguée',
  2: 'Légèrement fatiguée',
  3: 'Modérément fatiguée',
  4: 'Très fatiguée',
  5: 'Extrêmement fatiguée',
};

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Étape 1: Bienvenue (pas de données)
  
  // Étape 2: État du jour
  const [energyLevel, setEnergyLevel] = useState(3);
  const [fatigueLevel, setFatigueLevel] = useState(3);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [dailyNote, setDailyNote] = useState('');

  // Étape 3: Traitement
  const [treatmentPhase, setTreatmentPhase] = useState<TreatmentStatusPhase | ''>('');
  const [selectedTreatmentTypes, setSelectedTreatmentTypes] = useState<TreatmentTypeOption[]>([]);
  
  // Détails chimiothérapie
  const [chimioStartDate, setChimioStartDate] = useState('');
  const [chimioTotalSessions, setChimioTotalSessions] = useState(1);
  const [chimioCurrentSession, setChimioCurrentSession] = useState(1);
  const [chimioFrequency, setChimioFrequency] = useState('');
  const [chimioNextDate, setChimioNextDate] = useState('');
  const [chimioNextTime, setChimioNextTime] = useState('');
  const [chimioLocation, setChimioLocation] = useState('');
  const [chimioDoctor, setChimioDoctor] = useState('');

  // Détails radiothérapie
  const [radioStartDate, setRadioStartDate] = useState('');
  const [radioTotalSessions, setRadioTotalSessions] = useState(1);
  const [radioCurrentSession, setRadioCurrentSession] = useState(1);
  const [radioFrequency, setRadioFrequency] = useState('');
  const [radioNextDate, setRadioNextDate] = useState('');
  const [radioNextTime, setRadioNextTime] = useState('');
  const [radioLocation, setRadioLocation] = useState('');
  const [radioDoctor, setRadioDoctor] = useState('');

  // Chirurgie
  const [surgeryStatus, setSurgeryStatus] = useState<'done' | 'planned' | 'unknown'>('unknown');
  const [surgeryTypes, setSurgeryTypes] = useState<string[]>([]);
  const [surgeryDate, setSurgeryDate] = useState('');
  const [surgeryLocation, setSurgeryLocation] = useState('');
  const [surgeryDoctor, setSurgeryDoctor] = useState('');

  // Autres rendez-vous
  const [appointments, setAppointments] = useState<Array<{
    type: 'consultation' | 'examen' | 'autre';
    datetime: string;
    with: string;
    location: string;
    notes: string;
  }>>([]);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    type: 'consultation' as 'consultation' | 'examen' | 'autre',
    date: '',
    time: '',
    with: '',
    location: '',
    notes: '',
  });

  // Équipe médicale
  const [medicalTeam, setMedicalTeam] = useState<Array<{
    name: string;
    specialty: string;
    location: string;
  }>>([]);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [newTeamMember, setNewTeamMember] = useState({
    name: '',
    specialty: '',
    location: '',
  });

  // Étape 4: Plan du jour
  const [planChoice, setPlanChoice] = useState<PlanChoice>('');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<DayTask[]>([]);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'quotidien' as TaskCategory,
    priority: 'medium' as TaskPriority,
    scheduledTime: '',
  });

  // Récupérer le prénom de l'utilisateur depuis Supabase
  const [userFirstName, setUserFirstName] = useState('');

  useEffect(() => {
    // Récupérer le prénom depuis Supabase
    const fetchUserFirstName = async () => {
      // D'abord, vérifier le localStorage pour un affichage immédiat
      const cachedFirstName = localStorage.getItem('user_first_name');
      if (cachedFirstName) {
        setUserFirstName(cachedFirstName);
      }

      try {
        const supabase = createClient();
        
        // Récupérer l'utilisateur connecté
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.error('❌ Error getting user:', authError);
          // Garder le prénom du localStorage si erreur
          return;
        }

        // Récupérer le prénom depuis la table users
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('first_name')
          .eq('id', user.id)
          .single();

        if (userError) {
          console.error('❌ Error fetching user data:', userError);
          // Garder le prénom du localStorage si erreur
          return;
        }

        // Utiliser le prénom de la base de données (remplace celui du localStorage)
        const firstName = userData?.first_name || '';
        setUserFirstName(firstName);
        
        // Mettre à jour le localStorage avec la valeur de la DB
        if (firstName) {
          localStorage.setItem('user_first_name', firstName);
        } else if (cachedFirstName) {
          // Si pas de prénom en DB mais qu'on en a un en cache, le garder
          // Ne rien faire, on garde déjà le cache
        }
      } catch (error) {
        console.error('💥 Unexpected error fetching user first name:', error);
        // Garder le prénom du localStorage si erreur
      }
    };

    fetchUserFirstName();
  }, []);

  const handleMoodToggle = (value: string) => {
    setSelectedMoods(prev =>
      prev.includes(value) ? prev.filter(m => m !== value) : [...prev, value]
    );
  };

  const canContinueStep2 = () => {
    return energyLevel > 0 && fatigueLevel > 0 && selectedMoods.length > 0;
  };

  const handleAddAppointment = () => {
    if (!newAppointment.date || !newAppointment.time) return;
    
    const datetime = `${newAppointment.date}T${newAppointment.time}:00`;
    setAppointments([...appointments, {
      type: newAppointment.type,
      datetime,
      with: newAppointment.with,
      location: newAppointment.location,
      notes: newAppointment.notes,
    }]);
    
    // Réinitialiser le formulaire mais le garder ouvert
    setNewAppointment({
      type: 'consultation',
      date: '',
      time: '',
      with: '',
      location: '',
      notes: '',
    });
    // Ne pas fermer le formulaire : setShowAppointmentModal(false);
  };

  const handleAddTeamMember = () => {
    if (!newTeamMember.name || !newTeamMember.specialty) return;
    
    setMedicalTeam([...medicalTeam, { ...newTeamMember }]);
    // Réinitialiser le formulaire mais le garder ouvert
    setNewTeamMember({ name: '', specialty: '', location: '' });
    // Ne pas fermer le formulaire : setShowTeamModal(false);
  };

  const generateDayPlan = async () => {
    setIsGeneratingPlan(true);
    
    // Mock: génération du plan basée sur l'état du jour
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockTasks: DayTask[] = [
      {
        id: 'task-1',
        day_plan_id: 'plan-1',
        user_id: 'user-1',
        title: 'Prendre un moment de repos',
        description: 'Faire une pause de 15 minutes',
        category: 'repos',
        priority: energyLevel <= 2 ? 'high' : 'medium',
        status: 'todo',
        scheduled_time: '14:00',
        duration_minutes: 15,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'task-2',
        day_plan_id: 'plan-1',
        user_id: 'user-1',
        title: 'Exercice de respiration',
        description: '5 minutes de respiration profonde',
        category: 'bien_etre',
        priority: 'medium',
        status: 'todo',
        scheduled_time: '16:00',
        duration_minutes: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    
    if (energyLevel >= 4) {
      mockTasks.push({
        id: 'task-3',
        day_plan_id: 'plan-1',
        user_id: 'user-1',
        title: 'Activité douce',
        description: 'Marcher 20 minutes ou activité créative',
        category: 'bien_etre',
        priority: 'low',
        status: 'todo',
        scheduled_time: '18:00',
        duration_minutes: 20,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
    
    setGeneratedPlan(mockTasks);
    setIsGeneratingPlan(false);
  };

  const handleAddTask = () => {
    if (!newTask.title) return;
    
    const task: DayTask = {
      id: `task-${Date.now()}`,
      day_plan_id: 'plan-1',
      user_id: 'user-1',
      title: newTask.title,
      description: newTask.description,
      category: newTask.category,
      priority: newTask.priority,
      status: 'todo',
      scheduled_time: newTask.scheduledTime || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    setGeneratedPlan([...generatedPlan, task]);
    setNewTask({
      title: '',
      description: '',
      category: 'quotidien',
      priority: 'medium',
      scheduledTime: '',
    });
    setShowAddTaskModal(false);
  };

  const handleFinish = async () => {
    try {
      const supabase = createClient();
      
      // Récupérer l'utilisateur connecté
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ Error getting user:', authError);
        alert('Erreur d\'authentification. Veuillez vous reconnecter.');
        router.push('/login');
        return;
      }

      const today = new Date().toISOString().split('T')[0];

      // 1. Sauvegarder l'état du jour (étape 2)
      if (energyLevel && fatigueLevel) {
        // Calculer mood_level basé sur le nombre d'humeurs sélectionnées (1-5)
        // Si plusieurs humeurs positives, mood_level plus élevé
        const positiveMoods = selectedMoods.filter(m => ['calme', 'sereine', 'optimiste', 'motivee'].includes(m));
        const negativeMoods = selectedMoods.filter(m => ['triste', 'anxieuse', 'inquiete', 'fatiguee'].includes(m));
        let moodLevel = 3; // Par défaut neutre
        if (positiveMoods.length > negativeMoods.length) {
          moodLevel = Math.min(5, 3 + positiveMoods.length);
        } else if (negativeMoods.length > positiveMoods.length) {
          moodLevel = Math.max(1, 3 - negativeMoods.length);
        }

        const { error: dailyStateError } = await supabase
          .from('daily_states')
          .upsert({
            user_id: user.id,
            date: today,
            energy_level: energyLevel,
            fatigue_level: fatigueLevel,
            mood_level: moodLevel,
            note: dailyNote || null,
          }, {
            onConflict: 'user_id,date'
          });

        if (dailyStateError) {
          console.error('❌ Error saving daily state:', dailyStateError);
          console.error('❌ Error details:', JSON.stringify(dailyStateError, null, 2));
          alert(`Erreur lors de la sauvegarde de l'état du jour : ${(dailyStateError as any).message || 'Erreur inconnue'}`);
        } else {
          console.log('✅ Daily state saved successfully');
        }
      }

      // 2. Sauvegarder les sessions de traitement (étape 3)
      // Chimiothérapie
      if (selectedTreatmentTypes.includes('chimio') && chimioNextDate && chimioNextTime) {
        const chimioDateTime = `${chimioNextDate}T${chimioNextTime}:00`;
        const { error: chimioError } = await supabase
          .from('treatment_sessions')
          .insert({
            user_id: user.id,
            type: 'chimio',
            title: `Chimiothérapie - Session ${chimioCurrentSession}/${chimioTotalSessions}`,
            start_datetime: chimioDateTime,
            location: chimioLocation || null,
            doctor_name: chimioDoctor || null,
            status: 'scheduled',
          });

        if (chimioError) {
          console.error('❌ Error saving chimio session:', chimioError);
          console.error('❌ Error details:', JSON.stringify(chimioError, null, 2));
          alert(`Erreur lors de la sauvegarde de la session de chimiothérapie : ${(chimioError as any).message || 'Erreur inconnue'}`);
        } else {
          console.log('✅ Chimio session saved successfully');
        }
      }

      // Radiothérapie
      if (selectedTreatmentTypes.includes('radio') && radioNextDate && radioNextTime) {
        const radioDateTime = `${radioNextDate}T${radioNextTime}:00`;
        const { error: radioError } = await supabase
          .from('treatment_sessions')
          .insert({
            user_id: user.id,
            type: 'radio',
            title: `Radiothérapie - Session ${radioCurrentSession}/${radioTotalSessions}`,
            start_datetime: radioDateTime,
            location: radioLocation || null,
            doctor_name: radioDoctor || null,
            status: 'scheduled',
          });

        if (radioError) {
          console.error('❌ Error saving radio session:', radioError);
          console.error('❌ Error details:', JSON.stringify(radioError, null, 2));
          alert(`Erreur lors de la sauvegarde de la session de radiothérapie : ${(radioError as any).message || 'Erreur inconnue'}`);
        } else {
          console.log('✅ Radio session saved successfully');
        }
      }

      // Chirurgie (si planifiée)
      if (selectedTreatmentTypes.includes('chirurgie') && surgeryStatus === 'planned' && surgeryDate) {
        const surgeryDateTime = `${surgeryDate}T09:00:00`; // Heure par défaut
        const { error: surgeryError } = await supabase
          .from('treatment_sessions')
          .insert({
            user_id: user.id,
            type: 'autre', // Chirurgie n'est pas dans TreatmentType, utiliser 'autre'
            title: 'Chirurgie',
            start_datetime: surgeryDateTime,
            location: surgeryLocation || null,
            doctor_name: surgeryDoctor || null,
            status: 'scheduled',
          });

        if (surgeryError) {
          console.error('❌ Error saving surgery session:', surgeryError);
          console.error('❌ Error details:', JSON.stringify(surgeryError, null, 2));
          alert(`Erreur lors de la sauvegarde de la chirurgie : ${(surgeryError as any).message || 'Erreur inconnue'}`);
        } else {
          console.log('✅ Surgery session saved successfully');
        }
      }

      // Autres rendez-vous médicaux
      for (const appointment of appointments) {
        if (appointment.datetime) {
          const appointmentType = appointment.type === 'consultation' ? 'consultation' : 
                                 appointment.type === 'examen' ? 'examen' : 'autre';
          const appointmentTitle = appointment.type === 'consultation' ? 'Consultation médicale' :
                                   appointment.type === 'examen' ? 'Examen médical' : 'Rendez-vous médical';
          
          const { error: appointmentError } = await supabase
            .from('treatment_sessions')
            .insert({
              user_id: user.id,
              type: appointmentType,
              title: appointmentTitle,
              start_datetime: appointment.datetime,
              location: appointment.location || null,
              doctor_name: appointment.with || null,
              notes: appointment.notes || null,
              status: 'scheduled',
            });

          if (appointmentError) {
            console.error('❌ Error saving appointment:', appointmentError);
            console.error('❌ Error details:', JSON.stringify(appointmentError, null, 2));
            alert(`Erreur lors de la sauvegarde du rendez-vous : ${(appointmentError as any).message || 'Erreur inconnue'}`);
          } else {
            console.log('✅ Appointment saved successfully');
          }
        }
      }

      // 3. Sauvegarder le plan du jour (étape 4) si un plan a été généré
      if (generatedPlan.length > 0) {
        // Créer ou récupérer le plan du jour pour aujourd'hui
        let dayPlanId: string | null = null;
        
        // Vérifier si un plan existe déjà
        const { data: existingPlan, error: checkPlanError } = await supabase
          .from('day_plans')
          .select('id')
          .eq('user_id', user.id)
          .eq('date', today)
          .maybeSingle();

        if (checkPlanError) {
          console.error('❌ Error checking existing plan:', checkPlanError);
        }

        if (existingPlan) {
          dayPlanId = existingPlan.id;
          console.log('✅ Using existing day plan:', dayPlanId);
        } else {
          // Créer un nouveau plan
          const { data: newPlan, error: planError } = await supabase
            .from('day_plans')
            .insert({
              user_id: user.id,
              date: today,
              notes: null,
            })
            .select()
            .single();

          if (planError) {
            console.error('❌ Error creating day plan:', planError);
            console.error('❌ Error details:', JSON.stringify(planError, null, 2));
            alert(`Erreur lors de la création du plan du jour : ${(planError as any).message || 'Erreur inconnue'}`);
          } else if (newPlan) {
            dayPlanId = newPlan.id;
            console.log('✅ Day plan created:', dayPlanId);
          }
        }

        // Sauvegarder les tâches si le plan existe
        if (dayPlanId) {
          // Préparer les tâches pour l'insertion (sans id, created_at, updated_at qui seront générés)
          const tasksToInsert = generatedPlan.map(task => ({
            day_plan_id: dayPlanId!,
            user_id: user.id,
            title: task.title,
            description: task.description || null,
            category: task.category,
            priority: task.priority,
            status: 'todo' as const,
            scheduled_time: task.scheduled_time || null,
            duration_minutes: null,
          }));

          const { error: tasksError } = await supabase
            .from('day_tasks')
            .insert(tasksToInsert);

          if (tasksError) {
            console.error('❌ Error saving day tasks:', tasksError);
            console.error('❌ Error details:', JSON.stringify(tasksError, null, 2));
            alert(`Erreur lors de la sauvegarde des tâches : ${(tasksError as any).message || 'Erreur inconnue'}`);
          } else {
            console.log(`✅ ${tasksToInsert.length} day tasks saved successfully`);
          }
        }
      }

      // 4. Mettre à jour onboarding_completed à true
      const { error: updateError } = await supabase
        .from('users')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      if (updateError) {
        console.error('❌ Error updating onboarding_completed:', updateError);
        // Continuer quand même la redirection
      } else {
        console.log('✅ Onboarding completed flag updated');
      }
      
      // Attendre un peu pour s'assurer que les données sont bien sauvegardées
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Rediriger vers le dashboard avec un paramètre pour forcer le rechargement
      window.location.href = '/dashboard?refresh=' + Date.now();
    } catch (error) {
      console.error('💥 Unexpected error:', error);
      // Rediriger quand même vers le dashboard
      window.location.href = '/dashboard';
    }
  };

  const renderStepIndicator = () => {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    step < currentStep
                      ? 'bg-[var(--pink-600)] text-white'
                      : step === currentStep
                      ? 'bg-[var(--pink-500)] text-white ring-4 ring-[var(--pink-200)]'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step < currentStep ? '✓' : step}
                </div>
                <span className="text-xs mt-2 text-gray-600">
                  Étape {step}
                </span>
              </div>
              {step < totalSteps && (
                <div
                  className={`h-1 flex-1 mx-2 transition-all ${
                    step < currentStep ? 'bg-[var(--pink-600)]' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="text-center text-sm text-gray-600">
          Étape {currentStep} sur {totalSteps}
        </div>
      </div>
    );
  };

  const renderStep1 = () => (
    <div className="text-center space-y-6">
      <h1 className="text-4xl font-bold text-gray-900">
        Bienvenue{userFirstName ? `, ${userFirstName}` : ''} ! 🌸
      </h1>
      <p className="text-lg text-gray-700">
        On va faire connaissance en quelques questions simples. Tu peux passer certaines étapes si tu préfères les compléter plus tard dans ton espace.
      </p>
      <button
        onClick={() => setCurrentStep(2)}
        className="mt-8 px-8 py-3 bg-gradient-to-r from-[var(--pink-600)] to-[var(--pink-700)] text-white font-semibold rounded-xl hover:from-[var(--pink-700)] hover:to-[var(--pink-800)] transition-all duration-300 hover:scale-105 hover:shadow-lg"
      >
        Commencer
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Comment te sens-tu aujourd'hui ?
        </h2>
        <p className="text-gray-600">
          Ces informations nous aident à mieux t'accompagner.
        </p>
      </div>

      {/* Niveau d'énergie */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <label className="block text-lg font-semibold text-gray-900 mb-4">
          Sur une échelle de 1 à 5, comment évalues-tu ton niveau d'énergie aujourd'hui ?
        </label>
        <input
          type="range"
          min="1"
          max="5"
          value={energyLevel}
          onChange={(e) => setEnergyLevel(Number(e.target.value))}
          className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--pink-600)]"
        />
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>1 - Très faible</span>
          <span className="font-semibold text-[var(--pink-600)] text-lg">
            {energyLevel} - {ENERGY_LABELS[energyLevel as keyof typeof ENERGY_LABELS]}
          </span>
          <span>5 - Très bonne</span>
        </div>
      </div>

      {/* Niveau de fatigue */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <label className="block text-lg font-semibold text-gray-900 mb-4">
          Et ton niveau de fatigue ?
        </label>
        <input
          type="range"
          min="1"
          max="5"
          value={fatigueLevel}
          onChange={(e) => setFatigueLevel(Number(e.target.value))}
          className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--pink-600)]"
        />
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>1 - Pas fatiguée</span>
          <span className="font-semibold text-[var(--pink-600)] text-lg">
            {fatigueLevel} - {FATIGUE_LABELS[fatigueLevel as keyof typeof FATIGUE_LABELS]}
          </span>
          <span>5 - Extrêmement fatiguée</span>
        </div>
      </div>

      {/* Humeur */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <label className="block text-lg font-semibold text-gray-900 mb-4">
          Comment te sens-tu émotionnellement ? (tu peux en sélectionner plusieurs)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {MOOD_OPTIONS.map((mood) => (
            <button
              key={mood.value}
              type="button"
              onClick={() => handleMoodToggle(mood.value)}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedMoods.includes(mood.value)
                  ? 'border-[var(--pink-600)] bg-[var(--pink-50)]'
                  : 'border-gray-200 hover:border-[var(--pink-300)]'
              }`}
            >
              <div className="text-2xl mb-1">{mood.emoji}</div>
              <div className="text-sm font-medium text-gray-700">{mood.label}</div>
            </button>
          ))}
        </div>
        {selectedMoods.length === 0 && (
          <p className="text-sm text-red-500 mt-2">Veuillez sélectionner au moins une humeur</p>
        )}
      </div>

      {/* Note libre */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <label className="block text-lg font-semibold text-gray-900 mb-4">
          Un mot sur ta journée ? (optionnel)
        </label>
        <textarea
          value={dailyNote}
          onChange={(e) => setDailyNote(e.target.value)}
          placeholder="Comment s'est passée ta journée ?"
          maxLength={500}
          className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--pink-500)] focus:border-transparent resize-none"
          rows={4}
        />
        <p className="text-sm text-gray-500 mt-2">{dailyNote.length}/500 caractères</p>
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={() => setCurrentStep(1)}
          className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
        >
          Précédent
        </button>
        <button
          onClick={() => setCurrentStep(3)}
          disabled={!canContinueStep2()}
          className={`px-6 py-3 rounded-xl font-semibold transition-all ${
            canContinueStep2()
              ? 'bg-gradient-to-r from-[var(--pink-600)] to-[var(--pink-700)] text-white hover:from-[var(--pink-700)] hover:to-[var(--pink-800)] hover:scale-105'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Continuer
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Parle-moi de ton parcours médical
        </h2>
        <p className="text-gray-600">
          Ces informations nous aideront à mieux t'accompagner. Tu peux passer cette étape et compléter plus tard si tu préfères.
        </p>
      </div>

      {/* Phase actuelle */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <label className="block text-lg font-semibold text-gray-900 mb-4">
          Où en es-tu dans ton parcours ?
        </label>
        <div className="space-y-3">
          {[
            { value: 'none', label: "Je n'ai pas encore commencé de traitement" },
            { value: 'diagnostic', label: 'Je suis en cours de diagnostic' },
            { value: 'in_treatment', label: 'Je suis en cours de traitement' },
            { value: 'follow_up', label: 'Je suis en suivi post-traitement' },
            { value: 'unknown', label: "Je préfère ne pas répondre" },
          ].map((option) => (
            <label key={option.value} className="flex items-center p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="treatmentPhase"
                value={option.value}
                checked={treatmentPhase === option.value}
                onChange={(e) => setTreatmentPhase(e.target.value as TreatmentStatusPhase)}
                className="mr-3 w-5 h-5 text-[var(--pink-600)]"
              />
              <span className="text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Types de traitement (si en cours) */}
      {treatmentPhase === 'in_treatment' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <label className="block text-lg font-semibold text-gray-900 mb-4">
            Quels types de traitement fais-tu actuellement ?
          </label>
          <div className="space-y-3">
            {/* Chimiothérapie */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <label className="flex items-center p-4 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedTreatmentTypes.includes('chimio')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTreatmentTypes([...selectedTreatmentTypes, 'chimio']);
                    } else {
                      setSelectedTreatmentTypes(selectedTreatmentTypes.filter(t => t !== 'chimio'));
                    }
                  }}
                  className="mr-3 w-5 h-5 text-[var(--pink-600)]"
                />
                <span className="text-gray-700 font-medium">Chimiothérapie</span>
              </label>
              {selectedTreatmentTypes.includes('chimio') && (
                <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-200 space-y-4">
                  <h4 className="text-sm font-semibold text-gray-900 mt-2">Détails sur ta chimiothérapie</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date de début</label>
                      <input
                        type="date"
                        value={chimioStartDate}
                        onChange={(e) => setChimioStartDate(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nombre total de séances prévues</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={chimioTotalSessions}
                        onChange={(e) => setChimioTotalSessions(Number(e.target.value))}
                        className="w-full p-3 border border-gray-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Séance actuelle</label>
                      <input
                        type="number"
                        min="1"
                        max={chimioTotalSessions}
                        value={chimioCurrentSession}
                        onChange={(e) => setChimioCurrentSession(Number(e.target.value))}
                        className="w-full p-3 border border-gray-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fréquence</label>
                      <select
                        value={chimioFrequency}
                        onChange={(e) => setChimioFrequency(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl"
                      >
                        <option value="">Sélectionner</option>
                        <option value="hebdo">Hebdomadaire</option>
                        <option value="2semaines">Toutes les 2 semaines</option>
                        <option value="3semaines">Toutes les 3 semaines</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Prochaine séance - Date</label>
                      <input
                        type="date"
                        value={chimioNextDate}
                        onChange={(e) => setChimioNextDate(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Prochaine séance - Heure</label>
                      <input
                        type="time"
                        value={chimioNextTime}
                        onChange={(e) => setChimioNextTime(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Lieu</label>
                      <input
                        type="text"
                        value={chimioLocation}
                        onChange={(e) => setChimioLocation(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Oncologue (optionnel)</label>
                      <input
                        type="text"
                        value={chimioDoctor}
                        onChange={(e) => setChimioDoctor(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Radiothérapie */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <label className="flex items-center p-4 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedTreatmentTypes.includes('radio')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTreatmentTypes([...selectedTreatmentTypes, 'radio']);
                    } else {
                      setSelectedTreatmentTypes(selectedTreatmentTypes.filter(t => t !== 'radio'));
                    }
                  }}
                  className="mr-3 w-5 h-5 text-[var(--pink-600)]"
                />
                <span className="text-gray-700 font-medium">Radiothérapie</span>
              </label>
              {selectedTreatmentTypes.includes('radio') && (
                <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-200 space-y-4">
                  <h4 className="text-sm font-semibold text-gray-900 mt-2">Détails sur ta radiothérapie</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date de début</label>
                      <input
                        type="date"
                        value={radioStartDate}
                        onChange={(e) => setRadioStartDate(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nombre total de séances prévues</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={radioTotalSessions}
                        onChange={(e) => setRadioTotalSessions(Number(e.target.value))}
                        className="w-full p-3 border border-gray-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Séance actuelle</label>
                      <input
                        type="number"
                        min="1"
                        max={radioTotalSessions}
                        value={radioCurrentSession}
                        onChange={(e) => setRadioCurrentSession(Number(e.target.value))}
                        className="w-full p-3 border border-gray-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fréquence</label>
                      <select
                        value={radioFrequency}
                        onChange={(e) => setRadioFrequency(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl"
                      >
                        <option value="">Sélectionner</option>
                        <option value="quotidienne">Quotidienne</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Prochaine séance - Date</label>
                      <input
                        type="date"
                        value={radioNextDate}
                        onChange={(e) => setRadioNextDate(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Prochaine séance - Heure</label>
                      <input
                        type="time"
                        value={radioNextTime}
                        onChange={(e) => setRadioNextTime(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Lieu</label>
                      <input
                        type="text"
                        value={radioLocation}
                        onChange={(e) => setRadioLocation(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Radiothérapeute (optionnel)</label>
                      <input
                        type="text"
                        value={radioDoctor}
                        onChange={(e) => setRadioDoctor(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chirurgie */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <label className="flex items-center p-4 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedTreatmentTypes.includes('chirurgie')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTreatmentTypes([...selectedTreatmentTypes, 'chirurgie']);
                    } else {
                      setSelectedTreatmentTypes(selectedTreatmentTypes.filter(t => t !== 'chirurgie'));
                    }
                  }}
                  className="mr-3 w-5 h-5 text-[var(--pink-600)]"
                />
                <span className="text-gray-700 font-medium">Chirurgie (opération)</span>
              </label>
              {selectedTreatmentTypes.includes('chirurgie') && (
                <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-200 space-y-4">
                  <h4 className="text-sm font-semibold text-gray-900 mt-2">Informations sur ta chirurgie</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Statut de l'opération</label>
                    <div className="space-y-2">
                      {[
                        { value: 'done', label: "Oui, j'ai déjà été opérée" },
                        { value: 'planned', label: "Non, mais une opération est prévue" },
                        { value: 'unknown', label: "Je ne sais pas encore" },
                      ].map((option) => (
                        <label key={option.value} className="flex items-center p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-white">
                          <input
                            type="radio"
                            name="surgeryStatus"
                            value={option.value}
                            checked={surgeryStatus === option.value}
                            onChange={(e) => setSurgeryStatus(e.target.value as 'done' | 'planned' | 'unknown')}
                            className="mr-3"
                          />
                          <span className="text-sm text-gray-700">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {(surgeryStatus === 'done' || surgeryStatus === 'planned') && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Type d'opération</label>
                        <div className="space-y-2">
                          {['Tumorectomie', 'Mastectomie partielle', 'Mastectomie totale', 'Reconstruction mammaire', 'Autre'].map((type) => (
                            <label key={type} className="flex items-center p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-white">
                              <input
                                type="checkbox"
                                checked={surgeryTypes.includes(type)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSurgeryTypes([...surgeryTypes, type]);
                                  } else {
                                    setSurgeryTypes(surgeryTypes.filter(t => t !== type));
                                  }
                                }}
                                className="mr-3"
                              />
                              <span className="text-sm text-gray-700">{type}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Date de l'opération</label>
                          <input
                            type="date"
                            value={surgeryDate}
                            onChange={(e) => setSurgeryDate(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Lieu</label>
                          <input
                            type="text"
                            value={surgeryLocation}
                            onChange={(e) => setSurgeryLocation(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Chirurgien (optionnel)</label>
                          <input
                            type="text"
                            value={surgeryDoctor}
                            onChange={(e) => setSurgeryDoctor(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Hormonothérapie */}
            <label className="flex items-center p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={selectedTreatmentTypes.includes('hormono')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedTreatmentTypes([...selectedTreatmentTypes, 'hormono']);
                  } else {
                    setSelectedTreatmentTypes(selectedTreatmentTypes.filter(t => t !== 'hormono'));
                  }
                }}
                className="mr-3 w-5 h-5 text-[var(--pink-600)]"
              />
              <span className="text-gray-700 font-medium">Hormonothérapie</span>
            </label>

            {/* Immunothérapie */}
            <label className="flex items-center p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={selectedTreatmentTypes.includes('immuno')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedTreatmentTypes([...selectedTreatmentTypes, 'immuno']);
                  } else {
                    setSelectedTreatmentTypes(selectedTreatmentTypes.filter(t => t !== 'immuno'));
                  }
                }}
                className="mr-3 w-5 h-5 text-[var(--pink-600)]"
              />
              <span className="text-gray-700 font-medium">Immunothérapie</span>
            </label>

            {/* Autre traitement */}
            <label className="flex items-center p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={selectedTreatmentTypes.includes('autre')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedTreatmentTypes([...selectedTreatmentTypes, 'autre']);
                  } else {
                    setSelectedTreatmentTypes(selectedTreatmentTypes.filter(t => t !== 'autre'));
                  }
                }}
                className="mr-3 w-5 h-5 text-[var(--pink-600)]"
              />
              <span className="text-gray-700 font-medium">Autre traitement</span>
            </label>
          </div>
        </div>
      )}

      {/* Autres rendez-vous */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          As-tu d'autres rendez-vous médicaux à venir ?
        </h3>
        <button
          onClick={() => setShowAppointmentModal(!showAppointmentModal)}
          className="w-full py-3 border-2 border-dashed border-[var(--pink-300)] rounded-xl text-[var(--pink-600)] font-semibold hover:bg-[var(--pink-50)] transition-colors"
        >
          {showAppointmentModal ? '− Masquer le formulaire' : '+ Ajouter un rendez-vous'}
        </button>
        
        {showAppointmentModal && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
            <h4 className="text-sm font-semibold text-gray-900">Nouveau rendez-vous</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={newAppointment.type}
                onChange={(e) => setNewAppointment({ ...newAppointment, type: e.target.value as any })}
                className="w-full p-3 border border-gray-300 rounded-xl bg-white"
              >
                <option value="consultation">Consultation</option>
                <option value="examen">Examen</option>
                <option value="autre">Autre rendez-vous médical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={newAppointment.date}
                onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Heure</label>
              <input
                type="time"
                value={newAppointment.time}
                onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Avec qui (optionnel)</label>
              <input
                type="text"
                value={newAppointment.with}
                onChange={(e) => setNewAppointment({ ...newAppointment, with: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lieu (optionnel)</label>
              <input
                type="text"
                value={newAppointment.location}
                onChange={(e) => setNewAppointment({ ...newAppointment, location: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optionnel)</label>
              <textarea
                value={newAppointment.notes}
                onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl bg-white"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAppointmentModal(false);
                  setNewAppointment({
                    type: 'consultation',
                    date: '',
                    time: '',
                    with: '',
                    location: '',
                    notes: '',
                  });
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleAddAppointment}
                className="flex-1 px-4 py-2 bg-[var(--pink-600)] text-white rounded-xl hover:bg-[var(--pink-700)]"
              >
                Ajouter
              </button>
            </div>
          </div>
        )}

        {appointments.length > 0 && (
          <div className="mt-4 space-y-2">
            {appointments.map((apt, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <span className="font-medium">{apt.type}</span>
                  <span className="text-sm text-gray-600 ml-2">
                    {new Date(apt.datetime).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <button
                  onClick={() => setAppointments(appointments.filter((_, i) => i !== idx))}
                  className="text-red-500 hover:text-red-700"
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Équipe médicale */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Veux-tu enregistrer les membres de ton équipe médicale ?
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          C'est optionnel, tu pourras les ajouter plus tard si tu préfères.
        </p>
        <button
          onClick={() => setShowTeamModal(!showTeamModal)}
          className="w-full py-3 border-2 border-dashed border-[var(--pink-300)] rounded-xl text-[var(--pink-600)] font-semibold hover:bg-[var(--pink-50)] transition-colors"
        >
          {showTeamModal ? '− Masquer le formulaire' : '+ Ajouter un professionnel'}
        </button>
        
        {showTeamModal && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
            <h4 className="text-sm font-semibold text-gray-900">Nouveau professionnel</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
              <input
                type="text"
                value={newTeamMember.name}
                onChange={(e) => setNewTeamMember({ ...newTeamMember, name: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Spécialité *</label>
              <select
                value={newTeamMember.specialty}
                onChange={(e) => setNewTeamMember({ ...newTeamMember, specialty: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl bg-white"
                required
              >
                <option value="">Sélectionner</option>
                <option value="Oncologue">Oncologue</option>
                <option value="Chirurgien">Chirurgien</option>
                <option value="Radiothérapeute">Radiothérapeute</option>
                <option value="Médecin généraliste">Médecin généraliste</option>
                <option value="Infirmière">Infirmière</option>
                <option value="Psychologue">Psychologue</option>
                <option value="Kinésithérapeute">Kinésithérapeute</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lieu de consultation (optionnel)</label>
              <input
                type="text"
                value={newTeamMember.location}
                onChange={(e) => setNewTeamMember({ ...newTeamMember, location: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl bg-white"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowTeamModal(false);
                  setNewTeamMember({ name: '', specialty: '', location: '' });
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleAddTeamMember}
                className="flex-1 px-4 py-2 bg-[var(--pink-600)] text-white rounded-xl hover:bg-[var(--pink-700)]"
              >
                Ajouter
              </button>
            </div>
          </div>
        )}

        {medicalTeam.length > 0 && (
          <div className="mt-4 space-y-2">
            {medicalTeam.map((member, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <span className="font-medium">{member.name}</span>
                  <span className="text-sm text-gray-600 ml-2">- {member.specialty}</span>
                </div>
                <button
                  onClick={() => setMedicalTeam(medicalTeam.filter((_, i) => i !== idx))}
                  className="text-red-500 hover:text-red-700"
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={() => setCurrentStep(2)}
          className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
        >
          Précédent
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => setCurrentStep(4)}
            className="px-6 py-3 text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Passer cette étape
          </button>
          <button
            onClick={() => setCurrentStep(4)}
            className="px-6 py-3 bg-gradient-to-r from-[var(--pink-600)] to-[var(--pink-700)] text-white font-semibold rounded-xl hover:from-[var(--pink-700)] hover:to-[var(--pink-800)] transition-all duration-300 hover:scale-105"
          >
            Continuer
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Veux-tu qu'on te propose un plan pour aujourd'hui ?
        </h2>
        <p className="text-gray-600">
          Basé sur ton état du jour et tes rendez-vous, on peut te suggérer un plan adapté. Tu peux aussi le faire plus tard.
        </p>
      </div>

      {planChoice === '' && (
        <div className="space-y-4">
          <label className="flex items-center p-6 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="planChoice"
              value="yes"
              checked={planChoice === ('yes' as PlanChoice)}
              onChange={(e) => {
                setPlanChoice('yes');
                generateDayPlan();
              }}
              className="mr-4 w-5 h-5 text-[var(--pink-600)]"
            />
            <span className="text-lg font-medium text-gray-700">
              Oui, génère-moi un plan pour aujourd'hui
            </span>
          </label>
          <label className="flex items-center p-6 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="planChoice"
              value="no"
              checked={planChoice === ('no' as PlanChoice)}
              onChange={(e) => setPlanChoice('no')}
              className="mr-4 w-5 h-5 text-[var(--pink-600)]"
            />
            <span className="text-lg font-medium text-gray-700">
              Non, je préfère le faire plus tard
            </span>
          </label>
        </div>
      )}

      {planChoice === 'yes' && (
        <>
          {isGeneratingPlan ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[var(--pink-600)] border-t-transparent mb-4"></div>
              <p className="text-gray-600">Génération de ton plan...</p>
            </div>
          ) : (
            <>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Voici ton plan pour aujourd'hui
                </h3>
                <div className="space-y-3">
                  {generatedPlan.map((task) => (
                    <div key={task.id} className="flex items-start p-4 bg-gray-50 rounded-xl">
                      <input
                        type="checkbox"
                        className="mt-1 mr-3 w-5 h-5 text-[var(--pink-600)]"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{task.title}</div>
                        {task.description && (
                          <div className="text-sm text-gray-600 mt-1">{task.description}</div>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs px-2 py-1 bg-[var(--pink-100)] text-[var(--pink-700)] rounded-full">
                            {task.category}
                          </span>
                          {task.scheduled_time && (
                            <span className="text-xs text-gray-500">
                              {task.scheduled_time}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setGeneratedPlan(generatedPlan.filter(t => t.id !== task.id))}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        Supprimer
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setShowAddTaskModal(true)}
                  className="mt-4 w-full py-3 border-2 border-dashed border-[var(--pink-300)] rounded-xl text-[var(--pink-600)] font-semibold hover:bg-[var(--pink-50)] transition-colors"
                >
                  + Ajouter une tâche personnalisée
                </button>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={generateDayPlan}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Générer un autre plan
                  </button>
                  <button
                    onClick={() => setPlanChoice('')}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Modifier le plan
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      <div className="flex justify-between pt-4">
        <button
          onClick={() => setCurrentStep(3)}
          className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
        >
          Précédent
        </button>
        <div className="flex gap-3">
          {planChoice === 'no' && (
            <button
              onClick={handleFinish}
              className="px-6 py-3 bg-gradient-to-r from-[var(--pink-600)] to-[var(--pink-700)] text-white font-semibold rounded-xl hover:from-[var(--pink-700)] hover:to-[var(--pink-800)] transition-all duration-300 hover:scale-105"
            >
              Finaliser
            </button>
          )}
          {planChoice === 'yes' && !isGeneratingPlan && (
            <>
              <button
                onClick={() => setCurrentStep(4)}
                className="px-6 py-3 text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Passer cette étape
              </button>
              <button
                onClick={handleFinish}
                className="px-6 py-3 bg-gradient-to-r from-[var(--pink-600)] to-[var(--pink-700)] text-white font-semibold rounded-xl hover:from-[var(--pink-700)] hover:to-[var(--pink-800)] transition-all duration-300 hover:scale-105"
              >
                Valider ce plan
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderFinalStep = () => (
    <div className="text-center space-y-6 max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900">
        C'est tout ! Ton espace est prêt 🌸
      </h1>
      <p className="text-lg text-gray-700">
        Bravo, tu as complété ton onboarding ! Ton espace est maintenant personnalisé pour t'accompagner au mieux.
      </p>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-left space-y-3">
        <div className="flex items-center text-green-600">
          <span className="text-2xl mr-2">✅</span>
          <span>État du jour enregistré</span>
        </div>
        {treatmentPhase && (
          <div className="flex items-center text-green-600">
            <span className="text-2xl mr-2">✅</span>
            <span>Informations de traitement enregistrées</span>
          </div>
        )}
        {planChoice === 'yes' && generatedPlan.length > 0 && (
          <div className="flex items-center text-green-600">
            <span className="text-2xl mr-2">✅</span>
            <span>Plan du jour créé</span>
          </div>
        )}
      </div>

      <p className="text-gray-600">
        Tu peux modifier ou compléter ces informations à tout moment depuis ton tableau de bord.
      </p>

      <button
        onClick={handleFinish}
        className="mt-8 px-8 py-4 bg-gradient-to-r from-[var(--pink-600)] to-[var(--pink-700)] text-white font-semibold text-lg rounded-xl hover:from-[var(--pink-700)] hover:to-[var(--pink-800)] transition-all duration-300 hover:scale-105 hover:shadow-lg"
      >
        Accéder à mon tableau de bord
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--pink-50)] via-white to-[var(--pink-50)]">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {renderStepIndicator()}
        
        <div className="bg-white rounded-3xl shadow-lg p-8 md:p-12">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderFinalStep()}
        </div>
      </div>

      {/* Modal: Ajouter tâche */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">Ajouter une tâche personnalisée</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description (optionnel)</label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
              <select
                value={newTask.category}
                onChange={(e) => setNewTask({ ...newTask, category: e.target.value as TaskCategory })}
                className="w-full p-3 border border-gray-300 rounded-xl"
              >
                <option value="medical">Médical</option>
                <option value="administratif">Administratif</option>
                <option value="bien_etre">Bien-être</option>
                <option value="quotidien">Quotidien</option>
                <option value="repos">Repos</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priorité</label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                className="w-full p-3 border border-gray-300 rounded-xl"
              >
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Heure suggérée (optionnel)</label>
              <input
                type="time"
                value={newTask.scheduledTime}
                onChange={(e) => setNewTask({ ...newTask, scheduledTime: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200"
              >
                Annuler
              </button>
              <button
                onClick={handleAddTask}
                className="flex-1 px-4 py-2 bg-[var(--pink-600)] text-white rounded-xl hover:bg-[var(--pink-700)]"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
