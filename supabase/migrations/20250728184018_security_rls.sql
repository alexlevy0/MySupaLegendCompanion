-- =====================================================
-- SÉCURITÉ RLS (Row Level Security) - MIGRATION CORRIGÉE
-- Migration: security_rls.sql
-- =====================================================

-- Fonction helper pour vérifier si l'utilisateur est admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.user_type = 'admin' 
    AND users.is_active = true
    AND users.deleted = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction helper pour vérifier le type d'utilisateur
CREATE OR REPLACE FUNCTION get_user_type()
RETURNS text AS $$
BEGIN
  RETURN (
    SELECT user_type FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_active = true 
    AND users.deleted = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ACTIVER RLS SUR TOUTES LES TABLES SENSIBLES
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE seniors ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE saad_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE saad_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE well_being_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLITIQUES ADMIN : ACCÈS TOTAL
-- =====================================================

-- ADMIN : Peut tout voir et modifier sur users
CREATE POLICY "admin_full_access_users" ON users
  FOR ALL USING (is_admin())
  WITH CHECK (is_admin());

-- ADMIN : Peut tout voir sur seniors
CREATE POLICY "admin_view_all_seniors" ON seniors
  FOR SELECT USING (is_admin());

-- ADMIN : Peut tout voir sur calls (pour debug)
CREATE POLICY "admin_view_all_calls" ON calls
  FOR SELECT USING (is_admin());

-- ADMIN : Peut gérer toutes les alertes
CREATE POLICY "admin_manage_alerts" ON alerts
  FOR ALL USING (is_admin())
  WITH CHECK (is_admin());

-- ADMIN : Peut voir toutes les métriques
CREATE POLICY "admin_view_all_metrics" ON well_being_metrics
  FOR SELECT USING (is_admin());

-- ADMIN : Peut voir tous les rapports
CREATE POLICY "admin_view_all_reports" ON family_reports
  FOR SELECT USING (is_admin());

-- ADMIN : Peut gérer les SAAD
CREATE POLICY "admin_manage_saad" ON saad_organizations
  FOR ALL USING (is_admin())
  WITH CHECK (is_admin());

-- ADMIN : Peut gérer les modèles IA
CREATE POLICY "admin_manage_ai_models" ON ai_models
  FOR ALL USING (is_admin())
  WITH CHECK (is_admin());

-- ADMIN : Peut gérer les settings
CREATE POLICY "admin_manage_settings" ON system_settings
  FOR ALL USING (is_admin())
  WITH CHECK (is_admin());

-- ADMIN : Peut voir toutes les analytics
CREATE POLICY "admin_view_analytics" ON analytics_events
  FOR SELECT USING (is_admin());

-- =====================================================
-- POLITIQUES SENIORS : ACCÈS À LEURS PROPRES DONNÉES
-- =====================================================

-- SENIOR : Peut voir et modifier son propre profil user
CREATE POLICY "senior_own_user_profile" ON users
  FOR ALL USING (auth.uid() = id AND get_user_type() = 'senior')
  WITH CHECK (auth.uid() = id AND get_user_type() = 'senior');

-- SENIOR : Peut voir et modifier ses propres données senior
CREATE POLICY "senior_own_data" ON seniors
  FOR ALL USING (auth.uid() = user_id AND get_user_type() = 'senior')
  WITH CHECK (auth.uid() = user_id AND get_user_type() = 'senior');

-- SENIOR : Peut voir ses propres appels
CREATE POLICY "senior_own_calls" ON calls
  FOR SELECT USING (
    get_user_type() = 'senior' AND
    EXISTS (
      SELECT 1 FROM seniors 
      WHERE seniors.id = calls.senior_id 
      AND seniors.user_id = auth.uid()
    )
  );

-- =====================================================
-- POLITIQUES FAMILLE : ACCÈS À LEURS PROCHES UNIQUEMENT
-- =====================================================

-- FAMILLE : Peut voir son propre profil
CREATE POLICY "family_own_profile" ON users
  FOR ALL USING (auth.uid() = id AND get_user_type() = 'family')
  WITH CHECK (auth.uid() = id AND get_user_type() = 'family');

-- FAMILLE : Peut voir les seniors dont ils sont responsables
CREATE POLICY "family_assigned_seniors" ON seniors
  FOR SELECT USING (
    get_user_type() = 'family' AND
    id IN (
      SELECT fm.senior_id FROM family_members fm 
      WHERE fm.user_id = auth.uid() 
      AND fm.deleted = false
    )
  );

-- FAMILLE : Peut voir les appels de leurs proches
CREATE POLICY "family_senior_calls" ON calls
  FOR SELECT USING (
    get_user_type() = 'family' AND
    senior_id IN (
      SELECT fm.senior_id FROM family_members fm 
      WHERE fm.user_id = auth.uid() 
      AND fm.deleted = false
    )
  );

-- FAMILLE : Peut voir les alertes de leurs proches
CREATE POLICY "family_senior_alerts" ON alerts
  FOR SELECT USING (
    get_user_type() = 'family' AND
    senior_id IN (
      SELECT fm.senior_id FROM family_members fm 
      WHERE fm.user_id = auth.uid() 
      AND fm.deleted = false
    )
  );

-- FAMILLE : Peut acknowledger les alertes de leurs proches
CREATE POLICY "family_acknowledge_alerts" ON alerts
  FOR UPDATE USING (
    get_user_type() = 'family' AND
    senior_id IN (
      SELECT fm.senior_id FROM family_members fm 
      WHERE fm.user_id = auth.uid() 
      AND fm.deleted = false
    )
  )
  WITH CHECK (
    get_user_type() = 'family' AND
    senior_id IN (
      SELECT fm.senior_id FROM family_members fm 
      WHERE fm.user_id = auth.uid() 
      AND fm.deleted = false
    )
  );

-- FAMILLE : Peut voir les métriques de bien-être de leurs proches
CREATE POLICY "family_senior_metrics" ON well_being_metrics
  FOR SELECT USING (
    get_user_type() = 'family' AND
    senior_id IN (
      SELECT fm.senior_id FROM family_members fm 
      WHERE fm.user_id = auth.uid() 
      AND fm.deleted = false
    )
  );

-- FAMILLE : Peut voir leurs rapports
CREATE POLICY "family_own_reports" ON family_reports
  FOR SELECT USING (
    get_user_type() = 'family' AND
    family_member_id IN (
      SELECT fm.id FROM family_members fm 
      WHERE fm.user_id = auth.uid() 
      AND fm.deleted = false
    )
  );

-- =====================================================
-- POLITIQUES SAAD : ACCÈS AUX BÉNÉFICIAIRES ASSIGNÉS
-- =====================================================

-- SAAD : Peut voir son propre profil
CREATE POLICY "saad_own_profile" ON users
  FOR ALL USING (
    auth.uid() = id AND 
    get_user_type() IN ('saad_admin', 'saad_worker')
  )
  WITH CHECK (
    auth.uid() = id AND 
    get_user_type() IN ('saad_admin', 'saad_worker')
  );

-- SAAD : Peut voir les seniors assignés
CREATE POLICY "saad_assigned_seniors" ON seniors
  FOR SELECT USING (
    get_user_type() IN ('saad_admin', 'saad_worker') AND
    id IN (
      SELECT sa.senior_id FROM saad_assignments sa 
      WHERE sa.assigned_worker_id = auth.uid() 
      AND sa.is_active = true 
      AND sa.deleted = false
    )
  );

-- SAAD : Peut voir les appels des seniors assignés
CREATE POLICY "saad_assigned_calls" ON calls
  FOR SELECT USING (
    get_user_type() IN ('saad_admin', 'saad_worker') AND
    senior_id IN (
      SELECT sa.senior_id FROM saad_assignments sa 
      WHERE sa.assigned_worker_id = auth.uid() 
      AND sa.is_active = true 
      AND sa.deleted = false
    )
  );

-- SAAD : Peut voir les alertes des seniors assignés
CREATE POLICY "saad_assigned_alerts" ON alerts
  FOR SELECT USING (
    get_user_type() IN ('saad_admin', 'saad_worker') AND
    senior_id IN (
      SELECT sa.senior_id FROM saad_assignments sa 
      WHERE sa.assigned_worker_id = auth.uid() 
      AND sa.is_active = true 
      AND sa.deleted = false
    )
  );

-- SAAD : Peut modifier le statut des alertes des seniors assignés
CREATE POLICY "saad_manage_assigned_alerts" ON alerts
  FOR UPDATE USING (
    get_user_type() IN ('saad_admin', 'saad_worker') AND
    senior_id IN (
      SELECT sa.senior_id FROM saad_assignments sa 
      WHERE sa.assigned_worker_id = auth.uid() 
      AND sa.is_active = true 
      AND sa.deleted = false
    )
  )
  WITH CHECK (
    get_user_type() IN ('saad_admin', 'saad_worker') AND
    senior_id IN (
      SELECT sa.senior_id FROM saad_assignments sa 
      WHERE sa.assigned_worker_id = auth.uid() 
      AND sa.is_active = true 
      AND sa.deleted = false
    )
  );

-- =====================================================
-- POLITIQUES SPÉCIALES
-- =====================================================

-- Tous les utilisateurs peuvent voir leur propre ligne dans family_members
CREATE POLICY "users_own_family_relations" ON family_members
  FOR SELECT USING (user_id = auth.uid());

-- Les assignments SAAD sont visibles aux admins et aux workers concernés
CREATE POLICY "saad_assignments_visibility" ON saad_assignments
  FOR SELECT USING (
    is_admin() OR 
    assigned_worker_id = auth.uid() OR
    get_user_type() = 'saad_admin'
  );

-- Les organisations SAAD sont visibles aux admins et à leurs membres
CREATE POLICY "saad_org_visibility" ON saad_organizations
  FOR SELECT USING (
    is_admin() OR 
    get_user_type() IN ('saad_admin', 'saad_worker')
  );

-- =====================================================
-- POLITIQUES POUR LA TABLE TODOS (garder pour tests)
-- =====================================================

-- Les todos sont visibles à tous (table de test)
CREATE POLICY "todos_public_access" ON todos
  FOR ALL USING (true)
  WITH CHECK (true);