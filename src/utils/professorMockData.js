/**
 * Données fictives pour le tableau de bord du professeur
 */

/**
 * Données fictives pour les cours du professeur
 */
export const mockProfessorCourses = [
  {
    id: 1,
    name: 'Développement Web Frontend',
    code: 'INFO-345',
    department: 'Informatique',
    level: 'L3',
    semester: 1,
    credits: 4,
    students_count: 45,
    next_session: '2025-05-07T13:00:00Z',
    room: 'Labo Info 3'
  },
  {
    id: 2,
    name: 'Algorithmique Avancée',
    code: 'INFO-221',
    department: 'Informatique',
    level: 'L2',
    semester: 1,
    credits: 3,
    students_count: 60,
    next_session: '2025-05-08T08:30:00Z',
    room: 'B201'
  },
  {
    id: 3,
    name: 'Base de Données Relationnelles',
    code: 'INFO-234',
    department: 'Informatique',
    level: 'L2',
    semester: 2,
    credits: 4,
    students_count: 55,
    next_session: '2025-05-09T10:00:00Z',
    room: 'A105'
  }
];

/**
 * Données fictives pour les examens du professeur
 */
export const mockProfessorExams = [
  {
    id: 1,
    course_name: 'Développement Web Frontend',
    title: 'Examen final',
    date: '2025-05-20T09:00:00Z',
    duration: 180,
    room: 'Amphithéâtre A',
    students_count: 45
  },
  {
    id: 2,
    course_name: 'Algorithmique Avancée',
    title: 'Examen mi-semestre',
    date: '2025-05-10T08:30:00Z',
    duration: 120,
    room: 'B201',
    students_count: 60
  }
];

/**
 * Données fictives pour les notes en attente
 */
export const mockPendingGrades = [
  {
    id: 1,
    course_name: 'Développement Web Frontend',
    evaluation_type: 'Projet',
    title: 'Projet de site web responsive',
    due_date: '2025-05-15T23:59:59Z',
    submissions_count: 40,
    graded_count: 15,
    total_students: 45
  },
  {
    id: 2,
    course_name: 'Algorithmique Avancée',
    evaluation_type: 'Examen',
    title: 'Examen mi-semestre',
    due_date: '2025-05-10T23:59:59Z',
    submissions_count: 58,
    graded_count: 0,
    total_students: 60
  },
  {
    id: 3,
    course_name: 'Base de Données Relationnelles',
    evaluation_type: 'TP',
    title: 'TP3 - Requêtes complexes',
    due_date: '2025-05-12T23:59:59Z',
    submissions_count: 50,
    graded_count: 30,
    total_students: 55
  }
];

/**
 * Données fictives pour les actualités du professeur
 */
export const mockProfessorNews = [
  {
    id: 1,
    title: 'Nouvelle plateforme pédagogique',
    content: 'L\'école lance sa nouvelle plateforme pédagogique pour améliorer l\'expérience d\'apprentissage.',
    date: '2025-05-01T10:00:00Z',
    category: 'information'
  },
  {
    id: 2,
    title: 'Réunion pédagogique',
    content: 'Une réunion pédagogique aura lieu le 10 mai à 14h en salle des professeurs.',
    date: '2025-04-28T14:30:00Z',
    category: 'important'
  },
  {
    id: 3,
    title: 'Calendrier des examens',
    content: 'Le calendrier des examens finaux est maintenant disponible dans l\'espace professeur.',
    date: '2025-04-25T09:15:00Z',
    category: 'information'
  }
];

/**
 * Données fictives pour les événements du professeur
 */
export const mockProfessorEvents = [
  {
    id: 1,
    title: 'Réunion de département',
    date: '2025-05-08T14:00:00Z',
    location: 'Salle des professeurs',
    type: 'reunion'
  },
  {
    id: 2,
    title: 'Surveillance d\'examen',
    date: '2025-05-12T08:00:00Z',
    location: 'Amphithéâtre A',
    type: 'administratif'
  },
  {
    id: 3,
    title: 'Formation sur les nouvelles technologies',
    date: '2025-05-15T13:00:00Z',
    location: 'Salle B103',
    type: 'formation'
  },
  {
    id: 4,
    title: 'Permanence étudiants',
    date: '2025-05-09T10:00:00Z',
    location: 'Bureau 204',
    type: 'autre'
  }
];

/**
 * Données fictives pour les statistiques du professeur
 */
export const mockProfessorStats = {
  total_courses: 3,
  total_students: 160,
  average_grade: 14.2,
  submissions_to_grade: 103,
  upcoming_events: 4
};

/**
 * Formater la date pour l'affichage
 * @param {string} dateString - Chaîne de date à formater
 * @returns {string} Date formatée
 */
export const formatDate = (dateString) => {
  try {
    return format(new Date(dateString), 'dd MMMM yyyy', { locale: fr });
  } catch (error) {
    console.error('Erreur de formatage de date:', error);
    return dateString;
  }
};

/**
 * Formater l'heure pour l'affichage
 * @param {string} dateString - Chaîne de date à formater
 * @returns {string} Heure formatée
 */
export const formatTime = (dateString) => {
  try {
    return format(new Date(dateString), 'HH:mm', { locale: fr });
  } catch (error) {
    console.error('Erreur de formatage d\'heure:', error);
    return '';
  }
};

export default {
  mockProfessorCourses,
  mockProfessorExams,
  mockPendingGrades,
  mockProfessorNews,
  mockProfessorEvents,
  mockProfessorStats,
  formatDate,
  formatTime
};
