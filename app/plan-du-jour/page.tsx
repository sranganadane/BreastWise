'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import type { DayPlan, DayTask, DailyState, TreatmentSession, TaskCategory, TaskPriority, TaskStatus } from '@/types/database';

export default function PlanDuJourPage() {
  const router = useRouter();
  const [dayPlan, setDayPlan] = useState<DayPlan | null>(null);
  const [tasks, setTasks] = useState<DayTask[]>([]);
  const [todayState, setTodayState] = useState<DailyState | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<TreatmentSession[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState<DayTask | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Formulaire pour ajouter/modifier une tâche
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'quotidien' as TaskCategory,
    priority: 'medium' as TaskPriority,
    scheduled_time: '',
  });

  // Charger les données depuis Supabase
  useEffect(() => {
    const loadPlanData = async () => {
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

        // Charger l'état du jour
        const { data: dailyStateData, error: dailyStateError } = await supabase
          .from('daily_states')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', today)
          .maybeSingle();

        if (!dailyStateError && dailyStateData) {
          setTodayState(dailyStateData as DailyState);
        }

        // Charger les rendez-vous du jour
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('treatment_sessions')
          .select('*')
          .eq('user_id', user.id)
          .gte('start_datetime', startOfDay.toISOString())
          .lte('start_datetime', endOfDay.toISOString())
          .order('start_datetime', { ascending: true });

        if (!appointmentsError && appointmentsData) {
          setTodayAppointments(appointmentsData as TreatmentSession[]);
        }

        // Charger le plan du jour existant
        const { data: planData, error: planError } = await supabase
          .from('day_plans')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', today)
          .maybeSingle();

        if (!planError && planData) {
          setDayPlan(planData as DayPlan);
          
          // Charger les tâches du plan
          const { data: tasksData, error: tasksError } = await supabase
            .from('day_tasks')
            .select('*')
            .eq('day_plan_id', planData.id)
            .order('created_at', { ascending: true });

          if (!tasksError && tasksData) {
            setTasks(tasksData as DayTask[]);
          }
        } else if (dailyStateData) {
          // Si pas de plan mais qu'on a un état du jour, générer automatiquement
          const appointments = appointmentsData || [];
          await generatePlan(dailyStateData as DailyState, appointments as TreatmentSession[]);
        }
      } catch (error) {
        console.error('💥 Error loading plan data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPlanData();
  }, [router]);

  // Fonction de génération automatique du plan selon les règles métier
  const generatePlan = async (state: DailyState, appointments: TreatmentSession[], preserveManualTasks: boolean = false) => {
    setIsGenerating(true);
    
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        alert('Erreur d\'authentification');
        setIsGenerating(false);
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      
      // Créer ou récupérer le plan du jour
      let planId = dayPlan?.id;
      
      if (!planId) {
        // D'abord, vérifier si un plan existe déjà pour aujourd'hui
        const { data: existingPlan, error: checkError } = await supabase
          .from('day_plans')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', today)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('❌ Error checking existing plan:', checkError);
          const errorMessage = (checkError as any).message || String(checkError);
          alert(`Erreur lors de la vérification du plan : ${errorMessage}`);
          setIsGenerating(false);
          return;
        }

        if (existingPlan) {
          // Un plan existe déjà, l'utiliser
          planId = existingPlan.id;
          setDayPlan(existingPlan as DayPlan);
        } else {
          // Créer un nouveau plan avec gestion de l'erreur de contrainte unique
          const { data: newPlanData, error: planError } = await supabase
            .from('day_plans')
            .insert({
              user_id: user.id,
              date: today,
              notes: null,
            })
            .select()
            .single();

          if (planError) {
            // Si l'erreur est une contrainte unique, récupérer le plan existant
            if (planError.code === '23505' || planError.message.includes('duplicate key') || planError.message.includes('unique constraint')) {
              console.log('⚠️ Plan already exists, fetching it...');
              const { data: fetchedPlan, error: fetchError } = await supabase
                .from('day_plans')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', today)
                .single();

              if (fetchError || !fetchedPlan) {
                console.error('❌ Error fetching existing plan:', fetchError);
                alert('Erreur lors de la récupération du plan existant');
                setIsGenerating(false);
                return;
              }

              planId = fetchedPlan.id;
              setDayPlan(fetchedPlan as DayPlan);
            } else {
              console.error('❌ Error creating plan:', planError);
              const errorMessage = (planError as any).message || String(planError);
              alert(`Erreur lors de la création du plan : ${errorMessage}`);
              setIsGenerating(false);
              return;
            }
          } else if (newPlanData) {
            planId = newPlanData.id;
            setDayPlan(newPlanData as DayPlan);
          } else {
            console.error('❌ No plan data returned');
            alert('Erreur : aucun plan retourné après création');
            setIsGenerating(false);
            return;
          }
        }
      }

      // Supprimer les anciennes tâches générées automatiquement
      if (!preserveManualTasks) {
        const { error: deleteError } = await supabase
          .from('day_tasks')
          .delete()
          .eq('day_plan_id', planId);

        if (deleteError) {
          console.error('❌ Error deleting old tasks:', deleteError);
        }
      } else {
        // Supprimer seulement les tâches générées automatiquement (identifiées par leur titre)
        const autoTaskTitles = [
          'Préparer mon rendez-vous',
          'Temps de récupération après le rendez-vous',
          'Faire un exercice de respiration',
          'Faire un exercice de respiration douce',
          'Appeler une personne qui me fait du bien',
          'Scanner et ranger un document important',
          'Noter les questions pour mon prochain rendez-vous',
          'Faire une sieste de 20-30 minutes',
        ];

        // Récupérer toutes les tâches du plan
        const { data: allTasks } = await supabase
          .from('day_tasks')
          .select('id, title')
          .eq('day_plan_id', planId);

        if (allTasks) {
          const autoTaskIds = allTasks
            .filter(task => autoTaskTitles.some(title => task.title.includes(title)))
            .map(task => task.id);

          if (autoTaskIds.length > 0) {
            const { error: deleteError } = await supabase
              .from('day_tasks')
              .delete()
              .in('id', autoTaskIds);

            if (deleteError) {
              console.error('❌ Error deleting auto tasks:', deleteError);
            }
          }
        }
      }

      // Générer les nouvelles tâches
      const newTasks: Omit<DayTask, 'id' | 'created_at' | 'updated_at'>[] = [];
      const { energy_level, fatigue_level } = state;
      const hasBigAppointment = appointments.some(apt => apt.type === 'chimio' || apt.type === 'radio');

      // Règles d'adaptation selon l'état
      if (energy_level <= 2 || fatigue_level >= 4) {
        // Énergie faible OU fatigue élevée
        if (appointments.length > 0) {
          appointments.forEach(apt => {
            const aptTime = new Date(apt.start_datetime);
            const prepTime = new Date(aptTime);
            prepTime.setHours(prepTime.getHours() - 1);
            
            newTasks.push({
              day_plan_id: planId!,
              user_id: user.id,
              title: `Préparer mon rendez-vous (${apt.title})`,
              description: 'Questions, documents à emporter',
              category: 'medical',
              priority: 'high',
              status: 'todo',
              scheduled_time: prepTime.toISOString().split('T')[1].slice(0, 5),
            });

            newTasks.push({
              day_plan_id: planId!,
              user_id: user.id,
              title: apt.title,
              description: apt.location ? `📍 ${apt.location}` : undefined,
              category: 'medical',
              priority: 'high',
              status: 'todo',
              scheduled_time: aptTime.toISOString().split('T')[1].slice(0, 5),
            });

            if (apt.type === 'chimio' || apt.type === 'radio') {
              const recoveryTime = new Date(aptTime);
              recoveryTime.setHours(recoveryTime.getHours() + 2);
              newTasks.push({
                day_plan_id: planId!,
                user_id: user.id,
                title: 'Temps de récupération après le rendez-vous',
                description: 'Repos, hydratation',
                category: 'repos',
                priority: 'high',
                status: 'todo',
                scheduled_time: recoveryTime.toISOString().split('T')[1].slice(0, 5),
              });
            }
          });
        }

        // Tâches bien-être/repos
        newTasks.push({
          day_plan_id: planId!,
          user_id: user.id,
          title: 'Faire une sieste de 20-30 minutes',
          description: 'Repos réparateur',
          category: 'repos',
          priority: 'medium',
          status: 'todo',
        });

        newTasks.push({
          day_plan_id: planId!,
          user_id: user.id,
          title: 'Faire un exercice de respiration douce',
          description: '5 minutes pour se détendre',
          category: 'bien_etre',
          priority: 'medium',
          status: 'todo',
        });
      } else if (energy_level === 3 && fatigue_level === 3) {
        // Énergie moyenne, fatigue moyenne
        if (appointments.length > 0) {
          appointments.forEach(apt => {
            const aptTime = new Date(apt.start_datetime);
            const prepTime = new Date(aptTime);
            prepTime.setHours(prepTime.getHours() - 1);
            
            newTasks.push({
              day_plan_id: planId!,
              user_id: user.id,
              title: `Préparer mon rendez-vous (${apt.title})`,
              description: 'Questions, documents',
              category: 'medical',
              priority: 'high',
              status: 'todo',
              scheduled_time: prepTime.toISOString().split('T')[1].slice(0, 5),
            });

            newTasks.push({
              day_plan_id: planId!,
              user_id: user.id,
              title: apt.title,
              description: apt.location ? `📍 ${apt.location}` : undefined,
              category: 'medical',
              priority: 'high',
              status: 'todo',
              scheduled_time: aptTime.toISOString().split('T')[1].slice(0, 5),
            });
          });
        }

        newTasks.push({
          day_plan_id: planId!,
          user_id: user.id,
          title: 'Scanner et ranger un document important',
          description: 'Organisation douce',
          category: 'administratif',
          priority: 'low',
          status: 'todo',
        });

        newTasks.push({
          day_plan_id: planId!,
          user_id: user.id,
          title: 'Faire un exercice de respiration',
          description: '5-10 minutes',
          category: 'bien_etre',
          priority: 'medium',
          status: 'todo',
        });

        newTasks.push({
          day_plan_id: planId!,
          user_id: user.id,
          title: 'Appeler une personne qui me fait du bien',
          description: 'Moment pour toi',
          category: 'bien_etre',
          priority: 'low',
          status: 'todo',
        });
      } else {
        // Énergie bonne (4-5), fatigue faible (1-2)
        if (appointments.length > 0 && !hasBigAppointment) {
          appointments.forEach(apt => {
            const aptTime = new Date(apt.start_datetime);
            const prepTime = new Date(aptTime);
            prepTime.setHours(prepTime.getHours() - 1);
            
            newTasks.push({
              day_plan_id: planId!,
              user_id: user.id,
              title: `Préparer mon rendez-vous (${apt.title})`,
              description: 'Questions, documents',
              category: 'medical',
              priority: 'high',
              status: 'todo',
              scheduled_time: prepTime.toISOString().split('T')[1].slice(0, 5),
            });

            newTasks.push({
              day_plan_id: planId!,
              user_id: user.id,
              title: apt.title,
              description: apt.location ? `📍 ${apt.location}` : undefined,
              category: 'medical',
              priority: 'high',
              status: 'todo',
              scheduled_time: aptTime.toISOString().split('T')[1].slice(0, 5),
            });
          });
        }

        newTasks.push({
          day_plan_id: planId!,
          user_id: user.id,
          title: 'Noter les questions pour mon prochain rendez-vous',
          description: 'Organisation',
          category: 'administratif',
          priority: 'medium',
          status: 'todo',
        });

        newTasks.push({
          day_plan_id: planId!,
          user_id: user.id,
          title: 'Scanner et ranger un document important',
          description: 'Organisation',
          category: 'administratif',
          priority: 'low',
          status: 'todo',
        });

        newTasks.push({
          day_plan_id: planId!,
          user_id: user.id,
          title: 'Faire un exercice de respiration',
          description: '5-10 minutes',
          category: 'bien_etre',
          priority: 'medium',
          status: 'todo',
        });
      }

      // Sauvegarder les nouvelles tâches dans Supabase
      if (newTasks.length > 0) {
        const { data: insertedTasks, error: insertError } = await supabase
          .from('day_tasks')
          .insert(newTasks)
          .select();

        if (insertError) {
          console.error('❌ Error inserting tasks:', insertError);
          alert('Erreur lors de la sauvegarde des tâches');
        } else if (insertedTasks) {
          // Si on préserve les tâches manuelles, les combiner
          if (preserveManualTasks) {
            const manualTasks = tasks.filter(task => {
              const autoTaskTitles = [
                'Préparer mon rendez-vous',
                'Temps de récupération',
                'Faire un exercice de respiration',
                'Appeler une personne',
                'Scanner et ranger',
                'Noter les questions',
                'Faire une sieste',
              ];
              return !autoTaskTitles.some(title => task.title.includes(title));
            });
            setTasks([...insertedTasks as DayTask[], ...manualTasks]);
          } else {
            setTasks(insertedTasks as DayTask[]);
          }
        }
      }
    } catch (error) {
      console.error('💥 Unexpected error:', error);
      alert('Une erreur inattendue s\'est produite');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
    if (todayState) {
      // Demander confirmation avant de régénérer
      if (confirm('Es-tu sûre de vouloir régénérer le plan ? Les tâches générées automatiquement seront remplacées, mais tes tâches personnalisées seront conservées.')) {
        generatePlan(todayState, todayAppointments, true);
      }
    } else {
      alert('Veuillez d\'abord enregistrer votre état du jour pour générer un plan.');
    }
  };

  const handleAddTask = async () => {
    if (!formData.title.trim()) return;
    
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        alert('Erreur d\'authentification');
        return;
      }

      // S'assurer qu'on a un plan
      let planId = dayPlan?.id;
      if (!planId) {
        const today = new Date().toISOString().split('T')[0];
        
        // Vérifier si un plan existe déjà
        const { data: existingPlan, error: checkError } = await supabase
          .from('day_plans')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', today)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('❌ Error checking existing plan:', checkError);
          alert('Erreur lors de la vérification du plan');
          return;
        }

        if (existingPlan) {
          planId = existingPlan.id;
          setDayPlan(existingPlan as DayPlan);
        } else {
          // Créer un nouveau plan avec gestion de l'erreur de contrainte unique
          const { data: newPlanData, error: planError } = await supabase
            .from('day_plans')
            .insert({
              user_id: user.id,
              date: today,
              notes: null,
            })
            .select()
            .single();

          if (planError) {
            // Si l'erreur est une contrainte unique, récupérer le plan existant
            if (planError.code === '23505' || planError.message.includes('duplicate key') || planError.message.includes('unique constraint')) {
              const { data: fetchedPlan, error: fetchError } = await supabase
                .from('day_plans')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', today)
                .single();

              if (fetchError || !fetchedPlan) {
                console.error('❌ Error fetching existing plan:', fetchError);
                alert('Erreur lors de la récupération du plan existant');
                return;
              }

              planId = fetchedPlan.id;
              setDayPlan(fetchedPlan as DayPlan);
            } else {
              console.error('❌ Error creating plan:', planError);
              const errorMessage = (planError as any).message || String(planError);
              alert(`Erreur lors de la création du plan : ${errorMessage}`);
              return;
            }
          } else if (newPlanData) {
            planId = newPlanData.id;
            setDayPlan(newPlanData as DayPlan);
          } else {
            alert('Erreur : aucun plan retourné');
            return;
          }
        }
      }

      const { data: newTask, error: insertError } = await supabase
        .from('day_tasks')
        .insert({
          day_plan_id: planId,
          user_id: user.id,
          title: formData.title,
          description: formData.description || null,
          category: formData.category,
          priority: formData.priority,
          status: 'todo',
          scheduled_time: formData.scheduled_time || null,
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Error adding task:', insertError);
        alert('Erreur lors de l\'ajout de la tâche');
        return;
      }

      setTasks([...tasks, newTask as DayTask]);
      setFormData({ title: '', description: '', category: 'quotidien', priority: 'medium', scheduled_time: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error('💥 Unexpected error:', error);
      alert('Une erreur inattendue s\'est produite');
    }
  };

  const handleEditTask = (task: DayTask) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      category: task.category,
      priority: task.priority,
      scheduled_time: task.scheduled_time || '',
    });
    setShowAddForm(true);
  };

  const handleUpdateTask = async () => {
    if (!editingTask || !formData.title.trim()) return;
    
    try {
      const supabase = createClient();
      
      const { data: updatedTask, error: updateError } = await supabase
        .from('day_tasks')
        .update({
          title: formData.title,
          description: formData.description || null,
          category: formData.category,
          priority: formData.priority,
          scheduled_time: formData.scheduled_time || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingTask.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error updating task:', updateError);
        alert('Erreur lors de la modification de la tâche');
        return;
      }

      setTasks(tasks.map(t => t.id === editingTask.id ? updatedTask as DayTask : t));
      setEditingTask(null);
      setFormData({ title: '', description: '', category: 'quotidien', priority: 'medium', scheduled_time: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error('💥 Unexpected error:', error);
      alert('Une erreur inattendue s\'est produite');
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Es-tu sûre de vouloir supprimer cette tâche ?')) {
      return;
    }

    try {
      const supabase = createClient();
      
      const { error: deleteError } = await supabase
        .from('day_tasks')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('❌ Error deleting task:', deleteError);
        alert('Erreur lors de la suppression de la tâche');
        return;
      }

      setTasks(tasks.filter(t => t.id !== id));
    } catch (error) {
      console.error('💥 Unexpected error:', error);
      alert('Une erreur inattendue s\'est produite');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const supabase = createClient();
      const task = tasks.find(t => t.id === id);
      if (!task) return;

      const newStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done';
      
      const { data: updatedTask, error: updateError } = await supabase
        .from('day_tasks')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error updating task status:', updateError);
        return;
      }

      setTasks(tasks.map(t => t.id === id ? updatedTask as DayTask : t));
    } catch (error) {
      console.error('💥 Unexpected error:', error);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  const getCategoryLabel = (category: TaskCategory): string => {
    const labels: Record<TaskCategory, string> = {
      medical: 'Médical',
      administratif: 'Administratif',
      bien_etre: 'Bien-être',
      quotidien: 'Quotidien',
      repos: 'Repos',
    };
    return labels[category];
  };

  const getPriorityLabel = (priority: TaskPriority): string => {
    const labels: Record<TaskPriority, string> = {
      low: 'Optionnelle',
      medium: 'Normale',
      high: 'Priorité forte',
    };
    return labels[priority];
  };

  const getCategoryColor = (category: TaskCategory): { from: string; to: string } => {
    const colors: Record<TaskCategory, { from: string; to: string }> = {
      medical: { from: '#e91e63', to: '#c2185b' },
      administratif: { from: '#9c27b0', to: '#7b1fa2' },
      bien_etre: { from: '#f8b2d3', to: '#e885b5' },
      quotidien: { from: '#d4a574', to: '#c49564' },
      repos: { from: '#a78bfa', to: '#8b5cf6' },
    };
    return colors[category];
  };

  const getMessage = (): string => {
    if (!todayState) return "On va construire ensemble un petit plan pour aujourd'hui.";
    
    const { energy_level, fatigue_level } = todayState;
    const hasBigAppointment = todayAppointments.some(apt => apt.type === 'chimio' || apt.type === 'radio');

    if (hasBigAppointment) {
      return "C'est déjà beaucoup d'avoir ce rendez-vous aujourd'hui. Le reste peut attendre.";
    }
    if (energy_level <= 2 || fatigue_level >= 4) {
      return "Aujourd'hui, on va vraiment y aller en douceur. On privilégie le repos et quelques petites actions qui te font du bien.";
    }
    if (energy_level === 3 && fatigue_level === 3) {
      return "On va équilibrer aujourd'hui entre petites choses utiles et moments pour toi.";
    }
    return "Tu sembles avoir un peu plus d'énergie aujourd'hui. On en profite pour avancer sur ce qui compte pour toi, tout en gardant des moments doux.";
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    // Trier par priorité puis par heure
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    if (a.scheduled_time && b.scheduled_time) {
      return a.scheduled_time.localeCompare(b.scheduled_time);
    }
    if (a.scheduled_time) return -1;
    if (b.scheduled_time) return 1;
    return 0;
  });

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[var(--beige-50)] via-white to-[var(--pink-50)] relative overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--pink-200)] border-t-[var(--pink-600)] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Chargement de ton plan...</p>
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
        <div className="max-w-6xl mx-auto space-y-8">
          {/* En-tête */}
          <div className="flex flex-col items-center text-center gap-3 md:gap-4 mb-8 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-light text-[var(--text-primary)] tracking-tight">
              Plan de ma journée
            </h1>
            <p className="text-lg text-[var(--text-secondary)] max-w-3xl mx-auto leading-relaxed">
              {getMessage()}
            </p>
          </div>

          {/* Résumé du jour + jauges */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border-2 border-[var(--pink-200)]/50 shadow-2xl p-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1 space-y-4">
                {todayState ? (
                  <>
                    <p className="text-sm font-semibold text-[var(--accent-strong)] uppercase">Ton état du jour</p>
                    {/* Jauge Énergie */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-[var(--text-primary)]">Énergie</span>
                        <span className="text-xs text-[var(--text-secondary)]">{todayState.energy_level}/5</span>
                      </div>
                      <div className="w-full h-3 bg-[var(--beige-200)] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[var(--accent-soft)] to-[var(--accent-strong)] transition-all duration-500"
                          style={{ width: `${(todayState.energy_level / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    {/* Jauge Fatigue */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-[var(--text-primary)]">Fatigue</span>
                        <span className="text-xs text-[var(--text-secondary)]">{todayState.fatigue_level}/5</span>
                      </div>
                      <div className="w-full h-3 bg-[var(--beige-200)] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[var(--lavender-300)] to-[var(--lavender-500)] transition-all duration-500"
                          style={{ width: `${(todayState.fatigue_level / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    {/* Jauge Humeur */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-[var(--text-primary)]">Humeur</span>
                        <span className="text-xs text-[var(--text-secondary)]">{todayState.mood_level}/5</span>
                      </div>
                      <div className="w-full h-3 bg-[var(--beige-200)] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[var(--pink-400)] to-[var(--pink-600)] transition-all duration-500"
                          style={{ width: `${(todayState.mood_level / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-[var(--text-secondary)]">Pas encore d'état du jour enregistré</p>
                )}
              </div>
              <div className="flex flex-col gap-3">
                <Link
                  href="/etat-du-jour"
                  className="px-4 py-2 text-sm font-semibold text-[var(--text-primary)] border-2 border-[var(--button-secondary-border)] rounded-xl hover:border-[var(--button-secondary-hover-border)] hover:bg-gradient-to-r hover:from-[var(--pink-50)] hover:to-[var(--lavender-50)] transition-all duration-300 text-center"
                >
                  {todayState ? 'Mettre à jour mon état' : 'Enregistrer mon état'}
                </Link>
                <button
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[var(--accent-soft)] to-[var(--accent-strong)] rounded-xl hover:from-[var(--accent-medium)] hover:to-[var(--accent-strong)] transition-all duration-300 disabled:opacity-50"
                >
                  {isGenerating ? 'Génération...' : 'Re-générer le plan'}
                </button>
              </div>
            </div>
          </div>

          {/* Sous-section 1 : Mes Rendez-vous Fixes */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border-2 border-[var(--pink-200)]/50 shadow-2xl p-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">📅</span>
              <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
                Mes Rendez-vous Fixes
              </h2>
            </div>
            {todayAppointments.length > 0 ? (
              <div className="space-y-4">
                {todayAppointments.map((apt) => {
                  const aptTime = new Date(apt.start_datetime);
                  return (
                    <div
                      key={apt.id}
                      className="p-4 rounded-xl border-2 border-[var(--pink-300)]/50 bg-gradient-to-r from-[var(--pink-50)]/80 to-[var(--lavender-50)]/80"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-[var(--text-primary)]">{apt.title}</h3>
                          {apt.description && (
                            <p className="text-sm text-[var(--text-secondary)] mt-1">{apt.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="text-sm font-semibold text-[var(--accent-strong)]">
                              ⏰ {aptTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {apt.location && (
                              <span className="text-sm text-[var(--text-secondary)]">
                                📍 {apt.location}
                              </span>
                            )}
                            {apt.doctor_name && (
                              <span className="text-sm text-[var(--text-secondary)]">
                                👤 {apt.doctor_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[var(--text-secondary)] text-center py-4">
                Aucun rendez-vous prévu aujourd'hui
              </p>
            )}
          </div>

          {/* Sous-section 2 : Tâches Recommandées */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border-2 border-[var(--pink-200)]/50 shadow-2xl p-8 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">✅</span>
                <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
                  Tâches Recommandées
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowAddForm(true);
                  setEditingTask(null);
                  setFormData({ title: '', description: '', category: 'quotidien', priority: 'medium', scheduled_time: '' });
                }}
                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[var(--accent-soft)] to-[var(--accent-strong)] rounded-xl hover:from-[var(--accent-medium)] hover:to-[var(--accent-strong)] transition-all duration-300"
              >
                + Ajouter une tâche
              </button>
            </div>

            {/* Liste des tâches (sans les rendez-vous médicaux) */}
            {sortedTasks.filter(task => task.category !== 'medical').length > 0 ? (
              <div className="space-y-4">
                {sortedTasks.filter(task => task.category !== 'medical').map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                      task.status === 'done'
                        ? 'bg-[var(--pink-50)]/60 border-[var(--pink-200)]/50 opacity-60'
                        : 'bg-white/90 border-[var(--pink-200)]/50 hover:border-[var(--accent-medium)]'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={task.status === 'done'}
                        onChange={() => handleToggleStatus(task.id)}
                        className="mt-1 w-5 h-5 rounded border-2 border-[var(--pink-300)] text-[var(--accent-strong)] focus:ring-[var(--accent-light)] cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className={`text-lg font-bold ${task.status === 'done' ? 'line-through text-[var(--text-light)]' : 'text-[var(--text-primary)]'}`}>
                              {task.title}
                            </h3>
                            {task.description && (
                              <p className="text-sm text-[var(--text-secondary)] mt-1">{task.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <span 
                                className="px-2 py-1 rounded-lg text-xs font-semibold text-white"
                                style={{
                                  background: `linear-gradient(to right, ${getCategoryColor(task.category).from}, ${getCategoryColor(task.category).to})`
                                }}
                              >
                                {getCategoryLabel(task.category)}
                              </span>
                              <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                                task.priority === 'high' ? 'bg-[var(--pink-200)] text-[var(--pink-800)]' :
                                task.priority === 'medium' ? 'bg-[var(--lavender-200)] text-[var(--lavender-800)]' :
                                'bg-[var(--beige-200)] text-[var(--beige-800)]'
                              }`}>
                                {getPriorityLabel(task.priority)}
                              </span>
                              {task.scheduled_time && (
                                <span className="text-xs text-[var(--text-light)]">
                                  ⏰ {task.scheduled_time}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditTask(task)}
                              className="px-3 py-1 text-xs font-semibold text-[var(--text-primary)] border border-[var(--pink-200)] rounded-lg hover:bg-[var(--pink-50)] transition-colors"
                            >
                              Modifier
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="px-3 py-1 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-[var(--text-secondary)]">
                  Aucune tâche pour le moment. Ajoute une tâche pour commencer !
                </p>
              </div>
            )}
          </div>

          {/* Formulaire d'ajout/modification - Modal flottant */}
          {showAddForm && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 animate-fade-in"
              onClick={() => {
                setShowAddForm(false);
                setEditingTask(null);
                setFormData({ title: '', description: '', category: 'quotidien', priority: 'medium', scheduled_time: '' });
              }}
            >
              <div
                className="bg-white/95 backdrop-blur-xl rounded-3xl border-2 border-[var(--pink-200)]/50 shadow-2xl p-6 max-w-md w-full animate-fade-in relative"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Bouton de fermeture */}
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingTask(null);
                    setFormData({ title: '', description: '', category: 'quotidien', priority: 'medium', scheduled_time: '' });
                  }}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--pink-50)] rounded-full transition-all duration-300 hover:scale-110"
                  aria-label="Fermer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6 pr-8">
                  {editingTask ? 'Modifier la tâche' : 'Ajouter une tâche'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                      Titre <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Ex: Faire une sieste"
                      className="w-full px-4 py-2 bg-white/90 border-2 border-[var(--pink-200)]/50 rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-medium)] transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                      Description (optionnel)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Détails supplémentaires..."
                      rows={2}
                      className="w-full px-4 py-2 bg-white/90 border-2 border-[var(--pink-200)]/50 rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-medium)] transition-all duration-300"
                    />
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                        Catégorie
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as TaskCategory })}
                        className="w-full px-4 py-2 bg-white/90 border-2 border-[var(--pink-200)]/50 rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-medium)] transition-all duration-300"
                      >
                        <option value="medical">Médical</option>
                        <option value="administratif">Administratif</option>
                        <option value="bien_etre">Bien-être</option>
                        <option value="quotidien">Quotidien</option>
                        <option value="repos">Repos</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                        Priorité
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                        className="w-full px-4 py-2 bg-white/90 border-2 border-[var(--pink-200)]/50 rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-medium)] transition-all duration-300"
                      >
                        <option value="low">Optionnelle</option>
                        <option value="medium">Normale</option>
                        <option value="high">Priorité forte</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                        Heure (optionnel)
                      </label>
                      <input
                        type="time"
                        value={formData.scheduled_time}
                        onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                        className="w-full px-4 py-2 bg-white/90 border-2 border-[var(--pink-200)]/50 rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-medium)] transition-all duration-300"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={editingTask ? handleUpdateTask : handleAddTask}
                      disabled={!formData.title.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-[var(--accent-soft)] to-[var(--accent-strong)] text-white rounded-xl font-semibold hover:from-[var(--accent-medium)] hover:to-[var(--accent-strong)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex-1"
                    >
                      {editingTask ? 'Modifier' : 'Ajouter à mon plan'}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingTask(null);
                        setFormData({ title: '', description: '', category: 'quotidien', priority: 'medium', scheduled_time: '' });
                      }}
                      className="px-6 py-3 border-2 border-[var(--pink-200)] text-[var(--text-primary)] rounded-xl font-semibold hover:border-[var(--accent-medium)] hover:bg-[var(--pink-50)] transition-all duration-300"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Moments pour moi */}
          <div className="bg-gradient-to-br from-[var(--pink-50)]/80 to-[var(--lavender-50)]/80 backdrop-blur-xl rounded-3xl border-2 border-[var(--pink-200)]/50 shadow-2xl p-8 animate-fade-in">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-4">
              Moments pour moi
            </h2>
            <p className="text-[var(--text-secondary)] mb-6">
              Ces petits moments comptent autant que le reste. Ils font partie de ton soin.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/bien-etre"
                className="px-5 py-3 bg-white/90 border-2 border-[var(--pink-200)]/50 rounded-xl font-semibold text-[var(--text-primary)] hover:border-[var(--accent-medium)] hover:bg-white transition-all duration-300 hover:scale-105"
              >
                🌸 Prendre 10 minutes pour respirer
              </Link>
              <Link
                href="/journal"
                className="px-5 py-3 bg-white/90 border-2 border-[var(--pink-200)]/50 rounded-xl font-semibold text-[var(--text-primary)] hover:border-[var(--accent-medium)] hover:bg-white transition-all duration-300 hover:scale-105"
              >
                ✍️ Écrire quelques lignes dans mon journal
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}