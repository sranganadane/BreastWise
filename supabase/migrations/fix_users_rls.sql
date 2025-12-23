-- ============================================================================
-- Migration : Créer les RLS policies pour la table users
-- ============================================================================
-- Problème : "new row violates row-level security policy for table "users""
-- Solution : Créer les RLS policies pour permettre INSERT, SELECT, UPDATE, DELETE
-- ============================================================================

-- 1. Vérifier que RLS est activé sur la table users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer les anciennes policies si elles existent (pour éviter les conflits)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can read their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.users;

-- 3. Créer la policy pour INSERT
-- Permet à un utilisateur de créer son propre profil lors de l'inscription
CREATE POLICY "Users can insert their own profile"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- 4. Créer la policy pour SELECT
-- Permet à un utilisateur de lire son propre profil
CREATE POLICY "Users can read their own profile"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- 5. Créer la policy pour UPDATE
-- Permet à un utilisateur de modifier son propre profil
CREATE POLICY "Users can update their own profile"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 6. Créer la policy pour DELETE (optionnel, pour permettre la suppression du compte)
CREATE POLICY "Users can delete their own profile"
ON public.users
FOR DELETE
USING (auth.uid() = id);

-- 7. Vérification : Afficher toutes les policies créées
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users'
AND schemaname = 'public'
ORDER BY policyname;

-- 8. Note importante :
-- Si tu as encore des problèmes après avoir exécuté ce SQL, vérifie que :
-- 1. La colonne 'id' dans public.users est bien de type UUID
-- 2. La colonne 'id' correspond bien à auth.uid() (l'ID de l'utilisateur dans auth.users)
-- 3. Tu es bien connecté en tant qu'utilisateur authentifié lors de l'insertion
