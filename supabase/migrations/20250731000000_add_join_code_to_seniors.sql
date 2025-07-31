-- =====================================================
-- AJOUT DU SYSTÈME DE CODE À 4 CHIFFRES
-- =====================================================

-- Ajouter le champ join_code à la table seniors
ALTER TABLE seniors 
ADD COLUMN IF NOT EXISTS join_code CHAR(4) UNIQUE,
ADD COLUMN IF NOT EXISTS join_code_expires_at TIMESTAMPTZ;

-- Index pour améliorer les performances de recherche par code
CREATE INDEX IF NOT EXISTS idx_seniors_join_code ON seniors(join_code) WHERE join_code IS NOT NULL;

-- Fonction pour générer un code unique à 4 chiffres
CREATE OR REPLACE FUNCTION generate_unique_join_code()
RETURNS CHAR(4) AS $$
DECLARE
  new_code CHAR(4);
  max_attempts INT := 100;
  attempt_count INT := 0;
BEGIN
  LOOP
    -- Générer un code aléatoire à 4 chiffres
    new_code := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    -- Vérifier si le code existe déjà
    IF NOT EXISTS (SELECT 1 FROM seniors WHERE join_code = new_code) THEN
      RETURN new_code;
    END IF;
    
    attempt_count := attempt_count + 1;
    
    -- Éviter une boucle infinie
    IF attempt_count >= max_attempts THEN
      RAISE EXCEPTION 'Unable to generate unique join code after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour générer ou regénérer le code d'un senior
CREATE OR REPLACE FUNCTION generate_join_code_for_senior(senior_id UUID)
RETURNS CHAR(4) AS $$
DECLARE
  new_code CHAR(4);
BEGIN
  -- Générer un nouveau code unique
  new_code := generate_unique_join_code();
  
  -- Mettre à jour le senior avec le nouveau code
  UPDATE seniors 
  SET 
    join_code = new_code,
    join_code_expires_at = NULL, -- Pas d'expiration par défaut
    updated_at = NOW()
  WHERE id = senior_id;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour générer automatiquement un code lors de la création d'un senior
CREATE OR REPLACE FUNCTION handle_new_senior_join_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Générer un code uniquement si aucun n'est fourni
  IF NEW.join_code IS NULL THEN
    NEW.join_code := generate_unique_join_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS generate_join_code_on_senior_insert ON seniors;
CREATE TRIGGER generate_join_code_on_senior_insert
  BEFORE INSERT ON seniors
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_senior_join_code();

-- Générer des codes pour les seniors existants qui n'en ont pas
UPDATE seniors 
SET join_code = generate_unique_join_code()
WHERE join_code IS NULL AND deleted = false;

-- Fonction pour valider et rejoindre une famille avec un code
CREATE OR REPLACE FUNCTION join_family_with_code(
  p_user_id UUID,
  p_join_code CHAR(4)
)
RETURNS JSONB AS $$
DECLARE
  v_senior RECORD;
  v_existing_member RECORD;
  v_result JSONB;
BEGIN
  -- Rechercher le senior avec ce code
  SELECT id, user_id, join_code_expires_at
  INTO v_senior
  FROM seniors
  WHERE join_code = p_join_code
    AND deleted = false;
  
  -- Vérifier si le code existe
  IF v_senior.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Code invalide ou expiré'
    );
  END IF;
  
  -- Vérifier si le code n'est pas expiré (si une date d'expiration est définie)
  IF v_senior.join_code_expires_at IS NOT NULL AND v_senior.join_code_expires_at < NOW() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Ce code a expiré'
    );
  END IF;
  
  -- Vérifier si l'utilisateur n'est pas déjà membre
  SELECT id 
  INTO v_existing_member
  FROM family_members
  WHERE user_id = p_user_id
    AND senior_id = v_senior.id
    AND deleted = false;
  
  IF v_existing_member.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Vous êtes déjà membre de cette famille'
    );
  END IF;
  
  -- Créer la relation familiale
  INSERT INTO family_members (
    user_id,
    senior_id,
    relationship,
    is_primary_contact,
    access_level,
    notification_preferences
  ) VALUES (
    p_user_id,
    v_senior.id,
    'membre de famille', -- Relation par défaut
    false,
    'standard',
    jsonb_build_object(
      'dailyReports', false,
      'emergencyAlerts', true,
      'weeklyReports', true,
      'smsAlerts', false
    )
  );
  
  -- Retourner le succès avec l'ID du senior
  RETURN jsonb_build_object(
    'success', true,
    'senior_id', v_senior.id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies RLS pour le join_code
-- Les membres de famille peuvent voir le code du senior
CREATE POLICY "family_members_view_join_code" ON seniors
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.senior_id = seniors.id
        AND family_members.user_id = auth.uid()
        AND family_members.deleted = false
    )
  );

-- Commentaire pour expliquer le système
COMMENT ON COLUMN seniors.join_code IS 'Code à 4 chiffres permettant aux membres de famille de rejoindre le senior';
COMMENT ON COLUMN seniors.join_code_expires_at IS 'Date d''expiration optionnelle du code de jointure';