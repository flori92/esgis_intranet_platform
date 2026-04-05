-- Migration complète pour rendre toutes les fonctionnalités dynamiques
-- Date: 2026-04-03
-- Description: Tables manquantes pour forums, annonces, partenaires,
-- banque de questions, quiz d'entraînement, config système, audit log

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- FORUMS PAR MATIÈRE (§3.8)
-- ============================================================
CREATE TABLE IF NOT EXISTS forums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cours_id UUID NOT NULL REFERENCES cours(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  forum_id UUID NOT NULL REFERENCES forums(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  pinned BOOLEAN NOT NULL DEFAULT false,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, post_id),
  UNIQUE(user_id, reply_id)
);

-- ============================================================
-- ANNONCES CIBLÉES (§5.8)
-- ============================================================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target JSONB NOT NULL DEFAULT '["all"]',
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'high')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  author_id UUID NOT NULL REFERENCES profiles(id),
  send_push BOOLEAN NOT NULL DEFAULT false,
  send_email BOOLEAN NOT NULL DEFAULT false,
  send_sms BOOLEAN NOT NULL DEFAULT false,
  views_count INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PARTENAIRES ENTREPRISES (§5.6)
-- ============================================================
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sector TEXT,
  location TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'actif' CHECK (status IN ('actif', 'inactif')),
  stages_count INTEGER NOT NULL DEFAULT 0,
  last_collaboration DATE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BANQUE DE QUESTIONS (§4.7)
-- ============================================================
CREATE TABLE IF NOT EXISTS question_bank (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professeur_id UUID NOT NULL REFERENCES profiles(id),
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN (
    'qcm_single', 'qcm_multiple', 'true_false', 'short_answer',
    'long_answer', 'numeric', 'matching', 'ordering', 'fill_blank', 'image_question'
  )),
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  matiere TEXT,
  theme TEXT,
  options JSONB,
  correct_answer JSONB,
  correct_answers JSONB,
  points INTEGER NOT NULL DEFAULT 1,
  explanation TEXT,
  tolerance NUMERIC DEFAULT 0,
  unit TEXT,
  max_words INTEGER,
  left_items JSONB,
  right_items JSONB,
  items JSONB,
  text_with_blanks TEXT,
  image_url TEXT,
  image_caption TEXT,
  answer_type TEXT,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  used_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_question_bank_prof ON question_bank(professeur_id);
CREATE INDEX IF NOT EXISTS idx_question_bank_type ON question_bank(question_type);
CREATE INDEX IF NOT EXISTS idx_question_bank_matiere ON question_bank(matiere);

-- ============================================================
-- QUIZ D'ENTRAÎNEMENT (§6.5)
-- ============================================================
CREATE TABLE IF NOT EXISTS practice_quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  cours_id UUID REFERENCES cours(id),
  professeur_id UUID NOT NULL REFERENCES profiles(id),
  questions JSONB NOT NULL DEFAULT '[]',
  duration_minutes INTEGER DEFAULT 30,
  difficulty TEXT DEFAULT 'medium',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS practice_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES practice_quizzes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id),
  answers JSONB NOT NULL DEFAULT '{}',
  score INTEGER NOT NULL DEFAULT 0,
  max_score INTEGER NOT NULL DEFAULT 0,
  percentage INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RESSOURCES PÉDAGOGIQUES ENRICHIES (§3.2)
-- ============================================================
CREATE TABLE IF NOT EXISTS course_chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cours_id UUID NOT NULL REFERENCES cours(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID NOT NULL REFERENCES course_chapters(id) ON DELETE CASCADE,
  cours_id UUID NOT NULL REFERENCES cours(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'pdf',
  file_size INTEGER NOT NULL DEFAULT 0,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  publish_at TIMESTAMPTZ,
  downloads_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resource_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_id UUID NOT NULL REFERENCES course_resources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'download', 'favorite', 'reaction')),
  reaction_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(resource_id, user_id, interaction_type)
);

-- ============================================================
-- PAIEMENTS ENRICHIS (§5.2)
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paiement_id UUID REFERENCES paiements(id),
  etudiant_id UUID NOT NULL REFERENCES profiles(id),
  montant NUMERIC NOT NULL,
  methode TEXT NOT NULL,
  reference TEXT,
  date_versement DATE NOT NULL,
  enregistre_par UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOG (§7)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  user_name TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  details TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource);
CREATE INDEX IF NOT EXISTS idx_audit_log_date ON audit_log(created_at DESC);

-- ============================================================
-- RÔLES & PERMISSIONS (§7)
-- ============================================================
CREATE TABLE IF NOT EXISTS custom_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}',
  is_system BOOLEAN NOT NULL DEFAULT false,
  user_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CONFIG SYSTÈME (§7)
-- ============================================================
CREATE TABLE IF NOT EXISTS system_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2FA CODES (§9.4)
-- ============================================================
CREATE TABLE IF NOT EXISTS two_factor_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  code TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('email', 'sms')),
  verified BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_2fa_user ON two_factor_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_2fa_expires ON two_factor_codes(expires_at);

-- ============================================================
-- TRIGGERS : updated_at automatique
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'forum_posts', 'announcements', 'partners', 'question_bank',
      'practice_quizzes', 'course_resources', 'custom_roles'
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
-- TRIGGER : Audit log automatique pour actions sensibles
-- ============================================================
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (user_id, action, resource, resource_id, details, created_at)
  VALUES (
    COALESCE(NEW.professeur_id, NEW.uploaded_by, NEW.author_id, NEW.created_by, NEW.enregistre_par),
    TG_OP,
    TG_TABLE_NAME,
    NEW.id::TEXT,
    'Auto-logged by trigger',
    NOW()
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Forum: tous les utilisateurs authentifiés peuvent lire, auteurs peuvent modifier
CREATE POLICY "forum_posts_read" ON forum_posts FOR SELECT USING (true);
CREATE POLICY "forum_posts_write" ON forum_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "forum_posts_update" ON forum_posts FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "forum_replies_read" ON forum_replies FOR SELECT USING (true);
CREATE POLICY "forum_replies_write" ON forum_replies FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Annonces: tous lisent les publiées, admins gèrent tout
CREATE POLICY "announcements_read" ON announcements FOR SELECT USING (status = 'published' OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "announcements_admin" ON announcements FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Question bank: professeurs gèrent les leurs, partagées visibles par tous les profs
CREATE POLICY "qbank_own" ON question_bank FOR ALL USING (auth.uid() = professeur_id);
CREATE POLICY "qbank_shared_read" ON question_bank FOR SELECT USING (is_shared = true AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('professor', 'admin')));

-- Audit: admins seulement
CREATE POLICY "audit_admin" ON audit_log FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Config système: admins seulement
CREATE POLICY "config_admin" ON system_config FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Rôles: admins seulement
CREATE POLICY "roles_admin" ON custom_roles FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "roles_read" ON custom_roles FOR SELECT USING (true);
