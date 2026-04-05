-- Migration pour ajouter les tables d'actualités et d'événements
-- Date: 2025-05-04

-- Table des actualités
CREATE TABLE IF NOT EXISTS "news" (
    "id" SERIAL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image_url" TEXT,
    "date" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "link" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des événements
CREATE TABLE IF NOT EXISTS "events" (
    "id" SERIAL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "start_date" TIMESTAMPTZ NOT NULL,
    "end_date" TIMESTAMPTZ,
    "location" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ajouter des actualités de test
INSERT INTO "news" ("title", "description", "image_url", "date", "link") VALUES
(
    'Journée portes ouvertes ESGIS 2025',
    'L''ESGIS organise sa journée portes ouvertes annuelle le 15 mai 2025. Venez découvrir nos formations et rencontrer nos enseignants.',
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=800&auto=format&fit=crop',
    '2025-05-01T08:00:00Z',
    '/actualites/portes-ouvertes-2025'
),
(
    'Lancement du nouveau diplôme Intelligence Artificielle & Data Science',
    'L''ESGIS est fière d''annoncer le lancement de son nouveau diplôme spécialisé en Intelligence Artificielle et Data Science dès la rentrée 2025.',
    'https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=800&auto=format&fit=crop',
    '2025-04-22T14:30:00Z',
    '/actualites/nouveau-diplome-ia-data-science'
),
(
    'Résultats du hackathon ESGIS Innovation Challenge',
    'Félicitations à l''équipe CodeMasters qui a remporté la première place du hackathon ESGIS Innovation Challenge avec leur projet de plateforme d''apprentissage adaptatif.',
    'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=800&auto=format&fit=crop',
    '2025-04-15T18:00:00Z',
    '/actualites/resultats-hackathon-2025'
),
(
    'Conférence sur la cybersécurité avec des experts internationaux',
    'Le département informatique de l''ESGIS organise une conférence exceptionnelle sur les enjeux actuels de la cybersécurité avec la participation d''experts internationaux.',
    'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=800&auto=format&fit=crop',
    '2025-04-10T10:15:00Z',
    '/actualites/conference-cybersecurite'
);

-- Ajouter des événements de test
INSERT INTO "events" ("title", "description", "start_date", "end_date", "location") VALUES
(
    'Atelier CV et recherche de stage',
    'Atelier pratique sur la rédaction de CV et les techniques de recherche de stage efficaces. Animé par le service carrière de l''ESGIS.',
    '2025-05-10T14:00:00Z',
    '2025-05-10T17:00:00Z',
    'Salle A305 - Campus Principal'
),
(
    'Séminaire Intelligence Artificielle',
    'Présentation des dernières avancées en intelligence artificielle et démonstration de projets étudiants.',
    '2025-05-15T09:30:00Z',
    '2025-05-15T16:00:00Z',
    'Amphithéâtre Mendès France'
),
(
    'Soirée d''intégration promotion 2025',
    'Soirée festive d''accueil des nouveaux étudiants de la promotion 2025. Venez faire connaissance avec vos camarades de promotion!',
    '2025-05-18T19:00:00Z',
    '2025-05-18T23:00:00Z',
    'Campus ESGIS - Espace Événementiel'
),
(
    'Forum entreprises ESGIS Connect',
    'Rencontrez les recruteurs de plus de 50 entreprises partenaires pour des opportunités de stage et d''emploi.',
    '2025-05-25T10:00:00Z',
    '2025-05-25T17:00:00Z',
    'Palais des Congrès'
),
(
    'Conférence Big Data & Cloud Computing',
    'Conférence sur l''évolution du Big Data et les technologies Cloud, animée par des professionnels du secteur.',
    '2025-06-05T13:30:00Z',
    '2025-06-05T18:00:00Z',
    'Amphithéâtre Pascal'
);
