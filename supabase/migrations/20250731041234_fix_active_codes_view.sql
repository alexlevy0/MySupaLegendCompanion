-- =====================================================
-- FIX: Vue active_family_codes avec comparaison correcte
-- =====================================================

-- Supprimer l'ancienne vue si elle existe
DROP VIEW IF EXISTS active_family_codes;

-- Recréer la vue avec une condition WHERE correcte
CREATE OR REPLACE VIEW active_family_codes AS
SELECT 
  fic.*,
  CONCAT(s.first_name, ' ', s.last_name) as senior_name,
  CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
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

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Vue active_family_codes corrigée avec succès';
END $$;