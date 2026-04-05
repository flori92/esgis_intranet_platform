-- ============================================================================
-- MIGRATION BLOC 1: Relations Académiques Avancées (5 relations)
-- Date: 2026-04-05
-- ============================================================================

BEGIN TRANSACTION;

-- ============================================================
-- 1. GROUPES PÉDAGOGIQUES (TP/TD)
-- ============================================================

CREATE TABLE IF NOT EXISTS student_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  academic_year VARCHAR(10) NOT NULL,
  group_letter VARCHAR(1) NOT NULL,
  size INTEGER DEFAULT 0,
  professor_id INTEGER REFERENCES professors(id) ON DELETE SET NULL,
  room VARCHAR(50),
  session_day VARCHAR(20),
  session_time TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, academic_year, group_letter),
  CHECK (group_letter ~ '^[A-Z]$')
);

CREATE INDEX IF NOT EXISTS idx_student_groups_course ON student_groups(course_id);
CREATE INDEX IF NOT EXISTS idx_student_groups_year ON student_groups(academic_year);
CREATE INDEX IF NOT EXISTS idx_student_groups_professor ON student_groups(professor_id);

CREATE TABLE IF NOT EXISTS group_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES student_groups(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_group_memberships_group ON group_memberships(group_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_student ON group_memberships(student_id);

-- ============================================================
-- 2. PRÉ-REQUIS ACADÉMIQUES
-- ============================================================

CREATE TABLE IF NOT EXISTS course_prerequisites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  prerequisite_course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  min_grade NUMERIC(5,2) DEFAULT 10.00,
  is_mandatory BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, prerequisite_course_id),
  CHECK (course_id != prerequisite_course_id)
);

CREATE INDEX IF NOT EXISTS idx_course_prerequisites_course ON course_prerequisites(course_id);
CREATE INDEX IF NOT EXISTS idx_course_prerequisites_prereq ON course_prerequisites(prerequisite_course_id);

CREATE TABLE IF NOT EXISTS prerequisite_validations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id INTEGER NOT NULL REFERENCES students(id),
  course_id INTEGER NOT NULL REFERENCES courses(id),
  prerequisite_id UUID NOT NULL REFERENCES course_prerequisites(id),
  is_satisfied BOOLEAN,
  actual_grade NUMERIC(5,2),
  waived BOOLEAN DEFAULT false,
  waived_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, prerequisite_id)
);

CREATE INDEX IF NOT EXISTS idx_prerequisite_validations_student ON prerequisite_validations(student_id);
CREATE INDEX IF NOT EXISTS idx_prerequisite_validations_course ON prerequisite_validations(course_id);

-- ============================================================
-- 3. PROGRAMMES D'ÉTUDES (PARCOURS)
-- ============================================================

CREATE TABLE IF NOT EXISTS study_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  level_code TEXT NOT NULL,
  description TEXT,
  start_year INTEGER,
  end_year INTEGER,
  responsible_professor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_programs_dept ON study_programs(department_id);
CREATE INDEX IF NOT EXISTS idx_study_programs_level ON study_programs(level_code);

CREATE TABLE IF NOT EXISTS program_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID NOT NULL REFERENCES study_programs(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 10),
  is_mandatory BOOLEAN DEFAULT true,
  coefficient NUMERIC(5,2) DEFAULT 1.00,
  credits INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(program_id, course_id),
  CHECK (coefficient > 0)
);

CREATE INDEX IF NOT EXISTS idx_program_courses_program ON program_courses(program_id);
CREATE INDEX IF NOT EXISTS idx_program_courses_course ON program_courses(course_id);

CREATE TABLE IF NOT EXISTS student_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id INTEGER NOT NULL REFERENCES students(id),
  program_id UUID NOT NULL REFERENCES study_programs(id),
  start_year INTEGER NOT NULL,
  end_year INTEGER,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'abandoned', 'transfer')),
  specialization VARCHAR(100),
  thesis_title TEXT,
  thesis_grade NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, program_id, start_year)
);

