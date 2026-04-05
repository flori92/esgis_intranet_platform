-- Migration Phases 3, 4, 5 — Tables manquantes
-- Date: 2026-04-04
-- Description: academic_levels, academic_semesters, academic_years,
-- grade_history, integrity_reports, notification_preferences,
-- system_monitoring, backups, data_retention_logs, validation_queue (if missing)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- STRUCTURE ACADÉMIQUE (§5.4)
-- ============================================================

CREATE TABLE IF NOT EXISTS academic_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO academic_levels (code, label, sort_order) VALUES
  ('L1', 'Licence 1', 1),
  ('L2', 'Licence 2', 2),
  ('L3', 'Licence 3', 3),
  ('M1', 'Master 1', 4),
  ('M2', 'Master 2', 5)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS academic_semesters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(code, academic_year)
);

INSERT INTO academic_semesters (name, code, academic_year, start_date, end_date, is_active) VALUES
  ('Semestre 1', 'S1', '2025-2026', '2025-09-15', '2026-01-31', false),
  ('Semestre 2', 'S2', '2025-2026', '2026-02-01', '2026-06-30', true)
ON CONFLICT (code, academic_year) DO NOTHING;

CREATE TABLE IF NOT EXISTS academic_years (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label TEXT NOT NULL UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO academic_years (label, start_date, end_date, is_current) VALUES
  ('2025-2026', '2025-09-01', '2026-08-31', true),
  ('2024-2025', '2024-09-01', '2025-08-31', false)
ON CONFLICT (label) DO NOTHING;

-- Maquettes pédagogiques (quelles matières pour quelle filière/niveau)
CREATE TABLE IF NOT EXISTS curriculum_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
  level_code TEXT NOT NULL,
  semester_code TEXT NOT NULL,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  coefficient NUMERIC NOT NULL DEFAULT 1,
  credits INTEGER NOT NULL DEFAULT 3,
  is_optional BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(department_id, level_code, semester_code, course_id)
);

-- ============================================================
-- HISTORIQUE DES MODIFICATIONS DE NOTES (§4 — Sécurité)
-- ============================================================

CREATE TABLE IF NOT EXISTS grade_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grade_id UUID NOT NULL,
  student_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  old_value NUMERIC,
  new_value NUMERIC,
  change_type TEXT NOT NULL CHECK (change_type IN ('create', 'update', 'delete', 'publish', 'correction')),
  changed_by UUID NOT NULL REFERENCES profiles(id),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grade_history_student ON grade_history(student_id);
CREATE INDEX IF NOT EXISTS idx_grade_history_grade ON grade_history(grade_id);

-- ============================================================
-- RAPPORTS D'INTÉGRITÉ EXAMEN (§6.3)
-- ============================================================

CREATE TABLE IF NOT EXISTS integrity_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  generated_by UUID REFERENCES profiles(id),
  total_students INTEGER NOT NULL DEFAULT 0,
  incidents_count INTEGER NOT NULL DEFAULT 0,
  tab_switches JSONB NOT NULL DEFAULT '[]',
  reconnections JSONB NOT NULL DEFAULT '[]',
  suspicious_timing JSONB NOT NULL DEFAULT '[]',
  copy_similarity JSONB NOT NULL DEFAULT '[]',
  summary TEXT,
  risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- OTP / VÉRIFICATION RENFORCÉE (§6.3)
-- ============================================================

CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  code TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('exam_access', 'login_2fa', 'password_reset', 'account_verify')),
  method TEXT NOT NULL DEFAULT 'email' CHECK (method IN ('email', 'sms')),
  is_used BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_user ON otp_codes(user_id);

-- 2FA settings per user
CREATE TABLE IF NOT EXISTS two_factor_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  method TEXT NOT NULL DEFAULT 'email' CHECK (method IN ('email', 'sms', 'totp')),
  totp_secret TEXT,
  backup_codes JSONB,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CONFORMITÉ RGPD (§9.4)
-- ============================================================

CREATE TABLE IF NOT EXISTS data_retention_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  data_type TEXT NOT NULL UNIQUE,
  retention_days INTEGER NOT NULL,
  description TEXT,
  auto_delete BOOLEAN NOT NULL DEFAULT false,
  last_cleanup_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO data_retention_policies (data_type, retention_days, description, auto_delete) VALUES
  ('audit_log', 1095, 'Journal d''audit conservé 3 ans', false),
  ('notifications', 365, 'Notifications conservées 1 an', true),
  ('otp_codes', 1, 'Codes OTP expirés supprimés après 24h', true),
  ('session_logs', 180, 'Logs de session conservés 6 mois', true),
  ('exam_attempts', 1825, 'Tentatives d''examen conservées 5 ans', false),
  ('grade_history', 3650, 'Historique des notes conservé 10 ans', false),
  ('documents', 3650, 'Documents officiels conservés 10 ans', false)
ON CONFLICT (data_type) DO NOTHING;

