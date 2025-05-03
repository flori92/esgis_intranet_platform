import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Interface pour les statistiques du professeur
export interface ProfessorStats {
  totalCourses: number;
  totalStudents: number;
  upcomingExams: number;
  pendingGrades: number;
}

// Interface pour les cours du professeur
export interface ProfessorCourse {
  id: number;
  name: string;
  code: string;
  department: string;
  students: number;
  nextSession: string | null;
  room: string | null;
}

// Interface pour les examens
export interface ProfessorExam {
  id: number;
  courseId: number;
  courseName: string;
  date: string;
  duration: number;
  room: string;
  type: 'final' | 'midterm' | 'quiz';
  status: 'upcoming' | 'completed' | 'graded';
}

// Interface pour les actualités du professeur
export interface ProfessorNewsItem {
  id: number;
  title: string;
  content: string;
  date: string;
  imageUrl: string;
  category: string;
}

// Interface pour les événements du professeur
export interface ProfessorEventItem {
  id: number;
  title: string;
  date: string;
  location: string;
  type: 'reunion' | 'formation' | 'administratif' | 'autre';
  description: string;
}

// Interface pour les notes à publier
export interface PendingGrade {
  id: number;
  courseId: number;
  courseName: string;
  examType: 'final' | 'midterm' | 'quiz';
  dueDate: string;
  studentsCount: number;
  gradedCount: number;
}

// Données mock pour les statistiques
export const mockProfessorStats: ProfessorStats = {
  totalCourses: 5,
  totalStudents: 187,
  upcomingExams: 3,
  pendingGrades: 2
};

// Données mock pour les cours
export const mockProfessorCourses: ProfessorCourse[] = [
  {
    id: 1,
    name: 'Développement Web Avancé',
    code: 'INFO-453',
    department: 'Informatique',
    students: 42,
    nextSession: '2025-05-04T10:00:00',
    room: 'B-301'
  },
  {
    id: 2,
    name: 'Bases de données',
    code: 'INFO-362',
    department: 'Informatique',
    students: 38,
    nextSession: '2025-05-05T13:30:00',
    room: 'C-205'
  },
  {
    id: 3,
    name: 'Architecture des Systèmes',
    code: 'INFO-401',
    department: 'Informatique',
    students: 35,
    nextSession: '2025-05-06T08:30:00',
    room: 'A-102'
  },
  {
    id: 4,
    name: 'Programmation Mobile',
    code: 'INFO-472',
    department: 'Informatique',
    students: 32,
    nextSession: '2025-05-07T15:00:00',
    room: 'B-204'
  },
  {
    id: 5,
    name: 'Intelligence Artificielle',
    code: 'INFO-505',
    department: 'Informatique',
    students: 40,
    nextSession: '2025-05-08T10:00:00',
    room: 'C-301'
  }
];

// Données mock pour les examens
export const mockProfessorExams: ProfessorExam[] = [
  {
    id: 1,
    courseId: 1,
    courseName: 'Développement Web Avancé',
    date: '2025-05-15T09:00:00',
    duration: 180,
    room: 'Amphi A',
    type: 'midterm',
    status: 'upcoming'
  },
  {
    id: 2,
    courseId: 2,
    courseName: 'Bases de données',
    date: '2025-05-18T14:00:00',
    duration: 120,
    room: 'Amphi B',
    type: 'quiz',
    status: 'upcoming'
  },
  {
    id: 3,
    courseId: 3,
    courseName: 'Architecture des Systèmes',
    date: '2025-05-20T10:00:00',
    duration: 180,
    room: 'Amphi C',
    type: 'midterm',
    status: 'upcoming'
  }
];

// Données mock pour les notes à publier
export const mockPendingGrades: PendingGrade[] = [
  {
    id: 1,
    courseId: 4,
    courseName: 'Programmation Mobile',
    examType: 'quiz',
    dueDate: '2025-05-10T23:59:59',
    studentsCount: 32,
    gradedCount: 18
  },
  {
    id: 2,
    courseId: 5,
    courseName: 'Intelligence Artificielle',
    examType: 'midterm',
    dueDate: '2025-05-12T23:59:59',
    studentsCount: 40,
    gradedCount: 15
  }
];

// Données mock pour les actualités
export const mockProfessorNews: ProfessorNewsItem[] = [
  {
    id: 1,
    title: 'Mise à jour du planning des soutenances',
    content: 'Le planning des soutenances de fin d\'année a été mis à jour. Veuillez consulter vos disponibilités.',
    date: '2025-05-02T09:15:00',
    imageUrl: 'https://source.unsplash.com/random/300x200?calendar',
    category: 'Planning'
  },
  {
    id: 2,
    title: 'Atelier pédagogique sur les méthodes d\'évaluation',
    content: 'Un atelier sur les nouvelles méthodes d\'évaluation sera organisé le 10 mai. Inscription obligatoire.',
    date: '2025-05-01T11:30:00',
    imageUrl: 'https://source.unsplash.com/random/300x200?workshop',
    category: 'Formation'
  },
  {
    id: 3,
    title: 'Nouvelle plateforme de ressources pédagogiques',
    content: 'Une nouvelle bibliothèque de ressources pédagogiques est maintenant disponible pour tous les enseignants.',
    date: '2025-04-29T14:45:00',
    imageUrl: 'https://source.unsplash.com/random/300x200?library',
    category: 'Ressources'
  }
];

