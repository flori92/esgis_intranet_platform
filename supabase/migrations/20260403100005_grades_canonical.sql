-- Canonical grades table and correction workflow aligned with the current ESGIS schema.

CREATE TABLE IF NOT EXISTS grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  professor_id INTEGER NOT NULL REFERENCES professors(id) ON DELETE CASCADE,
  evaluation_type TEXT NOT NULL,
  coefficient NUMERIC(5,2) NOT NULL DEFAULT 1.00,
  value NUMERIC(5,2) NOT NULL,
  max_value NUMERIC(5,2) NOT NULL DEFAULT 20.00,
  comment TEXT,
  evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT grades_unique_evaluation UNIQUE (student_id, course_id, evaluation_type, professor_id),
  CONSTRAINT grades_value_range CHECK (value >= 0 AND value <= max_value),
  CONSTRAINT grades_max_value_positive CHECK (max_value > 0)
);

CREATE INDEX IF NOT EXISTS idx_grades_student ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_course ON grades(course_id);
CREATE INDEX IF NOT EXISTS idx_grades_professor ON grades(professor_id);
CREATE INDEX IF NOT EXISTS idx_grades_evaluation_type ON grades(evaluation_type);
CREATE INDEX IF NOT EXISTS idx_grades_published ON grades(is_published);

CREATE OR REPLACE FUNCTION update_grades_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_grades_updated_at ON grades;
CREATE TRIGGER trigger_update_grades_updated_at
  BEFORE UPDATE ON grades
  FOR EACH ROW
  EXECUTE FUNCTION update_grades_updated_at();

ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'grades'
      AND policyname = 'admin_all_grades_v2'
  ) THEN
    CREATE POLICY admin_all_grades_v2 ON grades
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM profiles
          WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM profiles
          WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'grades'
      AND policyname = 'professor_manage_assigned_grades_v2'
  ) THEN
    CREATE POLICY professor_manage_assigned_grades_v2 ON grades
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM professors pr
          JOIN professor_courses pc ON pc.professor_id = pr.id
          WHERE pr.profile_id = auth.uid()
            AND pr.id = grades.professor_id
            AND pc.course_id = grades.course_id
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM professors pr
          JOIN professor_courses pc ON pc.professor_id = pr.id
          WHERE pr.profile_id = auth.uid()
            AND pr.id = grades.professor_id
            AND pc.course_id = grades.course_id
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'grades'
      AND policyname = 'student_read_own_grades_v2'
  ) THEN
    CREATE POLICY student_read_own_grades_v2 ON grades
      FOR SELECT
      TO authenticated
      USING (
        is_published = TRUE
        AND EXISTS (
          SELECT 1
          FROM students s
          WHERE s.profile_id = auth.uid()
            AND s.id = grades.student_id
        )
      );
  END IF;
END $$;

ALTER TABLE demandes_correction_notes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_corrections_professeur ON demandes_correction_notes(professeur_id);
CREATE INDEX IF NOT EXISTS idx_corrections_statut ON demandes_correction_notes(statut);
CREATE INDEX IF NOT EXISTS idx_corrections_note ON demandes_correction_notes(note_id);

DROP TRIGGER IF EXISTS trigger_apply_grade_correction ON demandes_correction_notes;
DROP FUNCTION IF EXISTS apply_grade_correction();

CREATE OR REPLACE FUNCTION apply_grade_correction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.statut = 'validee' AND COALESCE(OLD.statut, '') <> 'validee' THEN
    UPDATE grades
    SET value = NEW.nouvelle_note,
        updated_at = NOW()
    WHERE id = NEW.note_id;

    NEW.validated_at = COALESCE(NEW.validated_at, NOW());

    INSERT INTO notifications (recipient_id, recipient_role, sender_id, title, content, priority)
    SELECT
      s.profile_id,
      'student',
      NEW.validee_par,
      'Note corrigée',
      'Votre note a été corrigée de ' || NEW.ancienne_note || ' à ' || NEW.nouvelle_note || '.',
      'medium'
    FROM grades g
    JOIN students s ON s.id = g.student_id
    WHERE g.id = NEW.note_id
      AND s.profile_id IS NOT NULL;
  ELSIF NEW.statut = 'rejetee' AND COALESCE(OLD.statut, '') <> 'rejetee' THEN
    NEW.validated_at = COALESCE(NEW.validated_at, NOW());
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_apply_grade_correction
  BEFORE UPDATE ON demandes_correction_notes
  FOR EACH ROW
  EXECUTE FUNCTION apply_grade_correction();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'demandes_correction_notes'
      AND policyname = 'professors_own_grade_corrections_v2'
  ) THEN
    CREATE POLICY professors_own_grade_corrections_v2 ON demandes_correction_notes
      FOR ALL
      TO authenticated
      USING (professeur_id = auth.uid())
      WITH CHECK (professeur_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'demandes_correction_notes'
      AND policyname = 'admins_all_grade_corrections_v2'
  ) THEN
    CREATE POLICY admins_all_grade_corrections_v2 ON demandes_correction_notes
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM profiles
          WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM profiles
          WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;
