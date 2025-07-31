-- =====================================================
-- FIX: Politique RLS pour permettre la lecture des codes actifs
-- =====================================================

-- Supprimer l'ancienne politique trop restrictive
DROP POLICY IF EXISTS "family_members_view_codes" ON family_invite_codes;

-- Nouvelle politique : Tout utilisateur authentifié peut lire les codes ACTIFS
-- (nécessaire pour rejoindre une famille)
CREATE POLICY "anyone_can_view_active_codes" ON family_invite_codes
  FOR SELECT USING (
    -- Utilisateur authentifié peut voir les codes actifs
    auth.uid() IS NOT NULL 
    AND is_active = true
    AND expires_at > now()
  );

-- Politique séparée : Les membres de la famille peuvent voir TOUS les codes de leur senior
CREATE POLICY "family_members_view_all_codes" ON family_invite_codes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members 
      WHERE user_id = auth.uid() 
      AND senior_id = family_invite_codes.senior_id
      AND deleted = false
    ) OR
    is_admin()
  );

-- Afficher un message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Politiques RLS mises à jour pour family_invite_codes';
  RAISE NOTICE 'Les utilisateurs authentifiés peuvent maintenant voir les codes actifs';
END $$;