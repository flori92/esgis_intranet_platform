/**
 * Service d'internationalisation (i18n) — ESGIS Campus §9.3
 * Interface disponible en français et anglais
 * Implémentation légère sans dépendance externe
 */

const translations = {
  fr: {
    // Navigation
    'nav.dashboard': 'Tableau de bord',
    'nav.schedule': 'Emploi du temps',
    'nav.grades': 'Notes',
    'nav.grades_management': 'Gestion des Notes',
    'nav.grade_corrections': 'Corrections de Notes',
    'nav.exams': 'Examens',
    'nav.documents': 'Documents',
    'nav.messages': 'Messages',
    'nav.forums': 'Forums',
    'nav.stages': 'Stages & Emplois',
    'nav.profile': 'Mon Profil',
    'nav.settings': 'Paramètres',
    'nav.certificate': 'Certificat de scolarité',
    'nav.groups': 'Groupes',
    'nav.question_bank': 'Banque de questions',
    'nav.calendar': 'Calendrier',
    'nav.reports': 'Statistiques',
    'nav.students': 'Gestion Étudiants',
    'nav.departments': 'Départements & Filières',
    'nav.courses': 'Matières & Cours',
    'nav.roles': 'Rôles & Permissions',
    'nav.audit': "Journal d'audit",
    'nav.bulk_bulletins': 'Génération bulletins',
    'nav.notifications': 'Notifications',
    'nav.logout': 'Déconnexion',

    // Auth
    'auth.login': 'Connexion',
    'auth.logout': 'Déconnexion',
    'auth.email': 'Adresse e-mail',
    'auth.password': 'Mot de passe',
    'auth.forgot_password': 'Mot de passe oublié ?',
    'auth.sign_in': 'Se connecter',
    'auth.loading': 'Chargement...',

    // Commun
    'common.save': 'Sauvegarder',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.create': 'Créer',
    'common.search': 'Rechercher...',
    'common.filter': 'Filtrer',
    'common.export': 'Exporter',
    'common.import': 'Importer',
    'common.loading': 'Chargement...',
    'common.no_data': 'Aucune donnée disponible',
    'common.confirm': 'Confirmer',
    'common.back': 'Retour',
    'common.next': 'Suivant',
    'common.previous': 'Précédent',
    'common.all': 'Tous',
    'common.yes': 'Oui',
    'common.no': 'Non',
    'common.actions': 'Actions',
    'common.status': 'Statut',
    'common.date': 'Date',
    'common.name': 'Nom',

    // Profils
    'role.admin': 'Administrateur',
    'role.super_admin': 'Super Administrateur',
    'role.professor': 'Professeur',
    'role.student': 'Étudiant',
    'role.space_admin': 'Administration',
    'role.space_professor': 'Espace Professeur',
    'role.space_student': 'Espace Étudiant',

    // Notes
    'grades.title': 'Mes notes',
    'grades.average': 'Moyenne générale',
    'grades.highest': 'Meilleure note',
    'grades.lowest': 'Note la plus basse',
    'grades.count': "Nombre d'évaluations",
    'grades.publish': 'Publier les notes',
    'grades.publish_warning': 'La publication des notes les rend visibles par tous les étudiants. Cette action est irréversible.',
    'grades.correction_request': 'Demande de correction',
    'grades.pending': 'En attente',
    'grades.approved': 'Validée',
    'grades.rejected': 'Rejetée',

    // Examens
    'exams.title': 'Examens',
    'exams.upcoming': 'À venir',
    'exams.in_progress': 'En cours',
    'exams.completed': 'Terminé',
    'exams.time_remaining': 'Temps restant',
    'exams.submit': 'Soumettre',
    'exams.submit_confirm': 'Êtes-vous sûr ? Vous avez encore {minutes} min et {unanswered} questions non répondues.',
    'exams.cheating_detected': 'Triche détectée ! Vous avez quitté l\'onglet pendant l\'examen.',
    'exams.auto_save': 'Sauvegarde automatique',
    'exams.mark_for_review': 'Marquer pour relecture',

    // Documents
    'documents.certificate': 'Certificat de scolarité',
    'documents.transcript': 'Relevé de notes officiel',
    'documents.bulletin': 'Bulletin semestriel',
    'documents.attestation': "Attestation d'inscription",
    'documents.generate': 'Générer',
    'documents.download': 'Télécharger',
    'documents.verify': 'Vérifier un document',
    'documents.authentic': 'Document authentique',
    'documents.not_verified': 'Document non vérifié',
    'documents.qr_scan': "Scannez le QR code pour vérifier l'authenticité",
    'documents.history': 'Historique des documents',

    // Footer
    'footer.copyright': '© {year} ESGIS - Tous droits réservés',
  },

  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.schedule': 'Schedule',
    'nav.grades': 'Grades',
    'nav.grades_management': 'Grades Management',
    'nav.grade_corrections': 'Grade Corrections',
    'nav.exams': 'Exams',
    'nav.documents': 'Documents',
    'nav.messages': 'Messages',
    'nav.forums': 'Forums',
    'nav.stages': 'Internships & Jobs',
    'nav.profile': 'My Profile',
    'nav.settings': 'Settings',
    'nav.certificate': 'School Certificate',
    'nav.groups': 'Groups',
    'nav.question_bank': 'Question Bank',
    'nav.calendar': 'Calendar',
    'nav.reports': 'Reports',
    'nav.students': 'Student Management',
    'nav.departments': 'Departments & Programs',
    'nav.courses': 'Subjects & Courses',
    'nav.roles': 'Roles & Permissions',
    'nav.audit': 'Audit Log',
    'nav.bulk_bulletins': 'Bulk Report Cards',
    'nav.notifications': 'Notifications',
    'nav.logout': 'Logout',

    // Auth
    'auth.login': 'Login',
    'auth.logout': 'Logout',
    'auth.email': 'Email address',
    'auth.password': 'Password',
    'auth.forgot_password': 'Forgot password?',
    'auth.sign_in': 'Sign in',
    'auth.loading': 'Loading...',

    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.create': 'Create',
    'common.search': 'Search...',
    'common.filter': 'Filter',
    'common.export': 'Export',
    'common.import': 'Import',
    'common.loading': 'Loading...',
    'common.no_data': 'No data available',
    'common.confirm': 'Confirm',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.all': 'All',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.actions': 'Actions',
    'common.status': 'Status',
    'common.date': 'Date',
    'common.name': 'Name',

    // Roles
    'role.admin': 'Administrator',
    'role.super_admin': 'Super Administrator',
    'role.professor': 'Professor',
    'role.student': 'Student',
    'role.space_admin': 'Administration',
    'role.space_professor': 'Professor Area',
    'role.space_student': 'Student Area',

    // Grades
    'grades.title': 'My Grades',
    'grades.average': 'Overall Average',
    'grades.highest': 'Highest Grade',
    'grades.lowest': 'Lowest Grade',
    'grades.count': 'Number of Assessments',
    'grades.publish': 'Publish Grades',
    'grades.publish_warning': 'Publishing grades makes them visible to all students. This action is irreversible.',
    'grades.correction_request': 'Correction Request',
    'grades.pending': 'Pending',
    'grades.approved': 'Approved',
    'grades.rejected': 'Rejected',

    // Exams
    'exams.title': 'Exams',
    'exams.upcoming': 'Upcoming',
    'exams.in_progress': 'In Progress',
    'exams.completed': 'Completed',
    'exams.time_remaining': 'Time remaining',
    'exams.submit': 'Submit',
    'exams.submit_confirm': 'Are you sure? You still have {minutes} min and {unanswered} unanswered questions.',
    'exams.cheating_detected': 'Cheating detected! You left the tab during the exam.',
    'exams.auto_save': 'Auto-save',
    'exams.mark_for_review': 'Mark for review',

    // Documents
    'documents.certificate': 'School Certificate',
    'documents.transcript': 'Official Transcript',
    'documents.bulletin': 'Semester Report Card',
    'documents.attestation': 'Enrollment Certificate',
    'documents.generate': 'Generate',
    'documents.download': 'Download',
    'documents.verify': 'Verify a document',
    'documents.authentic': 'Authentic document',
    'documents.not_verified': 'Document not verified',
    'documents.qr_scan': 'Scan the QR code to verify authenticity',
    'documents.history': 'Document History',

    // Footer
    'footer.copyright': '© {year} ESGIS - All rights reserved',
  }
};

