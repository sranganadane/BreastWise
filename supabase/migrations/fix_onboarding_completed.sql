-- ============================================================================
-- Migration : Vérifier et corriger la fonction create_user_profile
-- ============================================================================
-- S'assurer que onboarding_completed est bien initialisé à false
-- ============================================================================

-- 1. Vérifier la structure actuelle de la fonction
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'create_user_profile'
AND n.nspname = 'public';

-- 2. Recréer la fonction avec onboarding_completed initialisé à false
CREATE OR REPLACE FUNCTION create_user_profile(
  p_user_id UUID,
  p_email TEXT,
  p_first_name TEXT,
  p_last_name TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    onboarding_completed,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    p_email,
    p_first_name,
    p_last_name,
    false, -- S'assurer que onboarding_completed est false par défaut
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    updated_at = NOW();
END;
$$;

-- 3. Mettre à jour les utilisateurs existants qui n'ont pas onboarding_completed défini
UPDATE public.users
SET onboarding_completed = false
WHERE onboarding_completed IS NULL;

-- 4. Vérifier que la colonne onboarding_completed existe et a une valeur par défaut
SELECT 
  column_name, 
  data_type, 
  column_default, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name = 'onboarding_completed';

-- 5. Si la colonne n'a pas de valeur par défaut, l'ajouter
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users'
    AND column_name = 'onboarding_completed'
    AND column_default IS NOT NULL
  ) THEN
    ALTER TABLE public.users
    ALTER COLUMN onboarding_completed SET DEFAULT false;
  END IF;
END $$;

-- 6. Vérification finale
SELECT 
  id,
  email,
  first_name,
  onboarding_completed,
  created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 5;







