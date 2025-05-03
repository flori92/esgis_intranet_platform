// Données mockées pour l'application
// Actualités, événements et autres données de test
// Créé le: 2025-05-04

export interface NewsItem {
  id: number;
  title: string;
  description: string;
  image_url?: string;
  date: string;
  link?: string;
}

export interface EventItem {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date?: string;
  location?: string;
}

// Actualités mockées
export const mockNews: NewsItem[] = [
  {
    id: 1,
    title: 'Journée portes ouvertes ESGIS 2025',
    description: 'L\'ESGIS organise sa journée portes ouvertes annuelle le 15 mai 2025. Venez découvrir nos formations et rencontrer nos enseignants.',
    image_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=800&auto=format&fit=crop',
    date: '2025-05-01T08:00:00Z',
    link: '/actualites/portes-ouvertes-2025'
  },
  {
    id: 2,
    title: 'Lancement du nouveau diplôme Intelligence Artificielle & Data Science',
    description: 'L\'ESGIS est fière d\'annoncer le lancement de son nouveau diplôme spécialisé en Intelligence Artificielle et Data Science dès la rentrée 2025.',
    image_url: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=800&auto=format&fit=crop',
    date: '2025-04-22T14:30:00Z',
    link: '/actualites/nouveau-diplome-ia-data-science'
  },
  {
    id: 3,
    title: 'Résultats du hackathon ESGIS Innovation Challenge',
    description: 'Félicitations à l\'équipe CodeMasters qui a remporté la première place du hackathon ESGIS Innovation Challenge avec leur projet de plateforme d\'apprentissage adaptatif.',
    image_url: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=800&auto=format&fit=crop',
    date: '2025-04-15T18:00:00Z',
    link: '/actualites/resultats-hackathon-2025'
  },
  {
    id: 4,
    title: 'Conférence sur la cybersécurité avec des experts internationaux',
    description: 'Le département informatique de l\'ESGIS organise une conférence exceptionnelle sur les enjeux actuels de la cybersécurité avec la participation d\'experts internationaux.',
    image_url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=800&auto=format&fit=crop',
    date: '2025-04-10T10:15:00Z',
    link: '/actualites/conference-cybersecurite'
  }
];

// Événements mockés
export const mockEvents: EventItem[] = [
  {
    id: 1,
    title: 'Atelier CV et recherche de stage',
    description: 'Atelier pratique sur la rédaction de CV et les techniques de recherche de stage efficaces. Animé par le service carrière de l\'ESGIS.',
    start_date: '2025-05-10T14:00:00Z',
    end_date: '2025-05-10T17:00:00Z',
    location: 'Salle A305 - Campus Principal'
  },
  {
    id: 2,
    title: 'Séminaire Intelligence Artificielle',
    description: 'Présentation des dernières avancées en intelligence artificielle et démonstration de projets étudiants.',
    start_date: '2025-05-15T09:30:00Z',
    end_date: '2025-05-15T16:00:00Z',
    location: 'Amphithéâtre Mendès France'
  },
  {
    id: 3,
    title: 'Soirée d\'intégration promotion 2025',
    description: 'Soirée festive d\'accueil des nouveaux étudiants de la promotion 2025. Venez faire connaissance avec vos camarades de promotion!',
    start_date: '2025-05-18T19:00:00Z',
    end_date: '2025-05-18T23:00:00Z',
    location: 'Campus ESGIS - Espace Événementiel'
  },
  {
    id: 4,
    title: 'Forum entreprises ESGIS Connect',
    description: 'Rencontrez les recruteurs de plus de 50 entreprises partenaires pour des opportunités de stage et d\'emploi.',
    start_date: '2025-05-25T10:00:00Z',
    end_date: '2025-05-25T17:00:00Z',
    location: 'Palais des Congrès'
  },
  {
    id: 5,
    title: 'Conférence Big Data & Cloud Computing',
    description: 'Conférence sur l\'évolution du Big Data et les technologies Cloud, animée par des professionnels du secteur.',
    start_date: '2025-06-05T13:30:00Z',
    end_date: '2025-06-05T18:00:00Z',
    location: 'Amphithéâtre Pascal'
  }
];

// Exemple de données d'emploi du temps mockées
export const mockSchedule = [
  {
    id: 1,
    course_name: 'Algorithmique Avancée',
    start_time: '2025-05-04T08:30:00Z',
    end_time: '2025-05-04T10:30:00Z',
    day_of_week: 1,
    room: 'B201',
    professor_name: 'Dr. Martin Dubois'
  },
  {
    id: 2,
    course_name: 'Développement Web Frontend',
    start_time: '2025-05-04T13:00:00Z',
    end_time: '2025-05-04T16:00:00Z',
    day_of_week: 1,
    room: 'Labo Info 3',
    professor_name: 'Mme. Sophie Laurent'
  },
  {
    id: 3,
    course_name: 'Base de Données Relationnelles',
    start_time: '2025-05-05T08:30:00Z',
    end_time: '2025-05-05T11:30:00Z',
    day_of_week: 2,
    room: 'A105',
    professor_name: 'Prof. Thomas Moreau'
  },
  {
    id: 4,
    course_name: 'Cybersécurité',
    start_time: '2025-05-05T13:30:00Z',
    end_time: '2025-05-05T16:30:00Z',
    day_of_week: 2,
    room: 'Amphi C',
    professor_name: 'Dr. Alexandre Petit'
  },
  {
    id: 5,
    course_name: 'Intelligence Artificielle',
    start_time: '2025-05-06T09:00:00Z',
    end_time: '2025-05-06T12:00:00Z',
    day_of_week: 3,
    room: 'B302',
    professor_name: 'Prof. Marie Leclerc'
  }
];

// Données mockées pour les notes récentes
export const mockGrades = [
  {
    id: 1,
    course_name: 'Architecture des Systèmes',
    value: 16.5,
    max_value: 20
  },
  {
    id: 2,
    course_name: 'Développement Mobile',
    value: 14,
    max_value: 20
  },
  {
    id: 3,
    course_name: 'Réseaux Informatiques',
    value: 12.5,
    max_value: 20
  },
  {
    id: 4,
    course_name: 'Programmation Orientée Objet',
    value: 18,
    max_value: 20
  }
];

// Prochain cours
export const mockNextCourse = {
  name: 'Intelligence Artificielle',
  time: '2025-05-06T09:00:00Z'
};