let currentLocale = 'fr';

/**
 * Récupère une traduction par sa clé
 * @param {string} key - Clé de traduction (ex: 'nav.dashboard')
 * @param {Object} [params] - Paramètres de substitution (ex: { year: 2026 })
 * @returns {string} Texte traduit
 */
export function t(key, params = {}) {
  const dict = translations[currentLocale] || translations.fr;
  let text = dict[key] || translations.fr[key] || key;

  // Substitution des paramètres {param}
  Object.entries(params).forEach(([k, v]) => {
    text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  });

  return text;
}

/**
 * Change la langue active
 * @param {string} locale - 'fr' ou 'en'
 */
export function setLocale(locale) {
  if (translations[locale]) {
    currentLocale = locale;
    // Persister en localStorage
    try { localStorage.setItem('esgis_locale', locale); } catch {}
  }
}

/**
 * Retourne la langue active
 * @returns {string}
 */
export function getLocale() {
  return currentLocale;
}

/**
 * Initialise la langue depuis le localStorage ou les préférences navigateur
 */
export function initLocale() {
  try {
    const stored = localStorage.getItem('esgis_locale');
    if (stored && translations[stored]) {
      currentLocale = stored;
      return;
    }
  } catch {}

  // Détecter depuis le navigateur
  const browserLang = navigator.language?.substring(0, 2);
  if (browserLang === 'en') currentLocale = 'en';
  else currentLocale = 'fr';
}

/**
 * Retourne les langues disponibles
 */
export function getAvailableLocales() {
  return [
    { code: 'fr', label: 'Français' },
    { code: 'en', label: 'English' },
  ];
}

// Initialiser au chargement du module
initLocale();

export default { t, setLocale, getLocale, initLocale, getAvailableLocales };
