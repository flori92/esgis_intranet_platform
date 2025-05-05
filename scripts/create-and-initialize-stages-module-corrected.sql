-- Script de création des tables et d'initialisation des données pour le module de gestion des stages
-- À exécuter avec la commande : PGPASSWORD="Apollonf@vi92" psql -h db.epnhnjkbxgciojevrwfq.supabase.co -p 5432 -U postgres -d postgres -f scripts/create-and-initialize-stages-module-corrected.sql

-- 1. Création des tables pour le module de gestion des stages

-- Table des entreprises
CREATE TABLE IF NOT EXISTS entreprises (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL UNIQUE,
    secteur VARCHAR(100),
    adresse TEXT,
    telephone VARCHAR(20),
    email VARCHAR(255),
    site_web VARCHAR(255),
    description TEXT,
    logo_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des offres de stage
CREATE TABLE IF NOT EXISTS stage_offres (
    id SERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    entreprise_id INTEGER REFERENCES entreprises(id),
    date_debut DATE,
    date_fin DATE,
    lieu VARCHAR(255),
    type_stage VARCHAR(50),
    competences_requises TEXT[],
    remuneration INTEGER,
    duree INTEGER,
    professeur_id INTEGER REFERENCES professors(id),
    date_publication TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    departement_id INTEGER REFERENCES departments(id),
    niveau_requis TEXT[],
    etat VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(titre, entreprise_id)
);

-- Table des candidatures aux stages
CREATE TABLE IF NOT EXISTS stage_candidatures (
    id SERIAL PRIMARY KEY,
    offre_id INTEGER REFERENCES stage_offres(id),
    etudiant_id INTEGER REFERENCES students(id),
    date_candidature TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    lettre_motivation TEXT,
    cv_path VARCHAR(255),
    statut VARCHAR(50) DEFAULT 'en_attente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(offre_id, etudiant_id)
);

-- Table des entretiens de stage
CREATE TABLE IF NOT EXISTS stage_entretiens (
    id SERIAL PRIMARY KEY,
    candidature_id INTEGER REFERENCES stage_candidatures(id),
    date_entretien TIMESTAMP WITH TIME ZONE,
    lieu VARCHAR(255),
    type_entretien VARCHAR(50),
    contact_entreprise VARCHAR(255),
    notes TEXT,
    resultat VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des actualités
CREATE TABLE IF NOT EXISTS news (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    author VARCHAR(255),
    image_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(title, published_at)
);

-- Table des emplois du temps
CREATE TABLE IF NOT EXISTS schedule (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    course_id INTEGER REFERENCES courses(id),
    day_of_week INTEGER NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(50),
    professor_id INTEGER REFERENCES professors(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, course_id, day_of_week)
);

-- 2. Initialisation des données de test

-- Ajout des entreprises
INSERT INTO entreprises (nom, secteur, adresse, telephone, email, site_web, description, logo_url)
VALUES 
  ('TechInnovate', 'Technologies', '15 rue de l''Innovation, 75001 Paris', '+33 1 23 45 67 89', 'contact@techinnovate.fr', 'https://techinnovate.fr', 'Entreprise spécialisée dans le développement de solutions innovantes', 'https://example.com/logos/techinnovate.png'),
  ('MobilFirst', 'Développement Mobile', '25 avenue des Applications, 69002 Lyon', '+33 4 56 78 90 12', 'contact@mobilfirst.fr', 'https://mobilfirst.fr', 'Agence de développement d''applications mobiles', 'https://example.com/logos/mobilfirst.png'),
  ('DataInsight', 'Analyse de données', '8 boulevard des Données, 33000 Bordeaux', '+33 5 67 89 01 23', 'contact@datainsight.fr', 'https://datainsight.fr', 'Entreprise spécialisée dans l''analyse et la visualisation de données', 'https://example.com/logos/datainsight.png')
ON CONFLICT (nom) DO NOTHING;

-- Récupération des IDs des entreprises pour les utiliser dans les offres de stage
DO $$
DECLARE
  tech_innovate_id INTEGER;
  mobil_first_id INTEGER;
  data_insight_id INTEGER;
  department_id INTEGER;
BEGIN
  -- Récupération des IDs des entreprises
  SELECT id INTO tech_innovate_id FROM entreprises WHERE nom = 'TechInnovate';
  SELECT id INTO mobil_first_id FROM entreprises WHERE nom = 'MobilFirst';
  SELECT id INTO data_insight_id FROM entreprises WHERE nom = 'DataInsight';
  
  -- Récupération d'un ID de département
  SELECT id INTO department_id FROM departments LIMIT 1;
  
  -- Ajout des offres de stage
  IF tech_innovate_id IS NOT NULL AND mobil_first_id IS NOT NULL AND data_insight_id IS NOT NULL AND department_id IS NOT NULL THEN
    INSERT INTO stage_offres (titre, description, entreprise_id, date_debut, date_fin, lieu, type_stage, competences_requises, remuneration, duree, professeur_id, date_publication, departement_id, niveau_requis, etat)
    VALUES 
      ('Stage développeur Full-Stack', 'Nous recherchons un développeur Full-Stack pour participer au développement de notre nouvelle plateforme web.', tech_innovate_id, '2025-06-01', '2025-08-31', 'Paris', 'temps_plein', ARRAY['JavaScript', 'React', 'Node.js', 'SQL'], 800, 12, NULL, NOW(), department_id, ARRAY['Bachelor 3', 'Master 1', 'Master 2'], 'active'),
      ('Stage développeur Mobile', 'Stage de développement d''applications mobiles sous Flutter.', mobil_first_id, '2025-07-01', '2025-09-30', 'Lyon', 'temps_plein', ARRAY['Flutter', 'Dart', 'Firebase', 'Git'], 700, 10, NULL, NOW(), department_id, ARRAY['Bachelor 3', 'Master 1'], 'active'),
      ('Stage Data Analyst', 'Stage d''analyse de données et création de tableaux de bord.', data_insight_id, '2025-09-01', '2026-02-28', 'Bordeaux', 'alternance', ARRAY['Python', 'SQL', 'Power BI', 'Excel'], 1000, 24, NULL, NOW(), department_id, ARRAY['Master 1', 'Master 2'], 'active')
    ON CONFLICT (titre, entreprise_id) DO NOTHING;
  ELSE
    RAISE NOTICE 'Impossible d''ajouter les offres de stage : données manquantes (entreprises ou département)';
  END IF;
END $$;

-- Ajout des actualités
INSERT INTO news (title, content, published_at, author, image_url)
VALUES 
  ('Lancement de la nouvelle plateforme ESGIS', 'Nous sommes heureux d''annoncer le lancement officiel de la nouvelle plateforme intranet ESGIS. Découvrez toutes les fonctionnalités dès aujourd''hui !', '2025-05-02', 'Direction ESGIS', 'https://cdn.esgis-intranet.com/news/launch.jpg'),
  ('Journée portes ouvertes', 'Rejoignez-nous pour la journée portes ouvertes le 15 mai 2025. Venez rencontrer les équipes pédagogiques et découvrir le campus !', '2025-05-05', 'Service Communication', 'https://cdn.esgis-intranet.com/news/open-day.jpg'),
  ('Conférence sur l''Intelligence Artificielle', 'Une conférence sur les dernières avancées en Intelligence Artificielle aura lieu le 20 mai 2025 à l''amphithéâtre principal.', '2025-05-10', 'Département Informatique', 'https://cdn.esgis-intranet.com/news/ai-conference.jpg')
ON CONFLICT (title, published_at) DO NOTHING;

-- Ajout des emplois du temps
DO $$
DECLARE
  student_id INTEGER;
  professor_id INTEGER;
  course_id1 INTEGER;
  course_id2 INTEGER;
  course_id3 INTEGER;
BEGIN
  -- Récupération d'un ID d'étudiant
  SELECT id INTO student_id FROM students LIMIT 1;
  
  -- Récupération d'un ID de professeur
  SELECT id INTO professor_id FROM professors LIMIT 1;
  
  -- Récupération des IDs de cours
  SELECT id INTO course_id1 FROM courses LIMIT 1;
  SELECT id INTO course_id2 FROM courses OFFSET 1 LIMIT 1;
  SELECT id INTO course_id3 FROM courses OFFSET 2 LIMIT 1;
  
  -- Ajout des emplois du temps
  IF student_id IS NOT NULL AND professor_id IS NOT NULL AND course_id1 IS NOT NULL THEN
    INSERT INTO schedule (student_id, course_id, day_of_week, start_time, end_time, room, professor_id)
    VALUES 
      (student_id, course_id1, 1, '09:00:00', '12:00:00', 'A101', professor_id),
      (student_id, course_id2, 2, '14:00:00', '17:00:00', 'B202', professor_id),
      (student_id, course_id3, 4, '10:00:00', '13:00:00', 'C303', professor_id)
    ON CONFLICT (student_id, course_id, day_of_week) DO NOTHING;
  ELSE
    RAISE NOTICE 'Impossible d''ajouter les emplois du temps : données manquantes (étudiants, professeurs ou cours)';
  END IF;
END $$;

-- Création de la fonction RPC pour récupérer les données du tableau de bord étudiant
CREATE OR REPLACE FUNCTION get_student_dashboard(student_id INTEGER)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH student_schedule AS (
    SELECT 
      s.id,
      s.day_of_week,
      s.start_time,
      s.end_time,
      s.room,
      c.name AS course_name,
      c.code AS course_code,
      p.first_name || ' ' || p.last_name AS professor_name
    FROM schedule s
    JOIN courses c ON s.course_id = c.id
    JOIN professors p ON s.professor_id = p.id
    WHERE s.student_id = student_id
  ),
  student_news AS (
    SELECT 
      n.id,
      n.title,
      n.content,
      n.published_at,
      n.author,
      n.image_url
    FROM news n
    ORDER BY n.published_at DESC
    LIMIT 5
  ),
  student_events AS (
    SELECT 
      e.id,
      e.title,
      e.description,
      e.start_time,
      e.end_time,
      e.location,
      e.type
    FROM events e
    ORDER BY e.start_time
    LIMIT 5
  )
  SELECT json_build_object(
    'schedule', COALESCE(json_agg(s), '[]'::json),
    'news', COALESCE((SELECT json_agg(n) FROM student_news n), '[]'::json),
    'events', COALESCE((SELECT json_agg(e) FROM student_events e), '[]'::json)
  ) INTO result
  FROM student_schedule s;
  
  RETURN COALESCE(result, json_build_object(
    'schedule', '[]'::json,
    'news', '[]'::json,
    'events', '[]'::json
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
