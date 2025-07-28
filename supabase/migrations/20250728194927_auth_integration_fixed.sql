-- =====================================================
-- MIGRATION: AUTH INTEGRATION - Version Finale
-- Fichier: supabase/migrations/[timestamp]_auth_integration_final.sql
-- =====================================================

-- =====================================================
-- FONCTIONS UTILITAIRES POUR L'AUTHENTIFICATION
-- =====================================================

-- Fonction pour récupérer le profil complet de l'utilisateur connecté
CREATE OR REPLACE FUNCTION get_current_user_profile()
RETURNS json AS 
$function$
DECLARE
  user_profile json;
BEGIN
  SELECT row_to_json(u.*) INTO user_profile
  FROM users u
  WHERE u.id = auth.uid() AND u.deleted = false;
  
  RETURN user_profile;
END;
$function$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour mettre à jour le profil utilisateur
CREATE OR REPLACE FUNCTION update_user_profile(
  new_first_name text DEFAULT NULL,
  new_last_name text DEFAULT NULL,
  new_phone text DEFAULT NULL
)
RETURNS json AS 
$function$
DECLARE
  updated_profile json;
BEGIN
  UPDATE users 
  SET 
    first_name = COALESCE(new_first_name, first_name),
    last_name = COALESCE(new_last_name, last_name),
    phone = COALESCE(new_phone, phone),
    updated_at = now()
  WHERE id = auth.uid() AND deleted = false
  RETURNING row_to_json(users.*) INTO updated_profile;
  
  RETURN updated_profile;
END;
$function$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- POLITIQUES RLS MISES À JOUR POUR L'AUTH
-- =====================================================

-- Politique pour que les utilisateurs puissent voir leur propre profil
DROP POLICY IF EXISTS "users_can_view_own_profile" ON users;
CREATE POLICY "users_can_view_own_profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Politique pour que les utilisateurs puissent modifier leur propre profil
DROP POLICY IF EXISTS "users_can_update_own_profile" ON users;
CREATE POLICY "users_can_update_own_profile" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- FONCTION POUR CRÉER DES UTILISATEURS DE DÉMONSTRATION
-- =====================================================

-- Fonction pour créer un utilisateur complet (directement dans public.users)
CREATE OR REPLACE FUNCTION create_complete_demo_user(
  user_email text,
  user_first_name text,
  user_last_name text,
  user_user_type text DEFAULT 'family'
)
RETURNS uuid AS 
$function$
DECLARE
  new_user_id uuid;
  existing_user_id uuid;
BEGIN
  -- Vérifier si l'utilisateur existe déjà
  SELECT id INTO existing_user_id
  FROM public.users
  WHERE email = user_email;
  
  IF existing_user_id IS NOT NULL THEN
    -- Mettre à jour l'utilisateur existant
    UPDATE public.users 
    SET 
      user_type = user_user_type,
      first_name = user_first_name,
      last_name = user_last_name,
      is_active = true,
      updated_at = now()
    WHERE id = existing_user_id;
    
    RETURN existing_user_id;
  END IF;
  
  -- Générer un ID unique
  new_user_id := gen_random_uuid();
  
  -- Créer dans public.users
  INSERT INTO public.users (
    id, 
    email, 
    user_type, 
    first_name, 
    last_name, 
    is_active
  ) VALUES (
    new_user_id,
    user_email,
    user_user_type,
    user_first_name,
    user_last_name,
    true
  );
  
  RETURN new_user_id;
END;
$function$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CRÉER LES UTILISATEURS DE DÉMONSTRATION
-- =====================================================

DO $demo_data$
DECLARE
  v_admin_id uuid;
  v_senior_user_id uuid;
  v_family_id uuid;
  v_saad_id uuid;
  v_org_id uuid;
  v_senior_profile_id uuid;
  v_call_id uuid;
