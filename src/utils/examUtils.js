/**
 * Utilitaires pour la gestion des examens
 * Fournit des fonctions de secours en cas d'erreur avec la base de données
 */

/**
 * Récupère les examens d'un étudiant depuis les métadonnées utilisateur
 * @param {Object} user - Objet utilisateur Supabase
 * @returns {Array} Liste des examens de l'étudiant
 */
export const getExamsFromUserMetadata = (user) => {
  if (!user) {
    return [];
  }
  
  // Récupérer les examens depuis les métadonnées utilisateur
  return user.user_metadata?.exams_backup || [];
};

/**
 * Filtre les examens en fonction de leur statut
 * @param {Array} exams - Liste des examens
 * @param {string} status - Statut des examens à filtrer ('upcoming', 'past', 'all')
 * @returns {Array} Liste des examens filtrés
 */
export const filterExamsByStatus = (exams, status) => {
  if (!exams || !Array.isArray(exams)) {
    return [];
  }
  
  const now = new Date();
  
  // Toujours inclure le quiz de virtualisation Cloud Datacenter
  const isVirtualizationQuiz = (exam) => {
    return exam.exam_id === 999 || // ID fixe pour le quiz de virtualisation
           (exam.exams?.title && (
             exam.exams.title.toLowerCase().includes('virtualization') ||
             exam.exams.title.toLowerCase().includes('virtualisation') ||
             exam.exams.title.toLowerCase().includes('cloud datacenter') ||
             exam.exams.title.toLowerCase().includes('cloud datacenter advanced')
           )) ||
           (exam.title && (
             exam.title.toLowerCase().includes('virtualization') ||
             exam.title.toLowerCase().includes('virtualisation') ||
             exam.title.toLowerCase().includes('cloud datacenter') ||
             exam.title.toLowerCase().includes('cloud datacenter advanced')
           ));
  };
  
  switch (status) {
    case 'upcoming':
      // Examens à venir (date future) + quiz de virtualisation
      return exams.filter(exam => {
        if (isVirtualizationQuiz(exam)) return true;
        const examDate = new Date(exam.exams?.date || exam.date);
        return examDate > now;
      });
    case 'past':
      // Examens passés (date passée) + quiz de virtualisation
      return exams.filter(exam => {
        if (isVirtualizationQuiz(exam)) return true;
        const examDate = new Date(exam.exams?.date || exam.date);
        return examDate < now;
      });
    case 'all':
    default:
      // Tous les examens
      return exams;
  }
};

/**
 * Recherche des examens par titre ou code de cours
 * @param {Array} exams - Liste des examens
 * @param {string} query - Terme de recherche
 * @returns {Array} Liste des examens correspondant à la recherche
 */
export const searchExams = (exams, query) => {
  if (!query || !exams || !Array.isArray(exams)) {
    return exams;
  }
  
  const searchTerm = query.toLowerCase();
  
  return exams.filter(exam => {
    const title = exam.exams?.title?.toLowerCase() || '';
    const courseCode = exam.exams?.courses?.code?.toLowerCase() || '';
    const courseName = exam.exams?.courses?.name?.toLowerCase() || '';
    
    return title.includes(searchTerm) || 
           courseCode.includes(searchTerm) || 
           courseName.includes(searchTerm);
  });
};
