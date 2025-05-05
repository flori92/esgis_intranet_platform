
-- Création de la table entreprises
CREATE TABLE IF NOT EXISTS entreprises (
  id BIGSERIAL PRIMARY KEY,
  nom TEXT NOT NULL,
  secteur TEXT NOT NULL,
  adresse TEXT,
  telephone TEXT,
  email TEXT,
  site_web TEXT,
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création de la table schedule (emploi du temps)
CREATE TABLE IF NOT EXISTS schedule (
  id BIGSERIAL PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  professor_id UUID REFERENCES professors(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création de la table news (actualités)
CREATE TABLE IF NOT EXISTS news (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  author TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création de la table stage_offres
CREATE TABLE IF NOT EXISTS stage_offres (
  id BIGSERIAL PRIMARY KEY,
  titre TEXT NOT NULL,
  description TEXT NOT NULL,
  entreprise_id BIGINT NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  date_debut TIMESTAMP WITH TIME ZONE NOT NULL,
  date_fin TIMESTAMP WITH TIME ZONE NOT NULL,
  lieu TEXT NOT NULL,
  type_stage TEXT NOT NULL,
  competences_requises TEXT[] NOT NULL,
  remuneration DECIMAL(10, 2),
  duree INTEGER NOT NULL,
  professeur_id UUID REFERENCES professors(id) ON DELETE SET NULL,
  date_publication TIMESTAMP WITH TIME ZONE NOT NULL,
  departement_id BIGINT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  niveau_requis TEXT[] NOT NULL,
  etat TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création de la table stage_candidatures
CREATE TABLE IF NOT EXISTS stage_candidatures (
  id BIGSERIAL PRIMARY KEY,
  offre_id BIGINT NOT NULL REFERENCES stage_offres(id) ON DELETE CASCADE,
  etudiant_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date_candidature TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  lettre_motivation TEXT NOT NULL,
  cv_path TEXT NOT NULL,
  commentaires TEXT,
  note_entretien DECIMAL(3, 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création de la table stage_entretiens
CREATE TABLE IF NOT EXISTS stage_entretiens (
  id BIGSERIAL PRIMARY KEY,
  candidature_id BIGINT NOT NULL REFERENCES stage_candidatures(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  lieu TEXT NOT NULL,
  type TEXT NOT NULL,
  lien_visio TEXT,
  contact TEXT,
  duree INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création de la fonction RPC get_student_dashboard
CREATE OR REPLACE FUNCTION get_student_dashboard(student_id UUID)
RETURNS JSON AS $$
DECLARE
  dashboard_data JSON;
BEGIN
  WITH schedule_data AS (
    SELECT json_agg(
      json_build_object(
        'id', s.id,
        'student_id', s.student_id,
        'course_id', s.course_id,
        'day_of_week', s.day_of_week,
        'start_time', s.start_time,
        'end_time', s.end_time,
        'room', s.room,
        'professor_id', s.professor_id,
        'created_at', s.created_at,
        'updated_at', s.updated_at,
        'course', (
          SELECT json_build_object(
            'id', c.id,
            'name', c.name,
            'code', c.code,
            'description', c.description,
            'credits', c.credits,
            'department_id', c.department_id
          )
          FROM courses c
          WHERE c.id = s.course_id
        ),
        'professor', (
          SELECT json_build_object(
            'id', p.id,
            'first_name', p.first_name,
            'last_name', p.last_name,
            'email', p.email
          )
          FROM professors p
          WHERE p.id = s.professor_id
        )
      )
    ) AS schedule
    FROM schedule s
    WHERE s.student_id = $1
  ),
  news_data AS (
    SELECT json_agg(
      json_build_object(
        'id', n.id,
        'title', n.title,
        'content', n.content,
        'published_at', n.published_at,
        'author', n.author,
        'image_url', n.image_url,
        'created_at', n.created_at,
        'updated_at', n.updated_at
      )
    ) AS news
    FROM news n
    ORDER BY n.published_at DESC
    LIMIT 5
  ),
  events_data AS (
    SELECT json_agg(
      json_build_object(
        'id', e.id,
        'title', e.title,
        'description', e.description,
        'start_date', e.start_date,
        'end_date', e.end_date,
        'location', e.location,
        'event_type', e.event_type,
        'organizer', e.organizer,
        'department_id', e.department_id,
        'is_public', e.is_public,
        'created_at', e.created_at,
        'updated_at', e.updated_at,
        'department', (
          SELECT json_build_object(
            'id', d.id,
            'name', d.name,
            'code', d.code
          )
          FROM departments d
          WHERE d.id = e.department_id
        )
      )
    ) AS events
    FROM events e
    WHERE e.is_public = true OR e.department_id IN (
      SELECT c.department_id
      FROM student_courses sc
      JOIN courses c ON sc.course_id = c.id
      WHERE sc.student_id = $1
    )
    ORDER BY e.start_date
    LIMIT 10
  )
  
  SELECT json_build_object(
    'schedule', COALESCE((SELECT schedule FROM schedule_data), '[]'::json),
    'news', COALESCE((SELECT news FROM news_data), '[]'::json),
    'events', COALESCE((SELECT events FROM events_data), '[]'::json)
  ) INTO dashboard_data;
  
  RETURN dashboard_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attribution des droits d'exécution
GRANT EXECUTE ON FUNCTION get_student_dashboard(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_dashboard(UUID) TO service_role;

-- Ajout de déclencheurs pour mettre à jour automatiquement le champ updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Création des déclencheurs pour chaque table
CREATE TRIGGER update_entreprises_updated_at
BEFORE UPDATE ON entreprises
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedule_updated_at
BEFORE UPDATE ON schedule
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_news_updated_at
BEFORE UPDATE ON news
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stage_offres_updated_at
BEFORE UPDATE ON stage_offres
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stage_candidatures_updated_at
BEFORE UPDATE ON stage_candidatures
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stage_entretiens_updated_at
BEFORE UPDATE ON stage_entretiens
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();