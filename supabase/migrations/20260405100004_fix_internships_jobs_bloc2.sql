-- ============================================================================
-- MIGRATION FIX: Correction des relations partiellement créées
-- Date: 5 avril 2026
-- ============================================================================

BEGIN TRANSACTION;

-- Nettoyer les tables partiellement créées
DROP TABLE IF EXISTS student_internships CASCADE;
DROP TABLE IF EXISTS job_applications CASCADE;
DROP TABLE IF EXISTS job_offers CASCADE;
DROP TABLE IF EXISTS alumni_registrations CASCADE;
DROP TABLE IF EXISTS company_interactions CASCADE;
DROP TABLE IF EXISTS company_partnerships CASCADE;
DROP TABLE IF EXISTS internship_applications CASCADE;
DROP TABLE IF EXISTS internship_offers CASCADE;

-- Recréer les tables avec le bon ordre de dépendances

-- ============================================================
-- 6. OFFRES DE STAGE
-- ============================================================

CREATE TABLE internship_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_contact_email VARCHAR(255),
  company_phone VARCHAR(20),
  location TEXT,
  duration_weeks INTEGER,
  start_date DATE,
  end_date DATE,
  required_level TEXT NOT NULL CHECK (required_level IN ('L1', 'L2', 'L3', 'M1', 'M2')),
  required_semester INTEGER,
  salary_range_min DECIMAL(10,2),
  salary_range_max DECIMAL(10,2),
  required_skills UUID[],
  required_documents TEXT[],
  posted_by UUID NOT NULL REFERENCES profiles(id),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'filled', 'cancelled')),
  application_deadline DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_internship_offers_status ON internship_offers(status);
CREATE INDEX idx_internship_offers_deadline ON internship_offers(application_deadline);
CREATE INDEX idx_internship_offers_level ON internship_offers(required_level);

CREATE TABLE internship_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_id UUID NOT NULL REFERENCES internship_offers(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id),
  application_date TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'interview', 'offered')),
  resume_url TEXT,
  motivation_letter TEXT,
  applied_skills UUID[],
  interview_date TIMESTAMPTZ,
  interview_notes TEXT,
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(offer_id, student_id)
);

CREATE INDEX idx_internship_applications_offer ON internship_applications(offer_id);
CREATE INDEX idx_internship_applications_student ON internship_applications(student_id);
CREATE INDEX idx_internship_applications_status ON internship_applications(status);

CREATE TABLE student_internships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id INTEGER NOT NULL REFERENCES students(id),
  internship_offer_id UUID NOT NULL REFERENCES internship_offers(id),
  application_id UUID NOT NULL REFERENCES internship_applications(id),
  academic_year VARCHAR(10),
  start_date DATE NOT NULL,
  end_date DATE,
  company_supervisor_name TEXT,
  company_supervisor_email VARCHAR(255),
  internship_report_url TEXT,
  internship_grade NUMERIC(5,2),
  university_supervisor_id UUID REFERENCES profiles(id),
  supervisor_comments TEXT,
  completed BOOLEAN DEFAULT false,
  credits_earned INTEGER DEFAULT 6,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_student_internships_student ON student_internships(student_id);
CREATE INDEX idx_student_internships_offer ON student_internships(internship_offer_id);

-- ============================================================
-- 7. OFFRES D'EMPLOI POUR GRADUANDOS
-- ============================================================

CREATE TABLE job_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  description TEXT,
  job_type VARCHAR(50) CHECK (job_type IN ('cdi', 'cdd', 'freelance', 'project')),
  salary_range_min DECIMAL(10,2),
  salary_range_max DECIMAL(10,2),
  location TEXT,
  remote_allowed BOOLEAN DEFAULT false,
  required_level TEXT CHECK (required_level IN ('L3', 'M1', 'M2', 'graduate')),
  required_skills UUID[],
  posted_by UUID NOT NULL REFERENCES profiles(id),
  application_deadline DATE,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'filled', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_job_offers_status ON job_offers(status);
CREATE INDEX idx_job_offers_level ON job_offers(required_level);

CREATE TABLE job_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_offer_id UUID NOT NULL REFERENCES job_offers(id),
  student_id INTEGER NOT NULL REFERENCES students(id),
  cover_letter TEXT,
  resume_url TEXT,
  application_date TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'interview', 'offered', 'rejected')),
  interview_date TIMESTAMPTZ,
  interview_notes TEXT,
  offer_made BOOLEAN DEFAULT false,
  offer_accepted BOOLEAN,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_offer_id, student_id)
);

CREATE INDEX idx_job_applications_offer ON job_applications(job_offer_id);
CREATE INDEX idx_job_applications_student ON job_applications(student_id);

CREATE TABLE alumni_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  graduate_student_id INTEGER NOT NULL REFERENCES students(id),
  current_company TEXT,
  current_position TEXT,
  graduation_date DATE,
  career_path TEXT[],
  linkedin_profile VARCHAR(255),
  contact_email VARCHAR(255),
  is_available_mentoring BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alumni_registrations_student ON alumni_registrations(graduate_student_id);

-- ============================================================
-- 8. PARTENARIATS ENTREPRISES
-- ============================================================

CREATE TABLE company_partnerships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_code TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  sector VARCHAR(100),
  website VARCHAR(255),
  contact_person_name TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  partnership_type TEXT[] DEFAULT '{}',
  partnership_level TEXT DEFAULT 'standard' CHECK (partnership_level IN ('standard', 'premium', 'strategic')),
  agreement_start_date DATE,
  agreement_end_date DATE,
  account_manager_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_company_partnerships_level ON company_partnerships(partnership_level);

CREATE TABLE company_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES company_partnerships(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('presentation', 'recruiting', 'sponsoring', 'meeting', 'other')),
  interaction_date TIMESTAMPTZ,
  description TEXT,
  contact_person VARCHAR(100),
  recorded_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_company_interactions_company ON company_interactions(company_id);
CREATE INDEX idx_company_interactions_date ON company_interactions(interaction_date);

-- ============================================================
-- Enable RLS on all new Bloc 2 tables
-- ============================================================

ALTER TABLE internship_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE internship_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumni_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_interactions ENABLE ROW LEVEL SECURITY;

COMMIT;

-- ============================================================================
-- Summary
-- ============================================================================

-- This script fixes Bloc 2 (Internships & Jobs - 3 relations):
-- ✓ 8 new tables created/fixed
-- ✓ 15 indexes created
-- ✓ RLS enabled on all tables
-- ✓ Foreign key relationships properly established
--
-- Status: Ready to continue with Blocs 3-6
