-- =====================================================
-- MYCOMPANION - MIGRATION COMPLÈTE AVEC IF NOT EXISTS
-- =====================================================

-- Legend-State helper function (global)
CREATE OR REPLACE FUNCTION handle_times()
    RETURNS trigger AS
    $$
    BEGIN
    IF (TG_OP = 'INSERT') THEN
        NEW.created_at := now();
        NEW.updated_at := now();
    ELSEIF (TG_OP = 'UPDATE') THEN
        NEW.created_at = OLD.created_at;
        NEW.updated_at = now();
    END IF;
    RETURN NEW;
    END;
    $$ language plpgsql;

-- =====================================================
-- TABLE TODOS (existante - avec IF NOT EXISTS)
-- =====================================================
CREATE TABLE IF NOT EXISTS todos (
  id uuid default gen_random_uuid() primary key,
  counter bigint generated by default as identity,
  text text,
  done boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted boolean default false
);

-- Trigger pour todos (seulement s'il n'existe pas)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_times_todos') THEN
        CREATE TRIGGER handle_times_todos
            BEFORE INSERT OR UPDATE ON todos
            FOR EACH ROW
        EXECUTE PROCEDURE handle_times();
    END IF;
END $$;

-- =====================================================
-- TABLES MYCOMPANION
-- =====================================================

-- 👥 TABLE USERS - Gestion multi-acteurs
CREATE TABLE IF NOT EXISTS users (
  id uuid default gen_random_uuid() primary key,
  counter bigint generated by default as identity,
  email varchar not null unique,
  user_type varchar not null check (user_type in ('admin', 'senior', 'family', 'saad_admin', 'saad_worker', 'insurer')),
  first_name varchar not null,
  last_name varchar not null,
  phone varchar,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted boolean default false,
  is_active boolean default true
);

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_times_users') THEN
        CREATE TRIGGER handle_times_users
            BEFORE INSERT OR UPDATE ON users
            FOR EACH ROW
        EXECUTE PROCEDURE handle_times();
    END IF;
END $$;

-- 👴 TABLE SENIORS - Profils des bénéficiaires
CREATE TABLE IF NOT EXISTS seniors (
  id uuid default gen_random_uuid() primary key,
  counter bigint generated by default as identity,
  user_id uuid references users(id) on delete cascade,
  birth_date date,
  preferred_call_time time,
  call_frequency integer default 1,
  personality_profile jsonb,
  medical_context jsonb,
  interests jsonb,
  communication_preferences jsonb,
  emergency_contact varchar,
  address jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted boolean default false
);

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_times_seniors') THEN
        CREATE TRIGGER handle_times_seniors
            BEFORE INSERT OR UPDATE ON seniors
            FOR EACH ROW
        EXECUTE PROCEDURE handle_times();
    END IF;
END $$;