// Données mock pour les événements
export const mockProfessorEvents: ProfessorEventItem[] = [
  {
    id: 1,
    title: 'Réunion du département Informatique',
    date: '2025-05-05T15:00:00',
    location: 'Salle de conférence B',
    type: 'reunion',
    description: 'Réunion mensuelle pour discuter des programmes et des nouvelles initiatives.'
  },
  {
    id: 2,
    title: 'Formation sur les outils d\'IA pour l\'enseignement',
    date: '2025-05-10T09:30:00',
    location: 'Laboratoire C-305',
    type: 'formation',
    description: 'Atelier sur l\'utilisation des outils d\'IA pour améliorer l\'expérience d\'apprentissage.'
  },
  {
    id: 3,
    title: 'Remise des rapports d\'évaluation trimestriels',
    date: '2025-05-15T17:00:00',
    location: 'En ligne',
    type: 'administratif',
    description: 'Date limite pour soumettre les rapports d\'évaluation trimestriels de vos cours.'
  },
  {
    id: 4,
    title: 'Cérémonie de remise des prix d\'excellence',
    date: '2025-05-20T18:30:00',
    location: 'Auditorium principal',
    type: 'autre',
    description: 'Cérémonie annuelle de reconnaissance des performances académiques exceptionnelles.'
  }
];

// Fonction pour initialiser les données mock dans Supabase
export const initializeProfessorMockData = async (supabase: any) => {
  try {
    console.log('Initialisation des données mock pour le tableau de bord professeur...');
    
    // Vérifier et initialiser les données des cours
    const { data: existingCourses } = await supabase
      .from('professor_courses')
      .select('*')
      .limit(1);
    
    if (!existingCourses || existingCourses.length === 0) {
      // Créer des enregistrements fictifs pour les cours professeur
      const professorCoursesData = mockProfessorCourses.map(course => ({
        professor_id: 1, // ID du professeur connecté
        course_id: course.id,
        created_at: new Date().toISOString()
      }));
      
      await supabase.from('professor_courses').insert(professorCoursesData);
      console.log('Cours professeur initialisés avec succès');
    }
    
    // Vérifier et initialiser les examens
    const { data: existingExams } = await supabase
      .from('exams')
      .select('*')
      .limit(1);
    
    if (!existingExams || existingExams.length === 0) {
      const examsData = mockProfessorExams.map(exam => ({
        id: exam.id,
        course_id: exam.courseId,
        date: exam.date,
        duration: exam.duration,
        room: exam.room,
        type: exam.type,
        status: exam.status,
        created_at: new Date().toISOString()
      }));
      
      await supabase.from('exams').insert(examsData);
      console.log('Examens initialisés avec succès');
    }
    
    // Vérifier et initialiser les actualités pour professeurs
    const { data: existingNews } = await supabase
      .from('professor_news')
      .select('*')
      .limit(1);
    
    if (!existingNews || existingNews.length === 0) {
      const newsData = mockProfessorNews.map(news => ({
        id: news.id,
        title: news.title,
        content: news.content,
        date: news.date,
        image_url: news.imageUrl,
        category: news.category,
        created_at: new Date().toISOString()
      }));
      
      await supabase.from('professor_news').insert(newsData);
      console.log('Actualités professeur initialisées avec succès');
    }
    
    // Vérifier et initialiser les événements pour professeurs
    const { data: existingEvents } = await supabase
      .from('professor_events')
      .select('*')
      .limit(1);
    
    if (!existingEvents || existingEvents.length === 0) {
      const eventsData = mockProfessorEvents.map(event => ({
        id: event.id,
        title: event.title,
        date: event.date,
        location: event.location,
        type: event.type,
        description: event.description,
        created_at: new Date().toISOString()
      }));
      
      await supabase.from('professor_events').insert(eventsData);
      console.log('Événements professeur initialisés avec succès');
    }
    
    // Initialiser les statistiques globales
    const { data: existingStats } = await supabase
      .from('professor_statistics')
      .select('*')
      .limit(1);
    
    if (!existingStats || existingStats.length === 0) {
      await supabase.from('professor_statistics').insert({
        professor_id: 1,
        total_courses: mockProfessorStats.totalCourses,
        total_students: mockProfessorStats.totalStudents,
        upcoming_exams: mockProfessorStats.upcomingExams,
        pending_grades: mockProfessorStats.pendingGrades,
        created_at: new Date().toISOString()
      });
      console.log('Statistiques professeur initialisées avec succès');
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des données mock:', error);
    return false;
  }
};

// Fonction pour formater une date
export const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'dd MMMM yyyy', { locale: fr });
};

// Fonction pour formater une heure
export const formatTime = (dateString: string) => {
  return format(new Date(dateString), 'HH:mm', { locale: fr });
};

// Fonction pour formater une date avec jour de la semaine
export const formatDateWithDay = (dateString: string) => {
  return format(new Date(dateString), 'EEEE dd MMMM', { locale: fr });
};

// Fonction pour obtenir le jour de la semaine
export const getDayOfWeek = (dateString: string) => {
  return format(new Date(dateString), 'EEEE', { locale: fr });
};
