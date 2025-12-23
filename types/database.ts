/**
 * Types TypeScript pour la base de données BreastWise
 * 
 * Basés sur : `.cursor/rules/modeles_donnees.mdc`
 * 
 * IMPORTANT : Les types doivent correspondre EXACTEMENT aux colonnes de la base de données Supabase.
 * Les noms de champs utilisent snake_case pour correspondre à la convention PostgreSQL.
 */

// ============================================================================
// ENUMS - Valeurs prédéfinies
// ============================================================================

export type TreatmentType = 'chimio' | 'radio' | 'consultation' | 'examen' | 'autre';

export type TreatmentStatus = 'scheduled' | 'completed' | 'cancelled';

export type TaskCategory = 'medical' | 'administratif' | 'bien_etre' | 'quotidien' | 'repos';

export type TaskPriority = 'low' | 'medium' | 'high';

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'skipped';

export type JournalContext = 
  | 'apres_rdv' 
  | 'jour_difficile' 
  | 'jour_joie' 
  | 'gratitude' 
  | 'liberation' 
  | string; // Permet d'autres valeurs

export type JournalMoodLabel = 
  | 'triste' 
  | 'anxieuse' 
  | 'apaisee' 
  | 'en_colere' 
  | string; // Permet d'autres valeurs

export type DocumentType = 'compte_rendu' | 'ordonnance' | 'resultat_examen' | 'courrier' | 'autre';

// ============================================================================
// 1. TABLE: users
// ============================================================================

export type User = {
  id: string; // UUID
  email: string;
  password_hash?: string; // Optionnel car géré par Supabase Auth
  first_name?: string;
  last_name?: string; // Ajouté selon signup.mdc
  birth_date?: string; // Format: YYYY-MM-DD, ajouté selon signup.mdc
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  last_login_at?: string; // ISO timestamp (optionnel)
  onboarding_completed?: boolean; // Pour l'onboarding
};

// ============================================================================
// 2. TABLE: daily_states
// ============================================================================

export type DailyState = {
  id: string; // UUID
  user_id: string; // FK → users.id
  date: string; // Format: YYYY-MM-DD
  energy_level: number; // 1-5
  fatigue_level: number; // 1-5
  mood_level: number; // 1-5
  note?: string; // Optionnel
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
};

// ============================================================================
// 3. TABLE: treatment_sessions
// ============================================================================

export type TreatmentSession = {
  id: string; // UUID
  user_id: string; // FK → users.id
  type: TreatmentType;
  title: string;
  description?: string;
  status: TreatmentStatus;
  start_datetime: string; // ISO timestamp
  end_datetime?: string; // ISO timestamp (optionnel)
  location?: string;
  doctor_name?: string;
  notes?: string;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
};

// ============================================================================
// 4. TABLES: day_plans et day_tasks
// ============================================================================

export type DayPlan = {
  id: string; // UUID
  user_id: string; // FK → users.id
  date: string; // Format: YYYY-MM-DD
  notes?: string;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
};

export type DayTask = {
  id: string; // UUID
  day_plan_id: string; // FK → day_plans.id
  user_id: string; // FK → users.id
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  scheduled_time?: string; // Format: HH:MM ou ISO timestamp (optionnel)
  duration_minutes?: number;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
};

// ============================================================================
// 5. TABLE: journal_entries
// ============================================================================

export type JournalEntry = {
  id: string; // UUID
  user_id: string; // FK → users.id
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  title?: string;
  content: string;
  context?: JournalContext;
  mood_label?: JournalMoodLabel;
  is_locked?: boolean; // Défaut: false
  deleted_at?: string; // ISO timestamp (pour soft delete, optionnel)
};

// ============================================================================
// 6. TABLES: documents
// ============================================================================

export type Document = {
  id: string; // UUID
  user_id: string; // FK → users.id
  title: string;
  type: DocumentType;
  storage_key: string; // Clé vers le fichier dans Supabase Storage
  uploaded_at: string; // ISO timestamp
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
};

export type DocumentSummary = {
  id: string; // UUID
  document_id: string; // FK → documents.id
  summary_text: string;
  explanations_text?: string;
  generated_by_ai?: boolean; // Défaut: false
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
};

export type DocumentTreatmentLink = {
  id: string; // UUID
  document_id: string; // FK → documents.id
  treatment_session_id: string; // FK → treatment_sessions.id
  created_at: string; // ISO timestamp
};

// ============================================================================
// TYPES UTILITAIRES - Pour les insertions et mises à jour
// ============================================================================

/**
 * Type pour créer un nouveau DailyState (sans id, created_at, updated_at)
 */
export type DailyStateInsert = Omit<DailyState, 'id' | 'created_at' | 'updated_at'>;

/**
 * Type pour mettre à jour un DailyState (tous les champs optionnels sauf id)
 */
export type DailyStateUpdate = Partial<Omit<DailyState, 'id' | 'user_id' | 'created_at'>> & {
  id: string;
};

/**
 * Type pour créer un nouveau TreatmentSession
 */
export type TreatmentSessionInsert = Omit<TreatmentSession, 'id' | 'created_at' | 'updated_at'>;

/**
 * Type pour mettre à jour un TreatmentSession
 */
export type TreatmentSessionUpdate = Partial<Omit<TreatmentSession, 'id' | 'user_id' | 'created_at'>> & {
  id: string;
};

/**
 * Type pour créer un nouveau DayPlan avec ses tâches
 */
export type DayPlanWithTasks = DayPlan & {
  tasks: DayTask[];
};

/**
 * Type pour créer un nouveau DayTask
 */
export type DayTaskInsert = Omit<DayTask, 'id' | 'created_at' | 'updated_at'>;

/**
 * Type pour mettre à jour un DayTask
 */
export type DayTaskUpdate = Partial<Omit<DayTask, 'id' | 'day_plan_id' | 'user_id' | 'created_at'>> & {
  id: string;
};

/**
 * Type pour créer une nouvelle JournalEntry
 */
export type JournalEntryInsert = Omit<JournalEntry, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>;

/**
 * Type pour mettre à jour une JournalEntry
 */
export type JournalEntryUpdate = Partial<Omit<JournalEntry, 'id' | 'user_id' | 'created_at' | 'deleted_at'>> & {
  id: string;
};

/**
 * Type pour créer un nouveau Document
 */
export type DocumentInsert = Omit<Document, 'id' | 'uploaded_at' | 'created_at' | 'updated_at'>;

/**
 * Type pour créer un nouveau DocumentSummary
 */
export type DocumentSummaryInsert = Omit<DocumentSummary, 'id' | 'created_at' | 'updated_at'>;

/**
 * Type pour créer un nouveau DocumentTreatmentLink
 */
export type DocumentTreatmentLinkInsert = Omit<DocumentTreatmentLink, 'id' | 'created_at'>;