CREATE INDEX IF NOT EXISTS idx_student_programs_student ON student_programs(student_id);
CREATE INDEX IF NOT EXISTS idx_student_programs_program ON student_programs(program_id);

-- ============================================================
-- 4. COMPÉTENCES & SKILLS
-- ============================================================

CREATE TABLE IF NOT EXISTS competencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('technical', 'soft_skills', 'languages', 'domain_specific', 'other')),
  level TEXT DEFAULT 'intermediate' CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_competencies_category ON competencies(category);

CREATE TABLE IF NOT EXISTS course_competencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  competency_id UUID NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
  level_required TEXT DEFAULT 'intermediate',
  weight INTEGER DEFAULT 50 CHECK (weight >= 0 AND weight <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, competency_id)
);

CREATE INDEX IF NOT EXISTS idx_course_competencies_course ON course_competencies(course_id);
CREATE INDEX IF NOT EXISTS idx_course_competencies_competency ON course_competencies(competency_id);

CREATE TABLE IF NOT EXISTS student_competencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id INTEGER NOT NULL REFERENCES students(id),
  competency_id UUID NOT NULL REFERENCES competencies(id),
  level_achieved TEXT NOT NULL CHECK (level_achieved IN ('beginner', 'intermediate', 'advanced', 'expert')),
  acquired_from TEXT NOT NULL CHECK (acquired_from IN ('course', 'exam', 'project', 'internship', 'certification')),
  source_id VARCHAR(50),
  acquired_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, competency_id)
);

CREATE INDEX IF NOT EXISTS idx_student_competencies_student ON student_competencies(student_id);
CREATE INDEX IF NOT EXISTS idx_student_competencies_competency ON student_competencies(competency_id);

-- ============================================================
-- 5. PARCOURS D'APPRENTISSAGE PERSONNALISÉS
-- ============================================================

CREATE TABLE IF NOT EXISTS learning_paths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sequence_order INTEGER DEFAULT 0,
  objectives TEXT[],
  estimated_hours DECIMAL(5,2) DEFAULT 0,
  is_personalized BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_paths_course ON learning_paths(course_id);
CREATE INDEX IF NOT EXISTS idx_learning_paths_student ON learning_paths(student_id);

CREATE TABLE IF NOT EXISTS path_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES course_resources(id) ON DELETE CASCADE,
  order_sequence INTEGER NOT NULL,
  estimated_duration DECIMAL(5,2),
  is_mandatory BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(path_id, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_path_resources_path ON path_resources(path_id);

CREATE TABLE IF NOT EXISTS student_path_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id INTEGER NOT NULL REFERENCES students(id),
  path_id UUID NOT NULL REFERENCES learning_paths(id),
  resource_id UUID NOT NULL REFERENCES course_resources(id),
  viewed BOOLEAN DEFAULT false,
  downloaded BOOLEAN DEFAULT false,
  time_spent DECIMAL(8,2),
  last_accessed TIMESTAMPTZ,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  viewed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, path_id, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_student_path_progress_student ON student_path_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_path_progress_path ON student_path_progress(path_id);

/*
 ======================================================
 Enable RLS for Bloc 1
 ======================================================
*/

ALTER TABLE student_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE prerequisite_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE path_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_path_progress ENABLE ROW LEVEL SECURITY;

/*
 ======================================================
 Basic RLS Policies for Bloc 1
 ======================================================
*/

-- Students see their own group memberships
CREATE POLICY "students_see_own_groups" ON student_groups
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM group_memberships gm
      JOIN students s ON s.id = gm.student_id
      JOIN profiles p ON p.id = s.profile_id
      WHERE gm.group_id = student_groups.id
      AND p.id = auth.uid()
    )
  );

-- Professors manage groups they teach
CREATE POLICY "professors_manage_own_groups" ON student_groups
  FOR ALL USING (
    professor_id IN (
      SELECT prof.id FROM professors prof
      JOIN profiles p ON prof.profile_id = p.id
      WHERE p.id = auth.uid()
    )
  );

-- Admins manage all
CREATE POLICY "admins_manage_all" ON student_groups
  FOR ALL USING (
    EXISTS(
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

COMMIT;
