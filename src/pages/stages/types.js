/**
 * @typedef {Object} Entreprise
 * @property {number} id - ID de l'entreprise
 * @property {string} nom - Nom de l'entreprise
 * @property {string} secteur - Secteur d'activité de l'entreprise
 */

/**
 * @typedef {Object} Offre
 * @property {number} id - ID de l'offre
 * @property {string} titre - Titre de l'offre
 * @property {string} description - Description détaillée de l'offre
 * @property {Entreprise} entreprise - Entreprise proposant l'offre
 * @property {string} dateDebut - Date de début du stage (format ISO)
 * @property {string} dateFin - Date de fin du stage (format ISO)
 * @property {string} lieu - Lieu du stage
 * @property {'temps_plein'|'temps_partiel'|'alternance'} typeStage - Type de stage
 * @property {string[]} competencesRequises - Compétences requises pour le stage
 * @property {number|null} remuneration - Rémunération mensuelle en euros
 * @property {number} duree - Durée du stage en semaines
 * @property {string} professeurContact - Nom du professeur contact
 * @property {string} datePublication - Date de publication de l'offre (format ISO)
 * @property {number} departementId - ID du département concerné
 * @property {string[]} niveauRequis - Niveaux d'études requis
 */

/**
 * @typedef {Object} Candidature
 * @property {number} id - ID de la candidature
 * @property {number} offre_id - ID de l'offre
 * @property {string} etudiant_id - ID de l'étudiant
 * @property {string} date_candidature - Date de la candidature (format ISO)
 * @property {'pending'|'accepted'|'rejected'|'interview'} status - Statut de la candidature
 * @property {string} lettreMotivation - Lettre de motivation
 * @property {string} cv_path - Chemin vers le CV
 * @property {string|null} commentaires - Commentaires sur la candidature
 * @property {number|null} note_entretien - Note obtenue à l'entretien
 * @property {string} created_at - Date de création (format ISO)
 * @property {string} updated_at - Date de mise à jour (format ISO)
 * @property {Offre} offre - Offre associée à la candidature
 */

/**
 * @typedef {Object} Entretien
 * @property {number} id - ID de l'entretien
 * @property {number} candidatureId - ID de la candidature
 * @property {string} date - Date et heure de l'entretien (format ISO)
 * @property {string} lieu - Lieu de l'entretien
 * @property {'presentiel'|'visioconference'|'telephonique'} type - Type d'entretien
 * @property {string|null} lien_visio - Lien pour la visioconférence
 * @property {string} contact - Contact pour l'entretien
 * @property {number} duree - Durée de l'entretien en minutes
 * @property {string} notes - Notes sur l'entretien
 * @property {string} created_at - Date de création (format ISO)
 * @property {string} updated_at - Date de mise à jour (format ISO)
 */

// Aucun export n'est nécessaire car nous utilisons JSDoc pour la documentation des types
