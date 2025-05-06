/**
 * Types pour la gestion des documents
 */

/**
 * @typedef {Object} Document
 * @property {string} id - Identifiant unique du document
 * @property {string} title - Titre du document
 * @property {string} description - Description du document
 * @property {string} file_url - URL du fichier
 * @property {string} file_name - Nom du fichier
 * @property {string} file_type - Type de fichier (pdf, docx, etc.)
 * @property {number} file_size - Taille du fichier en octets
 * @property {string} created_at - Date de création
 * @property {string} updated_at - Date de dernière modification
 * @property {string} created_by - ID de l'utilisateur qui a créé le document
 * @property {string} course_id - ID du cours associé (optionnel)
 * @property {string} group_id - ID du groupe associé (optionnel)
 * @property {string} type - Type de document (cours, tp, attestation, etc.)
 * @property {boolean} is_public - Indique si le document est accessible à tous
 */

/**
 * @typedef {Object} DocumentCategory
 * @property {string} id - Identifiant unique de la catégorie
 * @property {string} name - Nom de la catégorie
 * @property {string} description - Description de la catégorie
 * @property {string} icon - Icône de la catégorie
 */

/**
 * @typedef {Object} DocumentPermission
 * @property {string} id - Identifiant unique de la permission
 * @property {string} document_id - ID du document
 * @property {string} user_id - ID de l'utilisateur
 * @property {string} permission_type - Type de permission (view, edit, delete)
 */

export const DOCUMENT_TYPES = {
  COURSE: 'course',
  TP: 'tp',
  EXAM: 'exam',
  CERTIFICATE: 'certificate',
  ATTESTATION: 'attestation',
  OTHER: 'other'
};

export const PERMISSION_TYPES = {
  VIEW: 'view',
  EDIT: 'edit',
  DELETE: 'delete'
};
