-- Script d'initialisation des données de test pour le module de gestion des stages
-- À exécuter avec la commande : psql postgresql://postgres:Apollonf@vi92@db.epnhnjkbxgciojevrwfq.supabase.co:5432/postgres -f scripts/initialize-test-data.sql

-- 1. Ajout des entreprises
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
  
  -- 2. Ajout des offres de stage
  INSERT INTO stage_offres (titre, description, entreprise_id, date_debut, date_fin, lieu, type_stage, competences_requises, remuneration, duree, professeur_id, date_publication, departement_id, niveau_requis, etat)
  VALUES 
    ('Stage développeur Full-Stack', 'Nous recherchons un développeur Full-Stack pour participer au développement de notre nouvelle plateforme web.', tech_innovate_id, '2025-06-01', '2025-08-31', 'Paris', 'temps_plein', ARRAY['JavaScript', 'React', 'Node.js', 'SQL'], 800, 12, NULL, NOW(), department_id, ARRAY['Bachelor 3', 'Master 1', 'Master 2'], 'active'),
    ('Stage développeur Mobile', 'Stage de développement d''applications mobiles sous Flutter.', mobil_first_id, '2025-07-01', '2025-09-30', 'Lyon', 'temps_plein', ARRAY['Flutter', 'Dart', 'Firebase', 'Git'], 700, 10, NULL, NOW(), department_id, ARRAY['Bachelor 3', 'Master 1'], 'active'),
    ('Stage Data Analyst', 'Stage d''analyse de données et création de tableaux de bord.', data_insight_id, '2025-09-01', '2026-02-28', 'Bordeaux', 'alternance', ARRAY['Python', 'SQL', 'Power BI', 'Excel'], 1000, 24, NULL, NOW(), department_id, ARRAY['Master 1', 'Master 2'], 'active')
  ON CONFLICT (titre, entreprise_id) DO NOTHING;
END $$;

-- 3. Ajout des actualités
INSERT INTO news (title, content, published_at, author, image_url)
VALUES 
  ('Lancement de la nouvelle plateforme ESGIS', 'Nous sommes heureux d''annoncer le lancement officiel de la nouvelle plateforme intranet ESGIS. Découvrez toutes les fonctionnalités dès aujourd''hui !', '2025-05-02', 'Direction ESGIS', 'https://cdn.esgis-intranet.com/news/launch.jpg'),
  ('Journée portes ouvertes', 'Rejoignez-nous pour la journée portes ouvertes le 15 mai 2025. Venez rencontrer les équipes pédagogiques et découvrir le campus !', '2025-05-05', 'Service Communication', 'https://cdn.esgis-intranet.com/news/open-day.jpg'),
  ('Conférence sur l''Intelligence Artificielle', 'Une conférence sur les dernières avancées en Intelligence Artificielle aura lieu le 20 mai 2025 à l''amphithéâtre principal.', '2025-05-10', 'Département Informatique', 'https://cdn.esgis-intranet.com/news/ai-conference.jpg')
ON CONFLICT (title, published_at) DO NOTHING;

-- 4. Ajout des emplois du temps
DO $$
DECLARE
  student_id UUID;
  professor_id UUID;
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
      (student_id::text, course_id1, 1, '09:00:00', '12:00:00', 'A101', professor_id::text),
      (student_id::text, course_id2, 2, '14:00:00', '17:00:00', 'B202', professor_id::text),
      (student_id::text, course_id3, 4, '10:00:00', '13:00:00', 'C303', professor_id::text)
    ON CONFLICT (student_id, course_id, day_of_week) DO NOTHING;
  END IF;
END $$;
