
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
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  professor_id INTEGER REFERENCES professors(id) ON DELETE SET NULL,
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
  professeur_id INTEGER REFERENCES professors(id) ON DELETE SET NULL,
  date_publication TIMESTAMP WITH TIME ZONE NOT NULL,
  departement_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  niveau_requis TEXT[] NOT NULL,
  etat TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création de la table stage_candidatures
CREATE TABLE IF NOT EXISTS stage_candidatures (
  id BIGSERIAL PRIMARY KEY,
  offre_id BIGINT NOT NULL REFERENCES stage_offres(id) ON DELETE CASCADE,
  etudiant_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
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
CREATE OR REPLACE FUNCTION get_student_dashboard(student_id INTEGER)
RETURNS JSON AS $$
DECLARE
  dashboard_data JSON;
BEGIN
  SELECT json_build_object(
    'schedule',
    COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', item.id,
          'student_id', item.student_id,
          'course_id', item.course_id,
          'day_of_week', item.day_of_week,
          'start_time', item.start_time,
          'end_time', item.end_time,
          'room', item.room,
          'professor_id', item.professor_id,
          'created_at', item.created_at,
          'updated_at', item.updated_at,
          'course', item.course,
          'professor', item.professor
        )
      )
      FROM (
        SELECT
          s.*,
          (
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
          ) AS course,
          (
            SELECT json_build_object(
              'id', p.id,
              'full_name', pr.full_name,
              'email', pr.email
            )
            FROM professors p
            LEFT JOIN profiles pr ON pr.id = p.profile_id
            WHERE p.id = s.professor_id
          ) AS professor
        FROM schedule s
        WHERE s.student_id = $1
        ORDER BY s.day_of_week, s.start_time
        LIMIT 10
      ) AS item
    ), '[]'::json),
    'news',
    COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', item.id,
          'title', item.title,
          'content', item.content,
          'published_at', item.published_at,
          'author', item.author,
          'image_url', item.image_url,
          'created_at', item.created_at,
          'updated_at', item.updated_at
        )
      )
      FROM (
        SELECT *
        FROM news
        ORDER BY published_at DESC
        LIMIT 5
      ) AS item
    ), '[]'::json),
    'events',
    COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', item.id,
          'title', item.title,
          'description', item.description,
          'start_date', item.start_date,
          'end_date', item.end_date,
          'location', item.location,
          'type', item.type,
          'created_by', item.created_by,
          'created_at', item.created_at,
          'updated_at', item.updated_at
        )
      )
      FROM (
        SELECT *
        FROM events
        ORDER BY start_date
        LIMIT 10
      ) AS item
    ), '[]'::json)
  ) INTO dashboard_data;
  
  RETURN dashboard_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attribution des droits d'exécution
GRANT EXECUTE ON FUNCTION get_student_dashboard(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_dashboard(INTEGER) TO service_role;

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
