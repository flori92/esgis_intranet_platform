/**
 * Utilitaire pour initialiser des données fictives pour les tests et le développement
 */

/**
 * Initialise les données fictives pour les tests
 * @returns {Object} Données fictives initialisées
 */
export const initializeMockData = () => {
  return {
    dashboardData: {
      next_course: { 
        name: 'Développement Web Frontend', 
        time: '2025-05-04T13:00:00Z',
        room: 'Labo Info 3',
        professor: 'Mme. Sophie Laurent'
      },
      recent_grades: [
        { id: 1, course_name: 'Algorithmique Avancée', value: 16, max_value: 20 },
        { id: 2, course_name: 'Programmation Orientée Objet', value: 14, max_value: 20 },
        { id: 3, course_name: 'Base de Données Relationnelles', value: 18, max_value: 20 }
      ]
    }
  };
};

/**
 * Données fictives pour les actualités
 */
export const mockNews = [
  {
    id: 1,
    title: 'Nouvelle plateforme pédagogique',
    content: 'L\'école lance sa nouvelle plateforme pédagogique pour améliorer l\'expérience d\'apprentissage des étudiants.',
    published_at: '2025-05-01T10:00:00Z',
    author: 'Direction des Études',
    image_url: 'https://picsum.photos/seed/news1/800/400'
  },
  {
    id: 2,
    title: 'Conférence sur l\'Intelligence Artificielle',
    content: 'Une conférence sur les dernières avancées en Intelligence Artificielle aura lieu le 15 mai 2025.',
    published_at: '2025-04-28T14:30:00Z',
    author: 'Département Informatique',
    image_url: 'https://picsum.photos/seed/news2/800/400'
  },
  {
    id: 3,
    title: 'Résultats du hackathon étudiant',
    content: 'Les résultats du hackathon étudiant sont disponibles. Félicitations à l\'équipe CodeMasters pour sa victoire !',
    published_at: '2025-04-25T09:15:00Z',
    author: 'Bureau des Étudiants',
    image_url: 'https://picsum.photos/seed/news3/800/400'
  }
];

/**
 * Données fictives pour les événements
 */
export const mockEvents = [
  {
    id: 1,
    title: 'Examen de Programmation Web',
    description: 'Examen final du module de Programmation Web',
    start_date: '2025-05-10T09:00:00Z',
    end_date: '2025-05-10T12:00:00Z',
    location: 'Amphithéâtre A',
    type: 'exam'
  },
  {
    id: 2,
    title: 'Conférence Cloud Computing',
    description: 'Conférence sur les technologies cloud par des experts du domaine',
    start_date: '2025-05-15T14:00:00Z',
    end_date: '2025-05-15T17:00:00Z',
    location: 'Amphithéâtre B',
    type: 'conference'
  },
  {
    id: 3,
    title: 'Atelier CV et Recherche de Stage',
    description: 'Atelier pratique pour améliorer votre CV et vos techniques de recherche de stage',
    start_date: '2025-05-20T10:00:00Z',
    end_date: '2025-05-20T12:00:00Z',
    location: 'Salle C103',
    type: 'workshop'
  },
  {
    id: 4,
    title: 'Journée Portes Ouvertes',
    description: 'Journée portes ouvertes de l\'école pour les futurs étudiants',
    start_date: '2025-05-25T09:00:00Z',
    end_date: '2025-05-25T18:00:00Z',
    location: 'Campus principal',
    type: 'general'
  }
];

export default {
  initializeMockData,
  mockNews,
  mockEvents
};
