-- =====================================================
-- AJOUTER POLITIQUE POUR LES APPELS DES SENIORS
-- =====================================================

-- Permettre aux utilisateurs de voir les appels de leurs seniors
CREATE POLICY "user_owned_senior_calls" ON calls
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM seniors 
      WHERE seniors.id = calls.senior_id 
      AND seniors.user_id = auth.uid()
      AND seniors.deleted = false
    )
  );

-- Permettre aux utilisateurs de créer des appels pour leurs seniors
CREATE POLICY "user_create_senior_calls" ON calls
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM seniors 
      WHERE seniors.id = calls.senior_id 
      AND seniors.user_id = auth.uid()
      AND seniors.deleted = false
    )
  );

-- Permettre aux utilisateurs de mettre à jour les appels de leurs seniors
CREATE POLICY "user_update_senior_calls" ON calls
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM seniors 
      WHERE seniors.id = calls.senior_id 
      AND seniors.user_id = auth.uid()
      AND seniors.deleted = false
    )
  );

-- Commentaire pour expliquer la logique
COMMENT ON POLICY "user_owned_senior_calls" ON calls IS 
'Permet aux utilisateurs de voir les appels des seniors qu''ils possèdent directement';