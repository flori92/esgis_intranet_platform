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
  
  switch (status) {
    case 'upcoming':
      // Examens à venir (date future)
      return exams.filter(exam => {
        const examDate = new Date(exam.exams?.date);
        return examDate > now;
      });
    case 'past':
      // Examens passés (date passée)
      return exams.filter(exam => {
        const examDate = new Date(exam.exams?.date);
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
