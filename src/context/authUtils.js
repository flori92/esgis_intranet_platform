// Utilitaires partagés pour AuthContext

/**
 * Ensemble des quiz complétés
 * @type {Set<string>}
 */
export const completedQuizzes = new Set();

/**
 * @typedef {Object} ActiveStudent
 * @property {string} [id] - Identifiant optionnel de l'étudiant
 * @property {string} student_id - Identifiant de l'étudiant
 * @property {string} student_name - Nom de l'étudiant
 * @property {'connected'|'in_progress'|'completed'} status - Statut de l'étudiant
 * @property {number} cheating_attempts - Nombre de tentatives de triche
 * @property {string} connected_at - Date de connexion
 * @property {string} last_activity - Dernière activité
 * @property {boolean} [has_completed] - Si l'étudiant a terminé
 */

/**
 * Registre des étudiants actifs
 * @type {Object.<string, ActiveStudent>}
 */
export const activeStudents = {};
