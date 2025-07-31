-- =====================================================
-- MIGRATION: REMPLACER INVITATIONS EMAIL PAR CODES FAMILLE
-- =====================================================

-- 1. Créer la nouvelle table family_invite_codes
CREATE TABLE IF NOT EXISTS family_invite_codes (
  id uuid default gen_random_uuid() primary key,
  
  -- Références
  senior_id uuid references seniors(id) on delete cascade not null,
  created_by uuid references users(id) not null,
  
  -- Données du code
  code varchar(8) not null unique, -- Format: MC-XXXXX
  expires_at timestamptz default (now() + interval '30 days'),
  max_uses integer default 10,
  current_uses integer default 0,
  is_active boolean default true,
  
  -- Metadata
  usage_history jsonb default '[]'::jsonb, -- Historique des utilisations
  
  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_family_invite_codes_senior_id ON family_invite_codes(senior_id);
CREATE INDEX IF NOT EXISTS idx_family_invite_codes_code ON family_invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_family_invite_codes_is_active ON family_invite_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_family_invite_codes_expires_at ON family_invite_codes(expires_at);

-- Trigger pour handle_times
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_times_family_invite_codes') THEN
        CREATE TRIGGER handle_times_family_invite_codes
            BEFORE INSERT OR UPDATE ON family_invite_codes
            FOR EACH ROW
        EXECUTE PROCEDURE handle_times();
    END IF;
END $$;

-- 2. Fonction pour générer un code unique
CREATE OR REPLACE FUNCTION generate_unique_family_code()
RETURNS varchar AS $$
DECLARE
  new_code varchar;
  chars varchar = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Éviter 0, O, I, 1
  code_exists boolean;
BEGIN
  LOOP
    -- Générer un code au format MC-XXXXX
    new_code := 'MC-';
    FOR i IN 1..5 LOOP
      new_code := new_code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    
    -- Vérifier l'unicité
    SELECT EXISTS(SELECT 1 FROM family_invite_codes WHERE code = new_code) INTO code_exists;
    
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fonction pour enregistrer l'utilisation d'un code
CREATE OR REPLACE FUNCTION record_code_usage(
  p_code_id uuid,
  p_user_id uuid,
  p_relationship varchar
)
RETURNS void AS $$
BEGIN
  UPDATE family_invite_codes
  SET 
    current_uses = current_uses + 1,
    usage_history = usage_history || jsonb_build_object(
      'user_id', p_user_id,
      'relationship', p_relationship,
      'used_at', now()
    ),
    updated_at = now()
  WHERE id = p_code_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Fonction pour nettoyer les codes expirés
CREATE OR REPLACE FUNCTION cleanup_expired_codes()
RETURNS void AS $$
BEGIN
  UPDATE family_invite_codes
  SET is_active = false,
      updated_at = now()
  WHERE is_active = true
    AND (expires_at < now() OR current_uses >= max_uses);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RLS Policies
ALTER TABLE family_invite_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Les membres de la famille peuvent voir les codes de leur senior
CREATE POLICY "family_members_view_codes" ON family_invite_codes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members 
      WHERE user_id = auth.uid() 
      AND senior_id = family_invite_codes.senior_id
      AND deleted = false
    ) OR
    is_admin()
  );

-- Policy: Les membres de la famille peuvent créer des codes
CREATE POLICY "family_members_create_codes" ON family_invite_codes
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM family_members 
      WHERE user_id = auth.uid() 
      AND senior_id = family_invite_codes.senior_id
      AND deleted = false
    )
  );

-- Policy: Les créateurs peuvent mettre à jour leurs codes
CREATE POLICY "creators_update_own_codes" ON family_invite_codes
  FOR UPDATE USING (
    created_by = auth.uid() OR
    is_admin()
  )
  WITH CHECK (
    created_by = auth.uid() OR
    is_admin()
  );

-- Policy: Les créateurs peuvent supprimer leurs codes
CREATE POLICY "creators_delete_own_codes" ON family_invite_codes
  FOR DELETE USING (
    created_by = auth.uid() OR
    is_admin()
  );

-- 6. Migrer les données existantes si nécessaire
-- Créer un code pour chaque senior qui a des invitations en attente
INSERT INTO family_invite_codes (senior_id, created_by, code, is_active)
SELECT DISTINCT 
  fi.senior_id,
  fi.inviter_id,
  generate_unique_family_code(),
  true
FROM family_invitations fi
WHERE fi.status = 'pending'
  AND fi.deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM family_invite_codes fic 
    WHERE fic.senior_id = fi.senior_id 
    AND fic.is_active = true
  );

-- 7. Marquer les invitations email comme obsolètes
UPDATE family_invitations
SET status = 'revoked',
    updated_at = now()
WHERE status = 'pending';

-- 8. Créer une vue pour faciliter l'accès aux codes actifs
CREATE OR REPLACE VIEW active_family_codes AS
SELECT 
  fic.*,
  s.name as senior_name,
  u.name as created_by_name,
  (fic.max_uses - fic.current_uses) as remaining_uses,
  CASE 
    WHEN fic.expires_at < now() THEN 'expired'
    WHEN fic.current_uses >= fic.max_uses THEN 'max_uses_reached'
    WHEN NOT fic.is_active THEN 'inactive'
    ELSE 'active'
  END as status
FROM family_invite_codes fic
JOIN seniors s ON s.id = fic.senior_id
JOIN users u ON u.id = fic.created_by
WHERE fic.is_active = true
  AND fic.expires_at > now()
  AND fic.current_uses < fic.max_uses;

-- Grant access to the view
GRANT SELECT ON active_family_codes TO authenticated;

-- 9. Ajouter des commentaires pour la documentation
COMMENT ON TABLE family_invite_codes IS 'Codes d''invitation pour rejoindre une famille dans MyCompanion';
COMMENT ON COLUMN family_invite_codes.code IS 'Code unique au format MC-XXXXX';
COMMENT ON COLUMN family_invite_codes.usage_history IS 'Historique JSON des utilisations du code';
COMMENT ON COLUMN family_invite_codes.max_uses IS 'Nombre maximum d''utilisations autorisées';
COMMENT ON COLUMN family_invite_codes.current_uses IS 'Nombre actuel d''utilisations';