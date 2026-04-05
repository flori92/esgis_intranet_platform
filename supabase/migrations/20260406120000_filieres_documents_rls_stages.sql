-- Consolidation schéma ESGIS (post 2026-04-05)
-- - Table filieres + colonnes students manquantes
-- - Table documents_generes (QR / scolarité)
-- - Correction validation_queue.student_id si type incohérent
-- - RLS stages / emplois (lecture offres ouvertes + candidatures)

-- ---------------------------------------------------------------------------
-- Helper admin (idempotent)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- Filières (référencées par l’app mais absentes des migrations historiques)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.filieres (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(50),
  description TEXT,
  department_id INTEGER REFERENCES public.departments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_filieres_department ON public.filieres(department_id);

ALTER TABLE public.filieres ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS filieres_select_all ON public.filieres;
CREATE POLICY filieres_select_all ON public.filieres
  FOR SELECT TO authenticated
  USING (true);
DROP POLICY IF EXISTS filieres_admin_all ON public.filieres;
CREATE POLICY filieres_admin_all ON public.filieres
  FOR ALL TO authenticated
  USING (public.check_is_admin())
  WITH CHECK (public.check_is_admin());

-- ---------------------------------------------------------------------------
-- Colonnes étudiant utilisées par les formulaires / rapports
-- ---------------------------------------------------------------------------
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS filiere_id INTEGER REFERENCES public.filieres(id) ON DELETE SET NULL;
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS academic_year VARCHAR(32);

CREATE INDEX IF NOT EXISTS idx_students_filiere ON public.students(filiere_id);

-- ---------------------------------------------------------------------------
-- validation_queue : student_id doit référencer students.id (INTEGER)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'validation_queue'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'validation_queue'
        AND column_name = 'student_id'
        AND udt_name = 'uuid'
    ) THEN
      ALTER TABLE public.validation_queue
        DROP CONSTRAINT IF EXISTS validation_queue_student_id_fkey;
      ALTER TABLE public.validation_queue
        ALTER COLUMN student_id DROP NOT NULL;
      ALTER TABLE public.validation_queue
        ALTER COLUMN student_id TYPE INTEGER USING NULL;
      ALTER TABLE public.validation_queue
        ADD CONSTRAINT validation_queue_student_id_fkey
        FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- documents_generes (flux QR / certificats — aligné insertDocumentGenere)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.documents_generes (
  id BIGSERIAL PRIMARY KEY,
  document_type_id INTEGER REFERENCES public.document_templates(id) ON DELETE SET NULL,
  etudiant_id INTEGER NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  fichier_url TEXT NOT NULL DEFAULT '',
  date_generation TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reference TEXT NOT NULL,
  type_document TEXT NOT NULL,
  verification_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT documents_generes_reference_unique UNIQUE (reference)
);

CREATE INDEX IF NOT EXISTS idx_documents_generes_etudiant ON public.documents_generes(etudiant_id);
CREATE INDEX IF NOT EXISTS idx_documents_generes_reference ON public.documents_generes(reference);

DROP TRIGGER IF EXISTS documents_generes_updated_at ON public.documents_generes;
CREATE OR REPLACE FUNCTION public.documents_generes_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER documents_generes_updated_at
  BEFORE UPDATE ON public.documents_generes
  FOR EACH ROW
  EXECUTE FUNCTION public.documents_generes_touch_updated_at();

ALTER TABLE public.documents_generes ENABLE ROW LEVEL SECURITY;

-- Vérification publique QR (anon) : lecture seule par référence
DROP POLICY IF EXISTS documents_generes_anon_select ON public.documents_generes;
CREATE POLICY documents_generes_anon_select ON public.documents_generes
  FOR SELECT TO anon
  USING (true);