-- 👨‍👩‍👧‍👦 TABLE FAMILY_MEMBERS - Liens familiaux
CREATE TABLE IF NOT EXISTS family_members (
  id uuid default gen_random_uuid() primary key,
  counter bigint generated by default as identity,
  user_id uuid references users(id) on delete cascade,
  senior_id uuid references seniors(id) on delete cascade,
  relationship varchar not null,
  is_primary_contact boolean default false,
  notification_preferences jsonb,
  access_level varchar default 'standard' check (access_level in ('minimal', 'standard', 'full')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted boolean default false,
  unique(user_id, senior_id)
);

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_times_family_members') THEN
        CREATE TRIGGER handle_times_family_members
            BEFORE INSERT OR UPDATE ON family_members
            FOR EACH ROW
        EXECUTE PROCEDURE handle_times();
    END IF;
END $$;

-- 🏢 TABLE SAAD_ORGANIZATIONS - Services d'aide à domicile
CREATE TABLE IF NOT EXISTS saad_organizations (
  id uuid default gen_random_uuid() primary key,
  counter bigint generated by default as identity,
  name varchar not null,
  contact_email varchar not null,
  contact_phone varchar,
  address jsonb,
  subscription_plan varchar default 'pilot' check (subscription_plan in ('pilot', 'essential', 'confort', 'premium')),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted boolean default false
);

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_times_saad_organizations') THEN
        CREATE TRIGGER handle_times_saad_organizations
            BEFORE INSERT OR UPDATE ON saad_organizations
            FOR EACH ROW
        EXECUTE PROCEDURE handle_times();
    END IF;
END $$;

-- 🤝 TABLE SAAD_ASSIGNMENTS - Liens SAAD-Seniors
CREATE TABLE IF NOT EXISTS saad_assignments (
  id uuid default gen_random_uuid() primary key,
  counter bigint generated by default as identity,
  saad_id uuid references saad_organizations(id) on delete cascade,
  senior_id uuid references seniors(id) on delete cascade,
  assigned_worker_id uuid references users(id),
  start_date date not null,
  end_date date,
  service_level varchar default 'standard',
  notes text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted boolean default false,
  unique(senior_id, saad_id, start_date)
);

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_times_saad_assignments') THEN
        CREATE TRIGGER handle_times_saad_assignments
            BEFORE INSERT OR UPDATE ON saad_assignments
            FOR EACH ROW
        EXECUTE PROCEDURE handle_times();
    END IF;
END $$;

-- 📞 TABLE CALLS - Historique des appels
CREATE TABLE IF NOT EXISTS calls (
  id uuid default gen_random_uuid() primary key,
  counter bigint generated by default as identity,
  senior_id uuid references seniors(id) on delete cascade,
  call_type varchar default 'scheduled' check (call_type in ('scheduled', 'emergency', 'followup')),
  status varchar not null check (status in ('scheduled', 'in_progress', 'completed', 'failed', 'no_answer')),
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer,
  quality_score float,
  conversation_summary text,
  mood_detected varchar,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted boolean default false
);

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_times_calls') THEN
        CREATE TRIGGER handle_times_calls
            BEFORE INSERT OR UPDATE ON calls
            FOR EACH ROW
        EXECUTE PROCEDURE handle_times();
    END IF;
END $$;

-- 🎙️ TABLE CONVERSATION_TRANSCRIPTS - Transcriptions
CREATE TABLE IF NOT EXISTS conversation_transcripts (
  id uuid default gen_random_uuid() primary key,
  counter bigint generated by default as identity,
  call_id uuid references calls(id) on delete cascade,
  transcript_text text not null,
  language varchar default 'fr',
  confidence_score float,
  audio_analysis jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted boolean default false
);

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_times_conversation_transcripts') THEN
        CREATE TRIGGER handle_times_conversation_transcripts
            BEFORE INSERT OR UPDATE ON conversation_transcripts
            FOR EACH ROW
        EXECUTE PROCEDURE handle_times();
    END IF;
END $$;

-- 🚨 TABLE ALERTS - Alertes et signaux faibles
CREATE TABLE IF NOT EXISTS alerts (
  id uuid default gen_random_uuid() primary key,
  counter bigint generated by default as identity,
  senior_id uuid references seniors(id) on delete cascade,
  call_id uuid references calls(id),
  alert_type varchar not null check (alert_type in ('health', 'mood', 'confusion', 'emergency', 'medication', 'social', 'technical')),
  severity varchar not null check (severity in ('low', 'medium', 'high', 'critical')),
  title varchar not null,
  description text not null,
  detected_indicators jsonb,
  confidence_score float,
  status varchar default 'new' check (status in ('new', 'acknowledged', 'in_progress', 'resolved', 'false_positive')),
  acknowledged_by uuid references users(id),
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted boolean default false
);

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_times_alerts') THEN
        CREATE TRIGGER handle_times_alerts
            BEFORE INSERT OR UPDATE ON alerts
            FOR EACH ROW
        EXECUTE PROCEDURE handle_times();
    END IF;
END $$;

-- 📊 TABLE WELL_BEING_METRICS - Métriques de bien-être
CREATE TABLE IF NOT EXISTS well_being_metrics (
  id uuid default gen_random_uuid() primary key,
  counter bigint generated by default as identity,
  senior_id uuid references seniors(id) on delete cascade,
  call_id uuid references calls(id),
  metric_date date not null,
  social_score float,
  mood_score float,
  health_score float,
  cognitive_score float,
  engagement_score float,
  overall_score float,
  calculated_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted boolean default false,
  unique(senior_id, metric_date)
);

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_times_well_being_metrics') THEN
        CREATE TRIGGER handle_times_well_being_metrics
            BEFORE INSERT OR UPDATE ON well_being_metrics
            FOR EACH ROW
        EXECUTE PROCEDURE handle_times();
    END IF;
END $$;

-- 📨 TABLE FAMILY_REPORTS - Rapports familles
CREATE TABLE IF NOT EXISTS family_reports (
  id uuid default gen_random_uuid() primary key,
  counter bigint generated by default as identity,
  senior_id uuid references seniors(id) on delete cascade,
  family_member_id uuid references family_members(id) on delete cascade,
  report_type varchar default 'daily' check (report_type in ('daily', 'weekly', 'alert', 'summary')),
  report_period_start date,
  report_period_end date,
  content jsonb not null,
  delivery_method varchar default 'email' check (delivery_method in ('email', 'sms', 'app')),
  sent_at timestamptz,
  opened_at timestamptz,
  status varchar default 'pending' check (status in ('pending', 'sent', 'delivered', 'failed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted boolean default false
);

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_times_family_reports') THEN
        CREATE TRIGGER handle_times_family_reports
            BEFORE INSERT OR UPDATE ON family_reports
            FOR EACH ROW
        EXECUTE PROCEDURE handle_times();
    END IF;
END $$;

-- ⚙️ TABLE AI_MODELS - Gestion des modèles IA
CREATE TABLE IF NOT EXISTS ai_models (
  id uuid default gen_random_uuid() primary key,
  counter bigint generated by default as identity,
  model_name varchar not null,
  model_version varchar not null,
  model_type varchar not null check (model_type in ('conversation', 'sentiment', 'alert_detection', 'voice')),
  configuration jsonb,
  is_active boolean default false,
  performance_metrics jsonb,
  deployed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted boolean default false,
  unique(model_name, model_version)
);

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_times_ai_models') THEN
        CREATE TRIGGER handle_times_ai_models
            BEFORE INSERT OR UPDATE ON ai_models
            FOR EACH ROW
        EXECUTE PROCEDURE handle_times();
    END IF;
END $$;

-- 🔧 TABLE SYSTEM_SETTINGS - Configuration système
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid default gen_random_uuid() primary key,
  counter bigint generated by default as identity,
  setting_key varchar not null unique,
  setting_value jsonb not null,
  setting_type varchar not null check (setting_type in ('global', 'saad', 'senior')),
  description text,
  updated_by uuid references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted boolean default false
);

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_times_system_settings') THEN
        CREATE TRIGGER handle_times_system_settings
            BEFORE INSERT OR UPDATE ON system_settings
            FOR EACH ROW
        EXECUTE PROCEDURE handle_times();
    END IF;
END $$;

-- 📈 TABLE ANALYTICS_EVENTS - Analytics et KPIs
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid default gen_random_uuid() primary key,
  counter bigint generated by default as identity,
  event_type varchar not null,
  entity_type varchar not null,
  entity_id uuid,
  event_data jsonb,
  session_id uuid,
  user_agent text,
  ip_address inet,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted boolean default false
);

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_times_analytics_events') THEN
        CREATE TRIGGER handle_times_analytics_events
            BEFORE INSERT OR UPDATE ON analytics_events
            FOR EACH ROW
        EXECUTE PROCEDURE handle_times();
    END IF;
END $$;

-- =====================================================
-- INDEX POUR LES PERFORMANCES (avec IF NOT EXISTS)
-- =====================================================

-- Index todos
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_todos_created_at') THEN
        CREATE INDEX idx_todos_created_at ON todos(created_at);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_todos_deleted') THEN
        CREATE INDEX idx_todos_deleted ON todos(deleted) WHERE deleted = false;
    END IF;
END $$;

-- Index MyCompanion
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_email') THEN
        CREATE INDEX idx_users_email ON users(email);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_user_type') THEN
        CREATE INDEX idx_users_user_type ON users(user_type);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_seniors_user_id') THEN
        CREATE INDEX idx_seniors_user_id ON seniors(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_family_members_senior_id') THEN
        CREATE INDEX idx_family_members_senior_id ON family_members(senior_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_saad_assignments_senior_id') THEN
        CREATE INDEX idx_saad_assignments_senior_id ON saad_assignments(senior_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_calls_senior_id') THEN
        CREATE INDEX idx_calls_senior_id ON calls(senior_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_calls_created_at') THEN
        CREATE INDEX idx_calls_created_at ON calls(created_at);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_calls_status') THEN
        CREATE INDEX idx_calls_status ON calls(status);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_conversation_transcripts_call_id') THEN
        CREATE INDEX idx_conversation_transcripts_call_id ON conversation_transcripts(call_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_alerts_senior_id') THEN
        CREATE INDEX idx_alerts_senior_id ON alerts(senior_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_alerts_status') THEN
        CREATE INDEX idx_alerts_status ON alerts(status);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_alerts_severity') THEN
        CREATE INDEX idx_alerts_severity ON alerts(severity);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_alerts_created_at') THEN
        CREATE INDEX idx_alerts_created_at ON alerts(created_at);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_well_being_metrics_senior_date') THEN
        CREATE INDEX idx_well_being_metrics_senior_date ON well_being_metrics(senior_id, metric_date);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_family_reports_senior_id') THEN
        CREATE INDEX idx_family_reports_senior_id ON family_reports(senior_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_family_reports_family_member_id') THEN
        CREATE INDEX idx_family_reports_family_member_id ON family_reports(family_member_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_analytics_events_created_at') THEN
        CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_analytics_events_entity') THEN
        CREATE INDEX idx_analytics_events_entity ON analytics_events(entity_type, entity_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_analytics_events_event_type') THEN
        CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
    END IF;
END $$;

-- Index pour soft deletes
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_deleted') THEN
        CREATE INDEX idx_users_deleted ON users(deleted) WHERE deleted = false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_seniors_deleted') THEN
        CREATE INDEX idx_seniors_deleted ON seniors(deleted) WHERE deleted = false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_calls_deleted') THEN
        CREATE INDEX idx_calls_deleted ON calls(deleted) WHERE deleted = false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_alerts_deleted') THEN
        CREATE INDEX idx_alerts_deleted ON alerts(deleted) WHERE deleted = false;
    END IF;
END $$;

-- =====================================================
-- ENABLE REALTIME POUR LEGEND-STATE (avec gestion d'erreurs)
-- =====================================================

-- Fonction helper pour ajouter les tables au realtime sans erreur
CREATE OR REPLACE FUNCTION add_table_to_realtime(table_name text)
RETURNS void AS $$
BEGIN
    BEGIN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', table_name);
    EXCEPTION 
        WHEN duplicate_object THEN
            -- Table déjà dans la publication, on ignore
            NULL;
    END;
END;
$$ LANGUAGE plpgsql;

-- Ajouter les tables au realtime
SELECT add_table_to_realtime('todos');
SELECT add_table_to_realtime('users');
SELECT add_table_to_realtime('seniors');
SELECT add_table_to_realtime('family_members');
SELECT add_table_to_realtime('calls');
SELECT add_table_to_realtime('alerts');
SELECT add_table_to_realtime('well_being_metrics');
SELECT add_table_to_realtime('family_reports');

-- Nettoyer la fonction helper
DROP FUNCTION add_table_to_realtime(text);