CREATE TABLE IF NOT EXISTS data_access_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  request_type TEXT NOT NULL CHECK (request_type IN ('access', 'rectification', 'deletion', 'export', 'portability')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  details TEXT,
  response TEXT,
  processed_by UUID REFERENCES profiles(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PRÉFÉRENCES DE NOTIFICATIONS (§9.1)
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) UNIQUE,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  email_digest TEXT NOT NULL DEFAULT 'immediate' CHECK (email_digest IN ('immediate', 'daily', 'weekly', 'none')),
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  categories JSONB NOT NULL DEFAULT '{"grades": true, "exams": true, "messages": true, "announcements": true, "documents": true, "forums": true}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MONITORING SYSTÈME (§7)
-- ============================================================

CREATE TABLE IF NOT EXISTS system_monitoring (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_type TEXT NOT NULL CHECK (metric_type IN ('cpu', 'memory', 'storage', 'requests', 'errors', 'latency', 'users_online')),
  metric_value NUMERIC NOT NULL,
  metadata JSONB,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monitoring_type_date ON system_monitoring(metric_type, recorded_at DESC);

-- ============================================================
-- SAUVEGARDES (§7)
-- ============================================================

CREATE TABLE IF NOT EXISTS backups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  backup_type TEXT NOT NULL CHECK (backup_type IN ('full', 'incremental', 'manual')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  file_path TEXT,
  file_size BIGINT,
  tables_included JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  triggered_by UUID REFERENCES profiles(id),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- VALIDATION QUEUE (si pas encore créée)
-- ============================================================

CREATE TABLE IF NOT EXISTS validation_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_type TEXT NOT NULL CHECK (request_type IN ('transcript', 'certificate', 'attestation', 'diploma', 'grade_correction', 'document_upload')),
  student_id INTEGER REFERENCES students(id),
  requester_id UUID REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  details JSONB,
  reviewer_id UUID REFERENCES profiles(id),
  review_comment TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MANUAL DOCUMENT DEPOSIT (dépôt dans dossier étudiant)
-- ============================================================

-- Utilise la table generated_documents existante, ajout de colonnes si absentes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_documents' AND column_name = 'manual_deposit') THEN
    ALTER TABLE generated_documents ADD COLUMN manual_deposit BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_documents' AND column_name = 'deposit_note') THEN
    ALTER TABLE generated_documents ADD COLUMN deposit_note TEXT;
  END IF;
END;
$$;

-- ============================================================
-- REÇUS DE PAIEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id INTEGER NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  receipt_number TEXT NOT NULL UNIQUE,
  amount NUMERIC NOT NULL,
  payment_method TEXT,
  file_path TEXT,
  generated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TRIGGERS updated_at
-- ============================================================

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'academic_levels', 'academic_semesters', 'two_factor_settings',
      'notification_preferences', 'validation_queue'
    ])
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trigger_update_%s_updated_at ON %I; CREATE TRIGGER trigger_update_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      tbl, tbl, tbl, tbl
    );
  END LOOP;
END;
$$;

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE academic_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrity_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_factor_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_templates ENABLE ROW LEVEL SECURITY;

-- Lectures publiques pour structure académique
CREATE POLICY "levels_read" ON academic_levels FOR SELECT USING (true);
CREATE POLICY "levels_admin" ON academic_levels FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "semesters_read" ON academic_semesters FOR SELECT USING (true);
CREATE POLICY "semesters_admin" ON academic_semesters FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "years_read" ON academic_years FOR SELECT USING (true);
CREATE POLICY "years_admin" ON academic_years FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "curriculum_read" ON curriculum_templates FOR SELECT USING (true);
CREATE POLICY "curriculum_admin" ON curriculum_templates FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Grade history: profs et admins
CREATE POLICY "grade_history_read" ON grade_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'professor'))
);
CREATE POLICY "grade_history_insert" ON grade_history FOR INSERT WITH CHECK (auth.uid() = changed_by);

-- Integrity: profs et admins
CREATE POLICY "integrity_read" ON integrity_reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'professor'))
);

-- OTP: propre utilisateur
CREATE POLICY "otp_own" ON otp_codes FOR ALL USING (auth.uid() = user_id);

-- 2FA: propre utilisateur
CREATE POLICY "2fa_own" ON two_factor_settings FOR ALL USING (auth.uid() = user_id);

-- Notifications prefs: propre utilisateur
CREATE POLICY "notif_prefs_own" ON notification_preferences FOR ALL USING (auth.uid() = user_id);

-- Data access: propre utilisateur + admin
CREATE POLICY "data_access_own" ON data_access_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "data_access_admin" ON data_access_requests FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Monitoring, backups, retention: admins
CREATE POLICY "monitoring_admin" ON system_monitoring FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "backups_admin" ON backups FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "retention_admin" ON data_retention_policies FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Validation queue: admin
CREATE POLICY "vq_admin" ON validation_queue FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "vq_requester" ON validation_queue FOR SELECT USING (auth.uid() = requester_id);

-- Payment receipts
CREATE POLICY "receipts_admin" ON payment_receipts FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "receipts_student" ON payment_receipts FOR SELECT USING (auth.uid()::text = student_id::text);