BEGIN
  -- Admin de démonstration
  SELECT create_complete_demo_user(
    'admin@mycompanion.fr',
    'Admin',
    'MyCompanion',
    'admin'
  ) INTO v_admin_id;
  
  -- Senior de démonstration
  SELECT create_complete_demo_user(
    'suzanne.demo@senior.fr',
    'Suzanne',
    'Dupont',
    'senior'
  ) INTO v_senior_user_id;
  
  -- Famille de démonstration
  SELECT create_complete_demo_user(
    'marie.dubois@gmail.com',
    'Marie',
    'Dubois',
    'family'
  ) INTO v_family_id;
  
  -- SAAD de démonstration
  SELECT create_complete_demo_user(
    'saad.lyon@saad.fr',
    'Directeur',
    'SAAD Lyon',
    'saad_admin'
  ) INTO v_saad_id;
  
  -- Créer une organisation SAAD de démonstration
  INSERT INTO saad_organizations (
    name,
    contact_email,
    contact_phone,
    address,
    subscription_plan,
    is_active
  ) VALUES (
    'SAAD Lyon Démonstration',
    'saad.lyon@saad.fr',
    '+33 4 78 00 00 00',
    '{"street": "123 Rue de la Paix", "city": "Lyon", "zipcode": "69000"}',
    'pilot',
    true
  ) RETURNING id INTO v_org_id;
  
  -- Créer le profil senior complet
  INSERT INTO seniors (
    user_id,
    birth_date,
    preferred_call_time,
    call_frequency,
    personality_profile,
    medical_context,
    interests,
    communication_preferences,
    address
  ) VALUES (
    v_senior_user_id,
    '1945-03-15',
    '14:00:00',
    1,
    '{"personality": "bienveillante", "preferences": ["jardinage", "famille", "cuisine"]}',
    '{"conditions": ["arthrite"], "medications": ["anti-inflammatoire"]}',
    '["jardinage", "cuisine", "lecture", "petits-enfants"]',
    '{"tone": "familier", "topics_to_avoid": []}',
    '{"street": "45 Avenue des Fleurs", "city": "Lyon", "zipcode": "69003"}'
  ) RETURNING id INTO v_senior_profile_id;
  
  -- Créer le lien familial
  INSERT INTO family_members (
    user_id,
    senior_id,
    relationship,
    is_primary_contact,
    notification_preferences,
    access_level
  ) VALUES (
    v_family_id,
    v_senior_profile_id,
    'fille',
    true,
    '{"email": true, "sms": true, "push": true}',
    'full'
  );
  
  -- Créer l'assignation SAAD
  INSERT INTO saad_assignments (
    saad_id,
    senior_id,
    assigned_worker_id,
    start_date,
    service_level,
    is_active
  ) VALUES (
    v_org_id,
    v_senior_profile_id,
    v_saad_id,
    CURRENT_DATE,
    'standard',
    true
  );
  
  -- Créer quelques données de démonstration supplémentaires
  
  -- Appel de démonstration
  INSERT INTO calls (
    senior_id,
    call_type,
    status,
    started_at,
    ended_at,
    duration_seconds,
    quality_score,
    conversation_summary,
    mood_detected
  ) VALUES (
    v_senior_profile_id,
    'scheduled',
    'completed',
    now() - interval '1 day',
    now() - interval '1 day' + interval '8 minutes',
    480,
    4.2,
    'Conversation agréable. Suzanne a mentionné qu''elle se sentait un peu fatiguée mais de bonne humeur. Elle a parlé de ses petits-enfants et de son jardin.',
    'content'
  ) RETURNING id INTO v_call_id;
  
  -- Alerte de démonstration
  INSERT INTO alerts (
    senior_id,
    call_id,
    alert_type,
    severity,
    title,
    description,
    detected_indicators,
    confidence_score
  ) VALUES (
    v_senior_profile_id,
    v_call_id,
    'health',
    'low',
    'Fatigue mentionnée',
    'Suzanne a mentionné se sentir fatiguée pendant l''appel. Surveillance recommandée.',
    '{"keywords": ["fatiguée"], "tone_analysis": "slightly_concerned"}',
    0.65
  );
  
  -- Métriques de bien-être
  INSERT INTO well_being_metrics (
    senior_id,
    metric_date,
    social_score,
    mood_score,
    health_score,
    cognitive_score,
    engagement_score,
    overall_score
  ) VALUES (
    v_senior_profile_id,
    CURRENT_DATE - 1,
    7.5,
    8.0,
    6.8,
    8.2,
    7.8,
    7.7
  );
  
  -- Rapport famille de démonstration
  INSERT INTO family_reports (
    senior_id,
    family_member_id,
    report_type,
    report_period_start,
    report_period_end,
    content,
    delivery_method,
    sent_at,
    status
  ) VALUES (
    v_senior_profile_id,
    (SELECT id FROM family_members WHERE user_id = v_family_id LIMIT 1),
    'daily',
    CURRENT_DATE - 1,
    CURRENT_DATE - 1,
    '{"summary": "Journée positive pour Suzanne", "mood": "content", "highlights": ["A parlé de ses petits-enfants", "Mentionne son jardin"], "concerns": ["Légère fatigue mentionnée"]}',
    'email',
    now() - interval '12 hours',
    'sent'
  );
  
  RAISE NOTICE 'Utilisateurs et données de démo créés avec succès:';
  RAISE NOTICE 'Admin ID: %', v_admin_id;
  RAISE NOTICE 'Senior User ID: %', v_senior_user_id;
  RAISE NOTICE 'Senior Profile ID: %', v_senior_profile_id;
  RAISE NOTICE 'Family ID: %', v_family_id;
  RAISE NOTICE 'SAAD ID: %', v_saad_id;
  RAISE NOTICE 'Organisation SAAD ID: %', v_org_id;
  RAISE NOTICE 'Call ID: %', v_call_id;
  RAISE NOTICE '';
  RAISE NOTICE 'Comptes de test créés (utilisez la console Supabase pour l''auth):';
  RAISE NOTICE '- admin@mycompanion.fr (Admin)';
  RAISE NOTICE '- suzanne.demo@senior.fr (Senior)';
  RAISE NOTICE '- marie.dubois@gmail.com (Famille)';
  RAISE NOTICE '- saad.lyon@saad.fr (SAAD)';
  
END $demo_data$;

-- Nettoyer les fonctions temporaires
DROP FUNCTION IF EXISTS create_complete_demo_user(text, text, text, text);

-- =====================================================
-- INSTRUCTIONS POST-MIGRATION
-- =====================================================

-- Pour créer les comptes d'authentification réels, utilisez la console Supabase :
-- 1. Allez dans Authentication > Users
-- 2. Créez les utilisateurs avec les emails ci-dessus
-- 3. Les profils dans public.users sont déjà créés

COMMENT ON FUNCTION get_current_user_profile() IS 
'Retourne le profil complet de l''utilisateur actuellement connecté';

COMMENT ON FUNCTION update_user_profile(text, text, text) IS 
'Met à jour le profil de l''utilisateur connecté avec les nouvelles informations';