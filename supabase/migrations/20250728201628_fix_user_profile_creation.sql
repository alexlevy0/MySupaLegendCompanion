-- =====================================================
-- MIGRATION: Correction des politiques RLS pour création de profils
-- Fichier: supabase/migrations/[timestamp]_fix_user_profile_creation.sql
-- =====================================================

-- =====================================================
-- CORRIGER LES POLITIQUES RLS POUR LA TABLE USERS
-- =====================================================

-- Supprimer les anciennes politiques conflictuelles
DROP POLICY IF EXISTS "users_can_view_own_profile" ON users;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON users;

-- NOUVELLE POLITIQUE : Permettre à un utilisateur de créer son propre profil
CREATE POLICY "users_can_insert_own_profile" ON users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- NOUVELLE POLITIQUE : Permettre à un utilisateur de voir son propre profil
CREATE POLICY "users_can_view_own_profile" ON users
  FOR SELECT 
  USING (auth.uid() = id);

-- NOUVELLE POLITIQUE : Permettre à un utilisateur de modifier son propre profil
CREATE POLICY "users_can_update_own_profile" ON users
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- FONCTION RPC POUR CRÉATION SÉCURISÉE DE PROFIL
-- =====================================================

-- Fonction RPC qui contourne les politiques RLS pour créer un profil utilisateur
CREATE OR REPLACE FUNCTION create_user_profile_rpc(
  user_email text DEFAULT NULL,
  user_type text DEFAULT 'family',
  first_name text DEFAULT '',
  last_name text DEFAULT ''
)
RETURNS json AS 
$function$
DECLARE
  current_user_id uuid;
  user_profile json;
BEGIN
  -- Récupérer l'ID de l'utilisateur connecté
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Utiliser les données auth si pas fournies
  IF user_email IS NULL THEN
    SELECT au.email INTO user_email 
    FROM auth.users au 
    WHERE au.id = current_user_id;
  END IF;
  
  -- Insérer le profil (SECURITY DEFINER contourne RLS)
  INSERT INTO public.users (
    id, 
    email, 
    user_type, 
    first_name, 
    last_name, 
    is_active
  ) VALUES (
    current_user_id,
    user_email,
    user_type::public.users_user_type_enum,
    first_name,
    last_name,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    user_type = EXCLUDED.user_type,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    is_active = true,
    updated_at = now()
  RETURNING row_to_json(users.*) INTO user_profile;
  
  RETURN user_profile;
  
EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Failed to create user profile: %', SQLERRM;
END;
$function$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RÉPARER LES COMPTES EXISTANTS CASSÉS
-- =====================================================

-- Fonction pour réparer les comptes auth sans profil public
CREATE OR REPLACE FUNCTION repair_broken_auth_accounts()
RETURNS table(
  user_id uuid,
  email text,
  status text
) AS
$function$
DECLARE
  auth_user record;
  result_status text;
BEGIN
  -- Parcourir tous les utilisateurs auth qui n'ont pas de profil public
  FOR auth_user IN 
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.id
    WHERE pu.id IS NULL
  LOOP
    BEGIN
      -- Créer le profil manquant
      INSERT INTO public.users (
        id,
        email,
        user_type,
        first_name,
        last_name,
        is_active
      ) VALUES (
        auth_user.id,
        auth_user.email,
        COALESCE(auth_user.raw_user_meta_data->>'user_type', 'family')::public.users_user_type_enum,
        COALESCE(auth_user.raw_user_meta_data->>'first_name', ''),
        COALESCE(auth_user.raw_user_meta_data->>'last_name', ''),
        true
      );
      
      result_status := 'REPAIRED';
      
    EXCEPTION
      WHEN others THEN
        result_status := 'FAILED: ' || SQLERRM;
    END;
    
    -- Retourner le résultat
    user_id := auth_user.id;
    email := auth_user.email;
    status := result_status;
    RETURN NEXT;
    
  END LOOP;
  
  RETURN;
END;
$function$ LANGUAGE plpgsql SECURITY DEFINER;

-- Exécuter la réparation
SELECT * FROM repair_broken_auth_accounts();

-- =====================================================
-- POLITIQUES POUR LES AUTRES TABLES (OPTIONNEL)
-- =====================================================

-- S'assurer que les seniors peuvent créer leur propre profil senior
DROP POLICY IF EXISTS "seniors_can_insert_own_profile" ON seniors;
CREATE POLICY "seniors_can_insert_own_profile" ON seniors
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- NETTOYAGE
-- =====================================================

-- Supprimer la fonction de réparation (usage unique)
DROP FUNCTION repair_broken_auth_accounts();

-- Commenter les fonctions pour la documentation
COMMENT ON FUNCTION create_user_profile_rpc(text, text, text, text) IS 
'Fonction RPC pour créer un profil utilisateur de manière sécurisée, contournant les politiques RLS';

-- =====================================================
-- VÉRIFICATION
-- =====================================================

-- Fonction pour vérifier l'état des comptes
CREATE OR REPLACE FUNCTION check_user_accounts_status()
RETURNS table(
  auth_count bigint,
  profile_count bigint,
  missing_profiles bigint,
  orphaned_profiles bigint
) AS
$function$
BEGIN
  SELECT 
    (SELECT COUNT(*) FROM auth.users) as auth_count,
    (SELECT COUNT(*) FROM public.users) as profile_count,
    (SELECT COUNT(*) FROM auth.users au LEFT JOIN public.users pu ON au.id = pu.id WHERE pu.id IS NULL) as missing_profiles,
    (SELECT COUNT(*) FROM public.users pu LEFT JOIN auth.users au ON pu.id = au.id WHERE au.id IS NULL) as orphaned_profiles
  INTO auth_count, profile_count, missing_profiles, orphaned_profiles;
  
  RETURN NEXT;
END;
$function$ LANGUAGE plpgsql SECURITY DEFINER;

-- Afficher l'état actuel
SELECT * FROM check_user_accounts_status();