-- ESGIS Campus - Moodle / LMS bridge foundation
-- Supports Moodle web services and LTI-style interoperability without storing raw secrets in-table.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.external_lms_connectors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL,
  name TEXT NOT NULL,
  base_url TEXT,
  auth_type TEXT NOT NULL DEFAULT 'token',
  status TEXT NOT NULL DEFAULT 'active',
  capabilities JSONB NOT NULL DEFAULT '{}'::jsonb,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  secret_ref TEXT,
  last_sync_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_error TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT external_lms_connectors_provider_check
    CHECK (provider IN ('moodle', 'lti', 'scorm', 'h5p', 'custom')),
  CONSTRAINT external_lms_connectors_auth_type_check
    CHECK (auth_type IN ('token', 'oauth2', 'lti13', 'basic', 'none')),
  CONSTRAINT external_lms_connectors_status_check
    CHECK (status IN ('active', 'paused', 'error', 'disabled'))
);

CREATE TABLE IF NOT EXISTS public.external_lms_course_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connector_id UUID NOT NULL REFERENCES public.external_lms_connectors(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  external_course_id TEXT NOT NULL,
  external_course_shortname TEXT,
  external_category_id TEXT,
  sync_direction TEXT NOT NULL DEFAULT 'bidirectional',
  sync_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT external_lms_course_links_sync_direction_check
    CHECK (sync_direction IN ('pull', 'push', 'bidirectional')),
  CONSTRAINT external_lms_course_links_connector_course_key
    UNIQUE (connector_id, course_id),
  CONSTRAINT external_lms_course_links_connector_external_course_key
    UNIQUE (connector_id, external_course_id)
);

CREATE TABLE IF NOT EXISTS public.external_lms_user_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connector_id UUID NOT NULL REFERENCES public.external_lms_connectors(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  external_user_id TEXT NOT NULL,
  external_username TEXT,
  external_email TEXT,
  external_role TEXT,
  sync_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT external_lms_user_links_connector_profile_key
    UNIQUE (connector_id, profile_id),
  CONSTRAINT external_lms_user_links_connector_external_user_key
    UNIQUE (connector_id, external_user_id)
);

CREATE TABLE IF NOT EXISTS public.external_lms_activity_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connector_id UUID NOT NULL REFERENCES public.external_lms_connectors(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES public.courses(id) ON DELETE CASCADE,
  internal_entity_type TEXT NOT NULL,
  internal_entity_id TEXT NOT NULL,
  external_activity_id TEXT NOT NULL,
  external_activity_type TEXT NOT NULL DEFAULT 'other',
  sync_direction TEXT NOT NULL DEFAULT 'bidirectional',
  sync_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT external_lms_activity_links_entity_type_check
    CHECK (internal_entity_type IN ('assignment', 'resource', 'forum', 'quiz', 'exam', 'grade_item', 'course', 'other')),
  CONSTRAINT external_lms_activity_links_activity_type_check
    CHECK (external_activity_type IN ('assignment', 'quiz', 'resource', 'forum', 'h5p', 'scorm', 'grade_item', 'other')),
  CONSTRAINT external_lms_activity_links_sync_direction_check
    CHECK (sync_direction IN ('pull', 'push', 'bidirectional')),
  CONSTRAINT external_lms_activity_links_connector_activity_key
    UNIQUE (connector_id, external_activity_id),
  CONSTRAINT external_lms_activity_links_connector_internal_key
    UNIQUE (connector_id, internal_entity_type, internal_entity_id)
);

