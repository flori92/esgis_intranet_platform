// Énumération pour les statuts de quiz
export const QuizStatus = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED"
};

// Les interfaces TypeScript ont été supprimées dans la version JavaScript
// Les commentaires ci-dessous servent de documentation pour la structure des données

/**
 * Structure Question
 * @typedef {Object} Question
 * @property {string} id - Identifiant unique de la question
 * @property {string} text - Texte de la question
 * @property {string[]} options - Options/choix de réponse
 * @property {number} correctAnswer - Index de la réponse correcte
 */

/**
 * Structure Student (Étudiant)
 * @typedef {Object} Student
 * @property {string} id - Identifiant unique de l'étudiant
 * @property {string} name - Nom complet de l'étudiant
 * @property {string} [email] - Email de l'étudiant (optionnel)
 * @property {string} [role] - Rôle de l'étudiant (optionnel)
 */

/**
 * Structure QuizResult (Résultat de quiz)
 * @typedef {Object} QuizResult
 * @property {string} studentId - Identifiant de l'étudiant
 * @property {string} studentName - Nom de l'étudiant
 * @property {number} score - Score obtenu
 * @property {number} totalQuestions - Nombre total de questions
 * @property {number} completionTime - Temps pour compléter le quiz (en secondes)
 * @property {number} quizId - Identifiant du quiz
 * @property {string} date - Date du quiz
 * @property {number} maxScore - Score maximum possible
 * @property {Object.<number, string>} answers - Réponses fournies (clé: index de question, valeur: réponse)
 * @property {number} cheatingAttempts - Nombre de tentatives de triche détectées
 * @property {string} completedAt - Date/heure de fin du quiz
 */

/**
 * Structure AppState (État de l'application)
 * @typedef {Object} AppState
 * @property {Student|null} currentUser - Utilisateur actuellement connecté
 * @property {boolean} isAdmin - Si l'utilisateur est administrateur
 * @property {boolean} isAuthenticated - Si l'utilisateur est authentifié
 */

/**
 * Type Timer (Minuteur)
 * @typedef {number} Timer - Représente le temps restant en secondes
 */

// Note: En JavaScript, nous n'exportons que l'énumération QuizStatus
// Les types et interfaces sont remplacés par de la documentation JSDoc
