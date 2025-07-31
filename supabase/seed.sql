-- Seed data for family invite codes

-- Insérer un code de test pour le senior de démo
DO $$
DECLARE
  v_senior_id uuid;
  v_user_id uuid;
  v_code varchar;
BEGIN
  -- Récupérer l'ID du senior de démo (Suzanne)
  SELECT id INTO v_senior_id 
  FROM seniors 
  WHERE first_name = 'Suzanne' 
  LIMIT 1;
  
  -- Récupérer l'ID d'un utilisateur famille
  SELECT u.id INTO v_user_id
  FROM users u
  JOIN family_members fm ON fm.user_id = u.id
  WHERE fm.senior_id = v_senior_id
  LIMIT 1;
  
  -- Si on a trouvé le senior et l'utilisateur
  IF v_senior_id IS NOT NULL AND v_user_id IS NOT NULL THEN
    -- Générer un code
    SELECT generate_unique_family_code() INTO v_code;
    
    -- Insérer le code
    INSERT INTO family_invite_codes (
      senior_id,
      created_by,
      code,
      is_active,
      max_uses,
      expires_at
    ) VALUES (
      v_senior_id,
      v_user_id,
      v_code,
      true,
      10,
      now() + interval '30 days'
    );
    
    -- Afficher le code créé
    RAISE NOTICE 'Code famille créé: %', v_code;
    
    -- Créer aussi un code de test facile à retenir
    INSERT INTO family_invite_codes (
      senior_id,
      created_by,
      code,
      is_active,
      max_uses,
      expires_at
    ) VALUES (
      v_senior_id,
      v_user_id,
      'MC-DEMO1',
      true,
      10,
      now() + interval '30 days'
    ) ON CONFLICT (code) DO NOTHING;
    
    RAISE NOTICE 'Code de test créé: MC-DEMO1';
  END IF;
END $$;