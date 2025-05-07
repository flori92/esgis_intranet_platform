/**
 * Définitions des types pour l'application ESGIS Intranet
 * @module types
 */

/**
 * Statuts possibles pour un quiz
 * @typedef {'not_started'|'in_progress'|'completed'} QuizStatus
 */
export const QuizStatus = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
};

/**
 * @typedef {Object} Question
 * @property {string} id - Identifiant de la question
 * @property {string} text - Texte de la question
 * @property {string[]} options - Options de réponse
 * @property {number} correctAnswer - Index de la réponse correcte
 */

/**
 * @typedef {Object} Quiz
 * @property {string} title - Titre du quiz
 * @property {string} description - Description du quiz
 * @property {number} duration - Durée du quiz en minutes
 * @property {Question[]} questions - Questions du quiz
 */

/**
 * @typedef {Object} UserAnswer
 * @property {string} questionId - Identifiant de la question
 * @property {number} answerIndex - Index de la réponse sélectionnée
 */

/**
 * @typedef {Object} QuizResult
 * @property {string} quizId - Identifiant du quiz
 * @property {string} userId - Identifiant de l'utilisateur
 * @property {number} score - Score obtenu
 * @property {number} totalPossibleScore - Score maximum possible
 * @property {number} cheatingAttempts - Nombre de tentatives de triche
 * @property {Object.<string, number>} userAnswers - Réponses de l'utilisateur
 */

/**
 * @typedef {Object} Exam
 * @property {number} id - Identifiant de l'examen
 * @property {string} title - Titre de l'examen
 * @property {string} description - Description de l'examen
 * @property {string} date - Date de l'examen
 * @property {number} duration - Durée de l'examen en minutes
 * @property {string} type - Type d'examen ('quiz', 'exam', etc.)
 * @property {string} status - Statut de l'examen ('scheduled', 'in_progress', 'completed', etc.)
 */

/**
 * @typedef {Object} StudentExam
 * @property {number} id - Identifiant de l'inscription à l'examen
 * @property {number} exam_id - Identifiant de l'examen
 * @property {string} student_id - Identifiant de l'étudiant
 * @property {string|null} seat_number - Numéro de place assigné
 * @property {'present'|'absent'|'late'|null} attendance_status - Statut de présence
 * @property {'not_started'|'in_progress'|'submitted'|null} attempt_status - Statut de la tentative
 */

/**
 * @typedef {Object} ExamResult
 * @property {number} id - Identifiant du résultat
 * @property {number} student_exam_id - Identifiant de l'inscription à l'examen
 * @property {string} student_id - Identifiant de l'étudiant
 * @property {number} exam_id - Identifiant de l'examen
 * @property {number} score - Score obtenu
 * @property {number} max_score - Score maximum possible
 */

export default {
  QuizStatus
};