DROP POLICY IF EXISTS documents_generes_auth_select ON public.documents_generes;
CREATE POLICY documents_generes_auth_select ON public.documents_generes
  FOR SELECT TO authenticated
  USING (
    public.check_is_admin()
    OR EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = documents_generes.etudiant_id AND s.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS documents_generes_auth_insert ON public.documents_generes;
CREATE POLICY documents_generes_auth_insert ON public.documents_generes
  FOR INSERT TO authenticated
  WITH CHECK (
    public.check_is_admin()
    OR EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = etudiant_id AND s.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS documents_generes_auth_update ON public.documents_generes;
CREATE POLICY documents_generes_auth_update ON public.documents_generes
  FOR UPDATE TO authenticated
  USING (public.check_is_admin())
  WITH CHECK (public.check_is_admin());

DROP POLICY IF EXISTS documents_generes_auth_delete ON public.documents_generes;
CREATE POLICY documents_generes_auth_delete ON public.documents_generes
  FOR DELETE TO authenticated
  USING (public.check_is_admin());

-- ---------------------------------------------------------------------------
-- Stages / emplois : RLS intranet (lecture connectée + candidatures étudiant)
-- ---------------------------------------------------------------------------
ALTER TABLE public.internship_offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can view published offers" ON public.internship_offers;
DROP POLICY IF EXISTS internship_offers_select_open ON public.internship_offers;
DROP POLICY IF EXISTS internship_offers_intranet_select ON public.internship_offers;
CREATE POLICY internship_offers_intranet_select ON public.internship_offers
  FOR SELECT TO authenticated
  USING (true);
DROP POLICY IF EXISTS internship_offers_admin_write ON public.internship_offers;
DROP POLICY IF EXISTS internship_offers_insert_staff ON public.internship_offers;
CREATE POLICY internship_offers_insert_staff ON public.internship_offers
  FOR INSERT TO authenticated
  WITH CHECK (
    public.check_is_admin()
    OR (
      EXISTS (SELECT 1 FROM public.professors pr WHERE pr.profile_id = auth.uid())
      AND posted_by = auth.uid()
    )
  );
DROP POLICY IF EXISTS internship_offers_admin_update ON public.internship_offers;
CREATE POLICY internship_offers_admin_update ON public.internship_offers
  FOR UPDATE TO authenticated
  USING (public.check_is_admin())
  WITH CHECK (public.check_is_admin());
DROP POLICY IF EXISTS internship_offers_admin_delete ON public.internship_offers;
CREATE POLICY internship_offers_admin_delete ON public.internship_offers
  FOR DELETE TO authenticated
  USING (public.check_is_admin());

ALTER TABLE public.job_offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can view published jobs" ON public.job_offers;
DROP POLICY IF EXISTS job_offers_select_open ON public.job_offers;
DROP POLICY IF EXISTS job_offers_intranet_select ON public.job_offers;
CREATE POLICY job_offers_intranet_select ON public.job_offers
  FOR SELECT TO authenticated
  USING (true);
DROP POLICY IF EXISTS job_offers_admin_write ON public.job_offers;
DROP POLICY IF EXISTS job_offers_insert_staff ON public.job_offers;
CREATE POLICY job_offers_insert_staff ON public.job_offers
  FOR INSERT TO authenticated
  WITH CHECK (
    public.check_is_admin()
    OR (
      EXISTS (SELECT 1 FROM public.professors pr WHERE pr.profile_id = auth.uid())
      AND posted_by = auth.uid()
    )
  );
DROP POLICY IF EXISTS job_offers_admin_update ON public.job_offers;
CREATE POLICY job_offers_admin_update ON public.job_offers
  FOR UPDATE TO authenticated
  USING (public.check_is_admin())
  WITH CHECK (public.check_is_admin());
DROP POLICY IF EXISTS job_offers_admin_delete ON public.job_offers;
CREATE POLICY job_offers_admin_delete ON public.job_offers
  FOR DELETE TO authenticated
  USING (public.check_is_admin());

ALTER TABLE public.internship_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS internship_apps_student_select ON public.internship_applications;
CREATE POLICY internship_apps_student_select ON public.internship_applications
  FOR SELECT TO authenticated
  USING (
    public.check_is_admin()
    OR EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = internship_applications.student_id AND s.profile_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS internship_apps_student_insert ON public.internship_applications;
CREATE POLICY internship_apps_student_insert ON public.internship_applications
  FOR INSERT TO authenticated
  WITH CHECK (
    public.check_is_admin()
    OR EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = student_id AND s.profile_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS internship_apps_admin_mutate ON public.internship_applications;
CREATE POLICY internship_apps_admin_mutate ON public.internship_applications
  FOR UPDATE TO authenticated
  USING (public.check_is_admin())
  WITH CHECK (public.check_is_admin());
DROP POLICY IF EXISTS internship_apps_admin_delete ON public.internship_applications;
CREATE POLICY internship_apps_admin_delete ON public.internship_applications
  FOR DELETE TO authenticated
  USING (public.check_is_admin());

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS job_apps_student_select ON public.job_applications;
CREATE POLICY job_apps_student_select ON public.job_applications
  FOR SELECT TO authenticated
  USING (
    public.check_is_admin()
    OR EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = job_applications.student_id AND s.profile_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS job_apps_student_insert ON public.job_applications;
CREATE POLICY job_apps_student_insert ON public.job_applications
  FOR INSERT TO authenticated
  WITH CHECK (
    public.check_is_admin()
    OR EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = student_id AND s.profile_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS job_apps_admin_mutate ON public.job_applications;
CREATE POLICY job_apps_admin_mutate ON public.job_applications
  FOR UPDATE TO authenticated
  USING (public.check_is_admin())
  WITH CHECK (public.check_is_admin());
DROP POLICY IF EXISTS job_apps_admin_delete ON public.job_applications;
CREATE POLICY job_apps_admin_delete ON public.job_applications
  FOR DELETE TO authenticated
  USING (public.check_is_admin());
