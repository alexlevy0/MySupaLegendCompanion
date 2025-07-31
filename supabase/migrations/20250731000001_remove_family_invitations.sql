-- =====================================================
-- SUPPRESSION DU SYSTÈME D'INVITATIONS PAR EMAIL
-- =====================================================

-- Supprimer les policies RLS
DROP POLICY IF EXISTS "inviter_view_own_invitations" ON family_invitations;
DROP POLICY IF EXISTS "inviter_create_invitations" ON family_invitations;
DROP POLICY IF EXISTS "inviter_update_own_invitations" ON family_invitations;

-- Supprimer la fonction de nettoyage
DROP FUNCTION IF EXISTS cleanup_expired_invitations();

-- Supprimer les triggers
DROP TRIGGER IF EXISTS handle_times_family_invitations ON family_invitations;

-- Supprimer les index
DROP INDEX IF EXISTS idx_family_invitations_senior_id;
DROP INDEX IF EXISTS idx_family_invitations_inviter_id;
DROP INDEX IF EXISTS idx_family_invitations_email;
DROP INDEX IF EXISTS idx_family_invitations_status;
DROP INDEX IF EXISTS idx_family_invitations_expires_at;

-- Supprimer la table
DROP TABLE IF EXISTS family_invitations;

-- Commentaire pour expliquer la migration
COMMENT ON COLUMN seniors.join_code IS 'Code à 4 chiffres remplaçant le système d''invitations par email. Les membres de famille partagent ce code pour rejoindre.';