-- ============================================================================
-- Migration : Correction de la table journal_entries
-- ============================================================================
-- Problème : La colonne id n'a pas de valeur par défaut, ce qui cause
-- l'erreur "null value in column "id" violates not-null constraint"
-- ============================================================================

-- 1. Vérifier d'abord la structure actuelle de la table
SELECT 
  column_name, 
  data_type, 
  column_default, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'journal_entries'
ORDER BY ordinal_position;

-- 2. Ajouter la valeur par défaut pour la colonne id (UUID auto-généré)
ALTER TABLE journal_entries 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. S'assurer que created_at et updated_at ont aussi des valeurs par défaut
ALTER TABLE journal_entries 
ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE journal_entries 
ALTER COLUMN updated_at SET DEFAULT NOW();

-- 4. Créer les RLS policies si elles n'existent pas déjà
-- Policy pour INSERT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'journal_entries' 
    AND policyname = 'Users can insert their own journal entries'
  ) THEN
    CREATE POLICY "Users can insert their own journal entries"
    ON journal_entries
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Policy pour SELECT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'journal_entries' 
    AND policyname = 'Users can read their own journal entries'
  ) THEN
    CREATE POLICY "Users can read their own journal entries"
    ON journal_entries
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Policy pour UPDATE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'journal_entries' 
    AND policyname = 'Users can update their own journal entries'
  ) THEN
    CREATE POLICY "Users can update their own journal entries"
    ON journal_entries
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Policy pour DELETE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'journal_entries' 
    AND policyname = 'Users can delete their own journal entries'
  ) THEN
    CREATE POLICY "Users can delete their own journal entries"
    ON journal_entries
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- 5. Créer les index pour améliorer les performances (si ils n'existent pas)
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at ON journal_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_deleted_at ON journal_entries(deleted_at) WHERE deleted_at IS NULL;

-- 6. Vérification finale : afficher la structure de la table après modification
SELECT 
  column_name, 
  data_type, 
  column_default, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'journal_entries'
ORDER BY ordinal_position;







