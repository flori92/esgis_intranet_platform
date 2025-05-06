/**
 * Types pour la gestion des groupes de TP
 */

/**
 * @typedef {Object} Group
 * @property {string} id - Identifiant unique du groupe
 * @property {string} name - Nom du groupe
 * @property {string} description - Description du groupe
 * @property {string} course_id - ID du cours associé
 * @property {string} professor_id - ID du professeur responsable
 * @property {string} created_at - Date de création
 * @property {string} updated_at - Date de dernière modification
 * @property {number} max_students - Nombre maximum d'étudiants (optionnel)
 * @property {boolean} is_active - Indique si le groupe est actif
 */

/**
 * @typedef {Object} GroupMember
 * @property {string} id - Identifiant unique de l'adhésion
 * @property {string} group_id - ID du groupe
 * @property {string} user_id - ID de l'utilisateur (étudiant)
 * @property {string} joined_at - Date d'adhésion
 * @property {string} status - Statut de l'adhésion (pending, accepted, rejected)
 */

/**
 * @typedef {Object} GroupSession
 * @property {string} id - Identifiant unique de la session
 * @property {string} group_id - ID du groupe
 * @property {string} title - Titre de la session
 * @property {string} description - Description de la session
 * @property {string} start_date - Date et heure de début
 * @property {string} end_date - Date et heure de fin
 * @property {string} location - Lieu de la session (salle, en ligne, etc.)
 * @property {string} meeting_url - URL de la réunion en ligne (optionnel)
 */

export const GROUP_MEMBER_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected'
};