CREATE TABLE IF NOT EXISTS public.external_lms_grade_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connector_id UUID NOT NULL REFERENCES public.external_lms_connectors(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES public.courses(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES public.course_assignments(id) ON DELETE SET NULL,
  grade_id UUID REFERENCES public.grades(id) ON DELETE SET NULL,
  external_grade_item_id TEXT NOT NULL,
  external_activity_id TEXT,
  sync_direction TEXT NOT NULL DEFAULT 'bidirectional',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT external_lms_grade_links_sync_direction_check
    CHECK (sync_direction IN ('pull', 'push', 'bidirectional')),
  CONSTRAINT external_lms_grade_links_connector_grade_item_key
    UNIQUE (connector_id, external_grade_item_id)
);

CREATE TABLE IF NOT EXISTS public.external_lms_sync_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connector_id UUID NOT NULL REFERENCES public.external_lms_connectors(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'bidirectional',
  status TEXT NOT NULL DEFAULT 'queued',
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  counters JSONB NOT NULL DEFAULT '{}'::jsonb,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  initiated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT external_lms_sync_runs_sync_type_check
    CHECK (sync_type IN ('users', 'courses', 'activities', 'grades', 'enrolments', 'full')),
  CONSTRAINT external_lms_sync_runs_direction_check
    CHECK (direction IN ('pull', 'push', 'bidirectional')),
  CONSTRAINT external_lms_sync_runs_status_check
    CHECK (status IN ('queued', 'running', 'completed', 'failed', 'partial'))
);

CREATE INDEX IF NOT EXISTS idx_external_lms_connectors_provider
  ON public.external_lms_connectors(provider);

CREATE INDEX IF NOT EXISTS idx_external_lms_course_links_course
  ON public.external_lms_course_links(course_id);

CREATE INDEX IF NOT EXISTS idx_external_lms_user_links_profile
  ON public.external_lms_user_links(profile_id);

CREATE INDEX IF NOT EXISTS idx_external_lms_activity_links_course
  ON public.external_lms_activity_links(course_id);

CREATE INDEX IF NOT EXISTS idx_external_lms_activity_links_internal
  ON public.external_lms_activity_links(internal_entity_type, internal_entity_id);

CREATE INDEX IF NOT EXISTS idx_external_lms_grade_links_course
  ON public.external_lms_grade_links(course_id);

CREATE INDEX IF NOT EXISTS idx_external_lms_sync_runs_connector
  ON public.external_lms_sync_runs(connector_id, status, created_at DESC);

DROP TRIGGER IF EXISTS external_lms_connectors_updated_at ON public.external_lms_connectors;
CREATE TRIGGER external_lms_connectors_updated_at
BEFORE UPDATE ON public.external_lms_connectors
FOR EACH ROW
EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS external_lms_course_links_updated_at ON public.external_lms_course_links;
CREATE TRIGGER external_lms_course_links_updated_at
BEFORE UPDATE ON public.external_lms_course_links
FOR EACH ROW
EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS external_lms_user_links_updated_at ON public.external_lms_user_links;
CREATE TRIGGER external_lms_user_links_updated_at
BEFORE UPDATE ON public.external_lms_user_links
FOR EACH ROW
EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS external_lms_activity_links_updated_at ON public.external_lms_activity_links;
CREATE TRIGGER external_lms_activity_links_updated_at
BEFORE UPDATE ON public.external_lms_activity_links
FOR EACH ROW
EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS external_lms_grade_links_updated_at ON public.external_lms_grade_links;
CREATE TRIGGER external_lms_grade_links_updated_at
BEFORE UPDATE ON public.external_lms_grade_links
FOR EACH ROW
EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS external_lms_sync_runs_updated_at ON public.external_lms_sync_runs;
CREATE TRIGGER external_lms_sync_runs_updated_at
BEFORE UPDATE ON public.external_lms_sync_runs
FOR EACH ROW
EXECUTE FUNCTION public.update_timestamp();

ALTER TABLE public.external_lms_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_lms_course_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_lms_user_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_lms_activity_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_lms_grade_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_lms_sync_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS external_lms_connectors_admin_all ON public.external_lms_connectors;
CREATE POLICY external_lms_connectors_admin_all
ON public.external_lms_connectors
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS external_lms_connectors_professor_select ON public.external_lms_connectors;
CREATE POLICY external_lms_connectors_professor_select
ON public.external_lms_connectors
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.external_lms_course_links cl
    JOIN public.professor_courses pc ON pc.course_id = cl.course_id
    WHERE cl.connector_id = external_lms_connectors.id
      AND pc.professor_id = auth.uid()
  )
);

DROP POLICY IF EXISTS external_lms_course_links_admin_all ON public.external_lms_course_links;
CREATE POLICY external_lms_course_links_admin_all
ON public.external_lms_course_links
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS external_lms_course_links_professor_select ON public.external_lms_course_links;
CREATE POLICY external_lms_course_links_professor_select
ON public.external_lms_course_links
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.professor_courses pc
    WHERE pc.course_id = external_lms_course_links.course_id
      AND pc.professor_id = auth.uid()
  )
);

DROP POLICY IF EXISTS external_lms_user_links_admin_all ON public.external_lms_user_links;
CREATE POLICY external_lms_user_links_admin_all
ON public.external_lms_user_links
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS external_lms_activity_links_admin_all ON public.external_lms_activity_links;
CREATE POLICY external_lms_activity_links_admin_all
ON public.external_lms_activity_links
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS external_lms_activity_links_professor_select ON public.external_lms_activity_links;
CREATE POLICY external_lms_activity_links_professor_select
ON public.external_lms_activity_links
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.professor_courses pc
    WHERE pc.course_id = external_lms_activity_links.course_id
      AND pc.professor_id = auth.uid()
  )
);

DROP POLICY IF EXISTS external_lms_grade_links_admin_all ON public.external_lms_grade_links;
CREATE POLICY external_lms_grade_links_admin_all
ON public.external_lms_grade_links
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS external_lms_grade_links_professor_select ON public.external_lms_grade_links;
CREATE POLICY external_lms_grade_links_professor_select
ON public.external_lms_grade_links
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.professor_courses pc
    WHERE pc.course_id = external_lms_grade_links.course_id
      AND pc.professor_id = auth.uid()
  )
);

DROP POLICY IF EXISTS external_lms_sync_runs_admin_all ON public.external_lms_sync_runs;
CREATE POLICY external_lms_sync_runs_admin_all
ON public.external_lms_sync_runs
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS external_lms_sync_runs_professor_select ON public.external_lms_sync_runs;
CREATE POLICY external_lms_sync_runs_professor_select
ON public.external_lms_sync_runs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.external_lms_course_links cl
    JOIN public.professor_courses pc ON pc.course_id = cl.course_id
    WHERE cl.connector_id = external_lms_sync_runs.connector_id
      AND pc.professor_id = auth.uid()
  )
);
