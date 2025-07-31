-- Test des codes famille

-- 1. Vérifier si la table existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'family_invite_codes'
) as table_exists;

-- 2. Vérifier s'il y a des codes
SELECT * FROM family_invite_codes;

-- 3. Générer un code de test manuellement pour un senior existant
-- D'abord, trouvons un senior
SELECT id, first_name, last_name FROM seniors LIMIT 1;

-- 4. Créer un code de test (remplacez les IDs)
-- INSERT INTO family_invite_codes (
--   senior_id, 
--   created_by, 
--   code,
--   is_active
-- ) VALUES (
--   'SENIOR_ID_ICI',  -- Remplacer par l'ID du senior
--   'USER_ID_ICI',    -- Remplacer par l'ID de l'utilisateur
--   'MC-TEST1',
--   true
-- );

-- 5. Vérifier que la fonction generate_unique_family_code existe
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'generate_unique_family_code';

-- 6. Tester la génération d'un code
SELECT generate_unique_family_code();