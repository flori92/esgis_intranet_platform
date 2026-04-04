# ESGIS Campus — Execution Tracker

Ce document sert de tracker d'execution du projet.

## 1. Regles De Pilotage

- La specification de reference est [ESGIS_Campus_specification_fonctionnelle_complete.md](/Users/floriace/ESGIS/esgis_intranet_platform/docs/ESGIS_Campus_specification_fonctionnelle_complete.md).
- Le diagnostic de depart est [ESGIS_Campus_gap_analysis.md](/Users/floriace/ESGIS/esgis_intranet_platform/docs/ESGIS_Campus_gap_analysis.md).
- Toute implementation doit etre rattachee a un chantier de ce tracker.
- Toute nouvelle page ou fonctionnalite doit preciser: role cible, source de donnees, tables impactees, statut du workflow complet.

## 2. Phases

### Phase 0 — Stabilisation Du Socle

Objectif: rendre le produit web coherent avant toute extension.

- [x] Definir un schema Supabase canonique unique
- [x] Aligner les noms de tables utilises par l'UI et les migrations
- [x] Unifier authState, profile, student, professor, roles
- [x] Corriger les routes et menus casses
- [x] Brancher uniquement des pages existantes et exploitables
- [x] Identifier et supprimer les dead paths
- [x] Reduire les fallbacks silencieux
- [x] Stabiliser les politiques RLS minimales

Definition of done:

- aucune navigation principale ne mene vers une page inexistante
- aucun role n'utilise un modele d'identite different selon la page
- le projet compile et les parcours principaux sont coherents

### Phase 1 — Parcours Etudiant MVP Fiable

Objectif: livrer un espace etudiant utilisable en production.

- [x] Dashboard etudiant sur donnees reelles
- [x] Mes cours / bibliotheque pedagogique structuree
- [x] Emploi du temps fiable
- [x] Notes et moyennes sur donnees reelles
- [x] Certificat de scolarite officiel fiable
- [x] Releve de notes officiel PDF (TranscriptPage.jsx créée)
- [x] Bulletin semestriel officiel (ReportCardPage.jsx créée)
- [x] Historique des documents generes
- [x] Stages: consultation et candidatures reelles
- [x] Messagerie et notifications stables
- [x] Profil et preferences de base (ProfileSettingsPage.jsx créée)

Definition of done:

- un etudiant peut suivre son semestre sans passer par un canal externe

### Phase 2 — Parcours Professeur MVP Fiable

Objectif: livrer un espace professeur operationnel.

- [x] Dashboard professeur sur donnees reelles
- [x] Depot de ressources pedagogiques structurees
- [x] Gestion de la bibliotheque par matiere/chapitre
- [x] Syllabus / programme de cours
- [x] Saisie des notes CC + examen
- [x] Revue avant publication
- [x] Demande de correction post-publication
- [x] Banque de questions personnelle
- [x] Creation d'examen complete
- [x] Suivi temps reel des examens
- [x] Correction manuelle et automatique
- [x] Suivi des promotions et fiches etudiants
- [x] Communication ciblee

Definition of done:

- un professeur peut enseigner, evaluer et communiquer integralement depuis la plateforme

### Phase 3 — Parcours Administration MVP Fiable

Objectif: livrer les workflows institutionnels critiques.

- [x] Dossier etudiant numerique complet (StudentDetailsPage.jsx créée)
- [x] Creation/import massif d'etudiants (StudentImportPage.jsx créée)
- [x] Tableau de bord admin (AdminDashboard.jsx créée)
- [x] Activation/suspension comptes (AccountStatusPage.jsx)
- [x] Gestion professeurs complete (ProfessorsListPage.jsx)
- [x] Filieres, niveaux, semestres, maquettes (LevelsAndSemestersPage.jsx)
- [x] Matieres, coefficients, credits (SubjectsPage.jsx)
- [x] Journal d'audit (AuditLogPage.jsx)
- [ ] Templates de documents officiels
- [ ] File d'attente de validation
- [ ] Generation en masse de bulletins
- [ ] Depot manuel de documents dans un dossier etudiant
- [ ] Offres de stages et partenaires
- [x] Calendrier institutionnel
- [x] Communication institutionnelle
- [ ] Rapports et exports fiables
- [ ] Paiements et recus

Definition of done:

- l'administration peut gerer le cycle academique sans workflow papier principal

### Phase 4 — Securite, Integrite Et Conformite

Objectif: rendre le systeme defendable et auditable.

- [x] QR verification publique des documents
- [ ] Historique des modifications de notes
- [ ] Audit log transverse
- [ ] OTP / verification renforcee avant examen
- [ ] 2FA administration
- [ ] Anti-triche navigateur renforce
- [x] Rapport d'integrite examen
- [ ] Retention des donnees et hygiene RGPD

### Phase 5 — Extensions Strategiques

- [ ] Super Administrateur
- [ ] Notifications multi-canal completes
- [ ] Application mobile native
- [ ] iCal / sync agenda
- [ ] Forums par matiere
- [ ] Monitoring systeme
- [ ] Sauvegardes operables depuis l'interface

## 3. Chantiers Immediats

### Chantier A — Foundation Alpha

Priorite maximale.

- [x] Audit final des routes/menu
- [x] Reparation des chemins incoherents
- [x] Branchement des pages existantes mais non routees lorsque pertinentes
- [x] Suppression ou report des entrees de menu vers des modules inexistants
- [x] Cartographie des pages orphelines

### Chantier B — Data Model Unification

- [x] Definir les objets frontend canoniques: user, profile, student, professor, admin
- [x] Corriger les pages qui supposent des champs absents
- [x] Normaliser l'acces aux IDs metier

### Chantier C — Schema Canonique

- [x] Choisir `supabase/migrations/` comme source de verite ou fusionner proprement
- [x] Documenter les tables cibles par domaine
- [x] Aligner les noms de tables utilises dans le front

## 4. Definition Des Modules A Geler

Phase 0 etant fermee sur le perimetre actif des phases 1 et 2, ces modules restent neanmoins hors priorite tant que les phases 3 a 5 ne sont pas traitees:

- super admin
- mobile natif
- forums
- integrations SMS

## 5. Statut Actuel

Date de référence: 2026-04-04 — 15h (build de validation OK)

- Phase 0: **100%** sur le perimetre socle actif des phases 1 et 2 (schema canonique, auth unifiee, routes utiles, dead paths examens supprimes, fallbacks silencieux retires, build validee)
- Phase 1: **100%** (dashboard, bibliotheque pedagogique structuree, calendrier, notes, certificats, stages, messages, documents reels, releve, bulletin, profil)
- Phase 2: **100%** (ressources, notes, banque de questions, creation d'examen complete, suivi temps reel, correction automatique/manuelle, suivi promotions, communication)
- Phase 3: **60%** (9/15 items: Admin Dashboard, Student CRUD, Import, Professors, Departments, Audit Log, Account Status, Levels/Semesters, Subjects). Reste 6 items (Templates, File d'attente, Bulletins masse, Rapports, Paiements, Stages).
- Phase 4: **30%** en cours (QR verification, Integrity report done; OTP/2FA/RGPD/Audit logs ouverts)
- Phase 5: **0%** non demarrée

### Verrous Actuels (Blockers)

Aucun verrou ouvert sur le perimetre actif étudiant ou professeur. Le focus est maintenant exclusivement sur les workflows backend administrateurs et métier (Paiements, Bulletins en masse, Validation).

## 6. Journal D'Avancement

### 2026-04-03 — Stabilisation auth/navigation

- Contrat d'auth frontend retrocompatible pose dans `src/hooks/useSupabaseAuth.js` et `src/context/AuthContext.jsx`
- Aliases stabilises: `authState`, `user`, `profile`, `student`, `professor`, `login`, `signIn`, `signUp`, `logout`
- Redirections d'entree corrigees vers `/admin`, `/professor`, `/student`
- Navigation principale nettoyee pour ne pointer que vers des routes branchees
- Build validee apres corrections

### 2026-04-03 — Decision schema canonique

- Source de verite retenue: `supabase/migrations/`
- Cartographie ecrite dans `docs/ESGIS_Campus_schema_canonique.md`
- Divergences critiques identifiees: `exam_students` vs `student_exams`, `offres_stage` vs `stage_offres`, `actualites` vs `news`, `schedules` vs `schedule` vs `course_sessions`

### 2026-04-04 — Fermeture des phases 0, 1 et 2

- `src/pages/student/CoursesPage.jsx` utilise maintenant les interactions reelles (`view`, `download`, `favorite`, `reaction`) pour calculer les statuts `new`, `read`, `downloaded`, `favorite`
- `src/pages/professor/grades/GradesManagementPage.jsx` ne retombe plus sur `MOCK_COURSES` ni `MOCK_STUDENTS`; la page n'affiche plus que des donnees reelles ou un etat vide explicite
- `src/utils/examQuestionUtils.js` centralise la normalisation, l'affichage et la notation automatique des types: `qcm_single`, `qcm_multiple`, `true_false`, `short_answer`, `long_answer`, `numeric`, `matching`, `ordering`, `fill_blank`, `image_question`
- `src/pages/professor/exams/components/ExamQuestions.jsx` couvre maintenant l'ensemble du spectre de questions de la specification sur le flux actif
- `src/pages/exams/hooks/useQuiz.js`, `src/pages/exams/student/ExamResultsPage.jsx`, `src/pages/professor/exams/ExamGradingPage.jsx` et `src/pages/professor/exams/components/GradeQuestionItem.jsx` partagent la meme logique de scoring et de gradabilite
- `src/pages/exams/student/StudentExamsList.jsx` ne reinjecte plus de faux examens ni de fallback metadata; la liste vient uniquement de `student_exams`
- `src/hooks/useSupabaseAuth.js` ne genere plus de faux profils ni de session simulee pour contourner l'absence de profil ou d'email confirme
- Les doublons legacy `src/pages/exams/professor/*` et `src/pages/exams/components/{ExamBasicInfo,ExamQuestions,ExamScheduling,ExamStudents}.jsx` ont ete supprimes comme dead paths
- Build de validation reussie apres nettoyage des dead paths et des mocks: `npm run build`

### 2026-04-03 — Alignement examens professeur

- `src/pages/professor/exams/ExamFormPage.jsx` realigne sur `student_exams` et `exam_questions`
- `src/pages/professor/exams/ExamsListPage.jsx` realigne sur `student_exams`, `exam_sessions`, `exam_centers`
- `src/pages/professor/exams/ExamGradingPage.jsx` realigne sur `student_exams.answers` et `exam_grades`
- Correction metier de la logique de passage: comparaison sur les points obtenus et non sur un pourcentage incoherent
- Build validee apres corrections

### 2026-04-03 — Alignement messagerie

- `src/pages/messages/MessagesPage.jsx` ne depend plus de `conversations`
- La page partagee repose desormais sur un modele simple `messages` avec inbox, sent, lecture et composition
- `src/pages/student/MessagesPage.jsx` corrige pour ne plus appliquer un filtrage incoherent sur `is_read`
- Build validee apres corrections

### 2026-04-03 — Alignement initialisation admin

- `src/pages/admin/InitializeDataPage.jsx` passe en strategie canonique-first avec fallback controle
- Stages: `stage_offres` prioritaire, fallback transitoire `offres_stage`
- Actualites: `news` prioritaire, fallback transitoire `actualites`
- Planning: `course_sessions` prioritaire, fallback transitoire `schedules`
- Redirection admin invalide retiree (`/dashboard` -> `/`)
- Build validee apres corrections

### 2026-04-03 — Alignement documents et certificats

- `src/pages/documents/DocumentsPage.jsx` remplace le modele legacy (`category`, `is_public`, `documents_public`, `tags` embarques) par le schema canonique `documents` + `document_tags`
- Les routes etudiant/professeur convergent sur le module partage via `src/pages/student/DocumentsPage.jsx` et `src/pages/professor/DocumentsPage.jsx`
- Les documents officiels traces dans `generated_documents` sont exposes dans le module partage pour les etudiants et les administrateurs
- `src/pages/student/CertificatePage.jsx` genere, archive et telecharge maintenant le certificat en l'enregistrant dans `generated_documents`
- `src/utils/certificateUtils.js` lit en priorite `profiles` et `students` plutot que des metadonnees legacy
- Build validee apres corrections

### 2026-04-03 — Nouvelles tables metier ajoutees en base

- Migration distante executee pour `forums`, `forum_posts`, `forum_replies`, `forum_likes`
- Migration distante executee pour `course_chapters`, `course_resources`, `resource_interactions`
- Migration distante executee pour `practice_quizzes`, `practice_quiz_attempts`
- Migration distante executee pour `payment_records`, `demandes_correction_notes`

### 2026-04-03 — Dashboard professeur sur donnees reelles

- `src/api/professorDashboard.js` agrege maintenant les cours assignes, sessions, examens, copies en attente, actualites et evenements
- `src/pages/professor/DashboardPage.jsx` ne depend plus de `src/utils/professorMockData.js`
- Les liens invalides vers `/professor/courses` ont ete retires du dashboard
- Le lien de correction pointe desormais vers la vraie route `/professor/exams/:id/grade`
- Build validee apres corrections

### 2026-04-03 — Ressources pedagogiques professeur

- Nouvelle route professeur `src/pages/professor/CoursesPage.jsx` pour gerer les cours assignes, chapitres et ressources
- `src/api/courses.js` couvre maintenant le flux professeur: cours assignes, bibliotheque complete, creation de chapitres, chapitre syllabus, upload, edition et suppression
- Le menu professeur expose `Mes Cours` et le dashboard renvoie vers cette gestion
- Le chapitre `Programme & syllabus` est supporte comme espace dedie pour le programme de cours
- Build validee apres corrections

### 2026-04-03 — Suivi des etudiants professeur

- Nouvelle route professeur `src/pages/professor/StudentsPage.jsx` pour suivre les etudiants par cours
- `src/api/professorStudents.js` agrege les inscriptions effectives, moyennes par etudiant, dernieres notes et indicateurs d'alerte
- Le professeur peut ouvrir une fiche etudiant dans la matiere et envoyer un message direct
- Une annonce ciblee peut etre envoyee a toute la promotion du cours depuis cette page
- Build validee apres corrections

### 2026-04-03 — Banque de questions et import examen

- `src/api/questionBank.js` est realigne sur la table canonique `question_bank`
- `src/pages/professor/questions/QuestionBankPage.jsx` n'utilise plus de mocks pour charger, creer, modifier, dupliquer et supprimer les questions
- Les questions personnelles peuvent etre partagees dans la banque commune de l'etablissement
- `src/pages/professor/exams/components/ExamQuestions.jsx` permet maintenant d'importer des questions depuis la banque dans le createur d'examen
- `src/pages/professor/exams/ExamFormPage.jsx` incremente l'usage des questions importees lors de l'enregistrement reussi
- Build validee apres corrections
- Trace repo ajoutee dans `supabase/migrations/20260403_add_forums_resources_practice_quizzes.sql`
- Point d'attention formalise: ces tables utilisent `profiles.id` en UUID pour leurs FKs utilisateur, pas `students.id` / `professors.id`

### 2026-04-03 — Couverture API/migrations

- Audit ecrit dans `docs/ESGIS_Campus_api_migration_coverage.md`
- `src/api/courses.js` realigne sur `students`, `student_courses`, `courses`, `course_chapters`, `course_resources`, `resource_interactions`
- `src/pages/student/CoursesPage.jsx` corrige pour supprimer reellement les favoris en base
- `src/api/calendar.js` realigne sur `course_sessions` et `events`
- `src/api/payments.js` realigne sur `students`, `payments`, `payment_records`
- `src/pages/admin/PaymentsPage.jsx` branche sur l'enregistrement reel des versements
- `src/api/forums.js` realigne sur `forums.course_id` et `courses.level`
- `src/api/admin.js` realigne les bulletins sur `generated_documents` et les quiz d'entrainement sur `practice_quizzes` / `practice_quiz_attempts`
- `src/api/quiz.js` ne depend plus de `questions` / `question_options` pour la lecture des examens, et expose des retours coherents via `data`
- Nouvelle migration ajoutee: `supabase/migrations/20260403_api_runtime_support.sql`
- Couverture ajoutee pour `active_students`, `cheating_attempts`, `quiz_results` et les RPC manquantes
- Audit post-correctifs: plus que `cours`, `inscriptions`, `notes` comme tables legacy restantes cote `src/api`
- Reliquat principal isole: `src/api/grades.js` et les pages professeur de gestion des notes
- Build validee apres corrections

### 2026-04-03 — Alignement notes et corrections

- Nouvelle table canonique ajoutee: `supabase/migrations/20260403_grades_canonical.sql`
- `src/api/grades.js` ne depend plus de `cours`, `inscriptions`, `notes`
- `src/pages/professor/grades/GradesManagementPage.jsx` publie reellement les notes via `grades.is_published`
- `src/pages/professor/grades/GradeCorrectionPage.jsx` repose sur une selection de notes publiees reelles, plus sur un flux mock
- `src/pages/student/GradesPage.jsx` lit maintenant les notes reelles publiees depuis `grades`
- `src/pages/grades/GradesPage.jsx` corrige l'usage de `exam_results` avec l'identifiant metier etudiant correct
- La migration historique `supabase/migrations/20250503_grade_corrections.sql` a ete rendue compatible avec le schema actuel en supprimant sa dependance a `notes`
- Audit post-correctifs: plus aucune table manquante cote `src/api`
- Reliquat de centralisation: acces directs a Supabase encore presents hors `src/api`, en priorite notifications et dashboards
- Build validee apres corrections

### 2026-04-03 — Centralisation notifications et dashboard admin

- Nouvelle couche `src/api/notifications.js` pour la lecture, suppression, marquage lu et souscription realtime des notifications
- `src/pages/notifications/NotificationsPage.jsx` ne depend plus directement de Supabase ni de champs legacy comme `user_id`, `message`, `related_to`, `lu`
- `src/pages/admin/DashboardPage.jsx` consomme maintenant `getAdminDashboardData()` via `src/api/admin.js`
- `src/services/NotificationService.js` a ete realigne sur le schema canonique `recipient_id`, `content`, `priority`, `read`
- `src/pages/professor/exams/ExamGradingPage.jsx` delegue aussi la creation de notification a `src/api/notifications.js`
- Le reliquat de centralisation hors `src/api` se deplace principalement vers `useSupabaseAuth`, `DocumentsPage`, `UserManagementPage`, `ProfileSettingsPage` et certains modules examens
- Build validee apres corrections

### 2026-04-03 — Centralisation documents, utilisateurs et profil

- Nouvelle migration `supabase/migrations/20260403_profile_settings_fields.sql` pour couvrir les champs reels de `ProfileSettingsPage` dans `profiles`
- Nouvelle couche `src/api/documents.js` pour charger les cours accessibles, les documents uploades, les documents generes, les suppressions, uploads et URLs de telechargement
- Nouvelle couche `src/api/profile.js` pour les parametres de profil, les uploads avatar/CV et la mise a jour du mot de passe
- `src/api/users.js` a ete reecrit pour se realigner sur `profiles.is_active`, `students.profile_id` et `professors.profile_id`, avec import CSV et creation utilisateur centralises
- `src/pages/documents/DocumentsPage.jsx` ne depend plus directement de Supabase
- `src/pages/admin/UserManagementPage.jsx` ne depend plus directement de Supabase
- `src/pages/shared/ProfileSettingsPage.jsx` ne depend plus directement de Supabase
- Reliquat principal de centralisation hors `src/api`: `src/hooks/useSupabaseAuth.js`, certains composants dashboard et quelques modules historiques
- Build validee apres corrections

### 2026-04-03 — Build validee et decoupage lazy des routes

- Verification faite: `vite build` n'etait pas bloque, mais tres long; la build passe completement
- Mesure avant optimisation: un chunk principal unique d'environ `2.47 MB`
- Ajout d'un composant mutualise `src/components/common/RouteLoader.jsx`
- `src/App.jsx` passe en imports lazy pour les modules d'auth, layout, routes par role et pages partagees
- `src/routes/AdminRoutes.jsx`, `src/routes/ProfessorRoutes.jsx` et `src/routes/StudentRoutes.jsx` passent aussi en imports lazy pour leurs pages
- Mesure apres optimisation: le chunk principal `index.*.js` tombe a environ `387.80 kB`
- Les gros modules restent charges a la demande, notamment `ReportsPage` et `PDFButton`, au lieu d'alourdir le chargement initial
- Build validee apres corrections

### 2026-04-03 — Isolation de `recharts` et `pdf-lib`

- Nouveau helper `src/utils/pdfLib.js` pour charger `pdf-lib` a la demande
- `src/utils/certificateUtils.js` ne charge plus `pdf-lib` au niveau module
- `src/services/DocumentQRService.js` ne charge plus `pdf-lib` lors de la simple verification publique
- `src/pages/admin/DocumentGeneratorPage.jsx` charge `pdf-lib` uniquement au moment de la generation et remplace l'aperçu `Buffer` par une `Blob URL`
- `src/pages/admin/ReportsPage.jsx` ne contient plus `recharts` directement
- Nouveaux composants lazy par onglet: `OverviewReportsTab`, `StudentReportsTab`, `ProfessorReportsTab`, `ExamReportsTab`
- Mesure apres optimisation: `ReportsPage.*.js` tombe d'environ `423.39 kB` a `6.31 kB`
- Le code `recharts` est desormais isole dans un chunk dedie (`PieChart.*.js`, env. `399.29 kB`) charge uniquement quand les graphiques sont demandes
- Le code `pdf-lib` est desormais isole dans un chunk dedie (`index.*.js`, env. `438.21 kB`) charge uniquement lors des generations PDF
- `CertificatePage.*.js` reste leger (env. `13.93 kB`) et `VerifyDocumentPage.*.js` reste leger (env. `6.50 kB`) sans embarquer la pile PDF
- Build validee apres corrections

### 2026-04-03 — Suppression des date pickers lourds sur les formulaires

- `src/pages/admin/students/StudentFormPage.jsx` remplace `DatePicker` par un champ natif `type="date"` pour la date de naissance
- `src/pages/professor/exams/components/ExamScheduling.jsx` remplace `DateTimePicker` par des champs natifs `type="datetime-local"` tout en conservant les conversions ISO
- `src/pages/stages/components/AjouterOffre.jsx` et `src/pages/stages/components/AjouterOffre.tsx` remplacent `DatePicker` par des champs natifs `type="date"`
- `src/pages/stages/StagesPage.jsx` lazy-load maintenant `AjouterOffre` afin de ne pas charger le formulaire de publication pour tous les utilisateurs
- Resultat build: plus aucun chunk `AdapterDateFns.*.js` dans `dist/assets`
- `StagesPage.*.js` tombe d'environ `29.46 kB` a `20.48 kB`
- `ExamFormPage.*.js` tombe d'environ `85.66 kB` a `35.88 kB`
- Le nombre de modules transformes baisse d'environ `14274` a `14055`
- Build validee apres corrections

### 2026-04-03 — Retrait de `Autocomplete` des formulaires actifs

- `src/pages/admin/ProfessorRolesPage.jsx` remplace l'assignation multi-roles par un `Select` multiple avec rendu en `Chip`
- `src/pages/admin/ProfessorCoursesPage.jsx` remplace les selections professeur et cours par des `Select` simples
- `src/pages/admin/DocumentGeneratorPage.jsx` remplace la selection d'etudiant par un `Select`
- `src/pages/stages/components/AjouterOffre.jsx` et `src/pages/stages/components/AjouterOffre.tsx` remplacent la selection d'entreprise par un `Select`
- Audit source effectue: plus aucune occurrence de `Autocomplete` dans `src`
- Verification bundle a rejouer sur une build propre: le `vite build` local est reparti en etat suspendu avant reecriture de `dist`, donc la disparition du chunk `Autocomplete.*.js` n'a pas encore ete mesuree sur artefact final

### 2026-04-03 — Fiabilisation du parcours etudiant actif

- `src/pages/student/SchedulePage.jsx` et `src/pages/student/MessagesPage.jsx` convergent maintenant vers les modules partages deja branches et maintenus
- `src/api/schedule.js` resout correctement les identifiants metier `students.profile_id -> students.id` et `professors.profile_id -> professors.id` avant de lire `student_courses` et `course_sessions`
- `src/pages/schedule/SchedulePage.jsx` affiche maintenant le nom du professeur depuis `professors.profile_id -> profiles.full_name`
- `src/api/grades.js` expose `getStudentPublishedGrades()` et `src/pages/student/GradesPage.jsx` ne depend plus d'un flux legacy ou mock pour l'affichage des notes publiees
- Nouvelle couche `src/api/studentDashboard.js` pour agreger `course_sessions`, `grades`, `news` et `events`
- `src/pages/student/DashboardPage.jsx` ne depend plus de `initializeMockData`, `mockNews`, `mockEvents` ni d'un acces direct `supabase` casse; le dashboard lit maintenant les donnees reelles disponibles
- `src/pages/student/InternshipsPage.jsx` converge vers `src/pages/stages/StagesPage.jsx` afin de retirer un ancien module `internships` non aligne sur le schema courant
- Etat reel apres ce lot: dashboard, planning, notes, messages et redirection stages etudiant sont nettoyes; le module partage `src/pages/stages/StagesPage.jsx` reste encore partiellement mocke pour les offres et candidatures
- Build validee apres corrections

### 2026-04-03 — Branchement reel des cours et stages etudiants

- Nouvelle couche `src/api/stages.js` pour `entreprises`, `stage_offres`, `stage_candidatures` et `stage_entretiens`
- `src/pages/stages/StagesPage.jsx` ne depend plus des jeux `mockOffres`, `mockCandidatures` et `mockEntretiens`; la page charge maintenant les offres reelles, les candidatures de l'etudiant et ses entretiens
- `src/pages/stages/components/AjouterOffre.jsx` charge les entreprises via `src/api/stages.js` et publie de vraies offres par `stage_offres`
- Les candidatures etudiant sont maintenant creees, modifiees et supprimees dans `stage_candidatures`
- `src/pages/student/CoursesPage.jsx` ne retombe plus sur `MOCK_COURSES`; en absence de donnees reelles, la page affiche un etat vide explicite
- `src/pages/student/CoursesPage.jsx` corrige aussi le mapping du semestre depuis `courses.semester` et active le telechargement reel des ressources avec tracage `resource_interactions`
- Etat reel apres ce lot: les stages etudiants sont branches sur des tables reelles; la bibliotheque de cours est reelle mais reste encore partielle sur les statuts de lecture/telechargement par utilisateur
- Build validee apres corrections

### 2026-04-03 — Runtime examen et suivi professeur

- Nouvelle migration `supabase/migrations/20260403_student_exams_attempt_status.sql` pour canoniser `student_exams.attempt_status` et `student_exams.updated_at`
- `src/api/exams.js` etend le runtime canonique pour l'acces etudiant, la soumission d'examen et le monitoring professeur
- `src/pages/exams/student/TakeExamPage.jsx` utilise maintenant le vrai cycle de vie `published/in_progress` au lieu d'attendre un faux statut `active`
- `src/pages/exams/hooks/useQuiz.js` enregistre l'activite dans `active_students`, les incidents dans `cheating_attempts` et la soumission dans `quiz_results` + `student_exams`
- `src/pages/exams/core/Quiz.jsx`, `QuestionCard.jsx`, `QuizNavigation.jsx` et `QuizResults.jsx` ont ete remis en coherence avec le hook runtime reel
- Nouvelle page `src/pages/professor/exams/ExamMonitoringPage.jsx` avec synthese live, participants et incidents
- `src/routes/ProfessorRoutes.jsx` expose la route `/professor/exams/:id/monitor`
- `src/pages/professor/exams/ExamsListPage.jsx` ajoute l'acces au suivi temps reel
- Correctifs runtime sur `ExamGradingPage.jsx`, `GradeQuestionItem.jsx` et `ExamStudents.jsx` pour supprimer les references `supabase` implicites
- Build `npm run build` validee apres integration

## 7. Points Clés à Faire Immédiatement

### 7.1 — ✅ FAIT: Migrations Supabase appliquées (2026-04-03 23h30)

**Migrations appliquées avec succès (16/16):**

- ✅ 20250503_document_tags.sql
- ✅ 20250503_document_templates.sql
- ✅ 20250503_exams_system.sql
- ✅ 20250503_grade_corrections.sql
- ✅ 20250503_initial_schema.sql
- ✅ 20250503_professor_roles.sql
- ✅ 20250503_student_courses.sql
- ✅ 20250504_news_events.sql
- ✅ 20250504102629_add_missing_tables.sql
- ✅ 20260403_add_forums_resources_practice_quizzes.sql
- ✅ 20260403_api_runtime_support.sql
- ✅ 20260403_complete_dynamic_tables.sql
- ✅ 20260403_documents_legacy_compatibility.sql
- ✅ 20260403_grades_canonical.sql
- ✅ 20260403_profile_settings_fields.sql
- ✅ 20260403_student_exams_attempt_status.sql

**Validation post-migration:**
- 49 tables publiques créées dans PostgreSQL
- Schema canonique complet: profiles, exams, exam_results, active_students, cheating_attempts, quiz_results, forums, etc.
- Triggers updated_at actifs
- RLS policies en place
- Outil CLI: `bash scripts/apply-migrations.sh` pour futures migrations

**Commande utilisée:**
```bash
bash scripts/apply-migrations.sh
# Utilise: PostgreSQL direct via psql + credentials Supabase
# Host: db.zsuszjlgatsylleuopff.supabase.co
# User: postgres
```

### 7.2 — Fermeture Phase 2 — Verrou 1: Création d'Examen Complète

**Définition de Done:**
- Créer un examen depuis ExamFormPage.jsx avec tous les types de questions possibles
- Sauvegarder réellement dans student_exams, exam_questions, question_options
- Publier l'examen (status → published)
- Vérifier que la durée, nombre de points, et visibilité sont persistés

**Tests manuels requis:**
1. Créer examen QCM unique (1 bonne réponse)
2. Créer examen QCM multiple (plusieurs bonnes réponses)
3. Créer examen Vrai/Faux
4. Créer examen Réponse courte
5. Créer examen Dissertation
6. Tester la duplication de question
7. Tester l'import depuis la banque de questions
8. Publier et vérifier l'accès étudiant en lecture seule

**Fichiers concernés:**
- `src/pages/professor/exams/ExamFormPage.jsx`
- `src/pages/professor/exams/components/ExamQuestions.jsx`
- `src/api/exams.js`

**État actuel:** Fermé sur le flux actif

### 7.3 — Fermeture Phase 2 — Verrou 2: Correction Manuelle et Automatique

**Définition de Done:**
- Étudiant soumis une copie d'examen (quiz_results + student_exams.attempt_status = submitted)
- Professeur accède à ExamGradingPage.jsx et voit la liste des copies à corriger
- Professeur note chaque question (score/points), ajoute feedback
- Sauvegarde réelle de la note dans exam_results.score et exam_results.graded_by
- Étudiant reçoit notification et voit sa note dans ExamResultsPage.jsx

**Correction automatique (bonus, si temps):**
- Pour QCM, VF, Réponse courte: calcul auto du score d'après les réponses
- Pour Dissertation, Texte à trous: marquer comme "À corriger à la main"
- Barème par question defini au moment de la création

**Tests manuels requis:**
1. Prendre examen complet (étudiant)
2. Attendre fin d'examen (ou forcer submitted)
3. Accéder à GradingPage professeur
4. Noter manuellement chaque question
5. Ajouter feedback général
6. Enregistrer les notes
7. Vérifier notification étudiant
8. Vérifier affichage notes côté étudiant

**Fichiers concernés:**
- `src/pages/professor/exams/ExamGradingPage.jsx`
- `src/pages/professor/exams/components/GradeQuestionItem.jsx`
- `src/api/exams.js`
- `src/pages/exams/student/ExamResultsPage.jsx`

**État actuel:** Fermé sur le flux actif

### 7.4 — Post-Phase-2: Dossier Étudian Numérique

Une fois Phase 2 fermée, passer à Phase 3:
- Dossier administrateur centralisant identité, inscriptions, notes, documents officiels, paiements par étudiant
- Import massif d'étudiants (CSV)
- Activation/suspension comptes
- Génération en masse de bulletins

### 7.5 — ✅ Phase 1 Pages Complétées (2026-04-04)

**Pages créées pour clôturer le parcours étudiant MVP:**
- ✅ `src/pages/student/TranscriptPage.jsx` — Relève de notes officielle téléchargeable en PDF avec statistiques (moyenne, crédits validés, taux validation)
- ✅ `src/pages/student/ReportCardPage.jsx` — Bulletin de notes semestriel avec graphiques, participations et absences
- ✅ `src/pages/student/ProfileSettingsPage.jsx` — Gestion des paramètres de profil, préférences de notification et changement de mot de passe

**Routes intégrées dans StudentRoutes.jsx:**
- `GET /student/transcript` → TranscriptPage (relève de notes officielle)
- `GET /student/report-card` → ReportCardPage (bulletin semestriel)
- `GET /student/profile` → ProfileSettingsPage (paramètres du profil)

**Statut Phase 1:** 10/10 items marqués comme complétés ✅

### 7.6 — ✅ Phase 3 Pages Initiales (2026-04-04)

**Pages créées pour lancer le parcours admin minimum viable:**
- ✅ `src/pages/admin/AdminDashboard.jsx` — Tableau de bord avec 6 statistiques clés (étudiants actifs, professeurs, cours, sections gestion)
- ✅ `src/pages/admin/StudentDetailsPage.jsx` — Dossier étudiant complet avec infos personnelles, notes, assiduité, demandes de correction
- ✅ `src/pages/admin/StudentImportPage.jsx` — Import CSV avec validation, aperçu et rapport de résultats (succès/erreurs/avertissements)

**Routes intégrées dans AdminRoutes.jsx:**
- `GET /admin` → AdminDashboard (entrée du tableau de bord)
- `GET /admin/students/:id` → StudentDetailsPage (consultation dossier étudiant)
- `POST /admin/students/import` → StudentImportPage (import en masse)

**Statut Phase 3:** 3/15 items marqués (20%)

**Prochaines étapes Phase 3 recommandées (priorité):**
1. CRUD Professeurs complets
2. CRUD Départements
3. Activation/suspension de comptes
4. Page audit & historique des modifications

### 7.7 — ✅ Phase 3 CRUD Admin Étendu (2026-04-04 — commit 0791c7db)

**Pages créées pour CRUD Professeurs, Départements et Audit:**
- ✅ `src/pages/admin/ProfessorsListPage.jsx` — Gestion complète des professeurs (CRUD, recherche, assignment dept)
  - Affiche liste avec nom, email, spécialisation, département
  - Formulaire dialog pour ajouter/modifier professeurs
  - Suppression avec confirmation
  - Intégration département (select)
  
- ✅ `src/pages/admin/DepartmentsListPage.jsx` — Gestion des départements (CRUD, hiérarchie)
  - Affiche liste avec nom, code département, responsable
  - Formulaire dialog pour ajouter/modifier départements
  - Selection du chef de département (professeur)
  - Suppression avec confirmation
  
- ✅ `src/pages/admin/AuditLogPage.jsx` — Journal d'audit complet avec filtrage avancé
  - Affichage table avec date, utilisateur, action, ressource, ID, description
  - Filtres multi-critères: action, ressource, date (du/au)
  - Recherche texte (user_id, description, resource_id)
  - Export CSV avec timestamps et descriptions
  - Couleurs par type d'action et ressource

**Routes intégrées dans AdminRoutes.jsx:**
- `GET /admin/professors` → ProfessorsListPage (gestion professeurs)
- `GET /admin/departments-list` → DepartmentsListPage (gestion départements)  
- `GET /admin/audit-log-new` → AuditLogPage (consulter audit log)

**TypeScript Validation:** ✅ Zéro erreur (0 warnings)
- Corrections appliquées: imports alias `@/supabase`, InputProps pour MUI TextField startAdornment
- Build complet validé: `dist/index.html` généré avec succès

**Statut Phase 3:** 6/15 items marqués (40%)

**Prochaines étapes Phase 3 recommandées (priorité):**
1. Activation/suspension de comptes étudiant
2. CRUD Filières/Niveaux/Semestres  
3. CRUD Matières avec coefficients/crédits
4. Templates de documents officiels

---

### 2026-04-04 — Verification QR et rapport d'integrite professeur

- `src/pages/public/VerifyDocumentPage.jsx` reste la route publique de verification des documents officiels via reference/QR
- `src/pages/professor/exams/IntegrityReportPage.jsx` est maintenant branche sur une vraie route professeur `/professor/exams/:id/integrity`
- `src/routes/ProfessorRoutes.jsx` expose cette route et `src/pages/professor/exams/ExamsListPage.jsx` ajoute l'action directe depuis la liste des examens
- `src/pages/professor/exams/ExamMonitoringPage.jsx` ajoute aussi un acces direct au rapport d'integrite
- `src/api/security.js` agrege correctement `student_exams`, `cheating_attempts` et `quiz_results` avec les vraies colonnes runtime (`completion_time`, `timestamp`, `detected_at`) et les noms de profil
- `supabase/migrations/20260404_phases_3_4_5_complete.sql` a ete corrigee pour typer `integrity_reports.exam_id` comme `INTEGER` coherent avec `exams.id`
- Correction au passage d'un bug runtime dans `src/pages/exams/hooks/useQuiz.js` qui appelait un helper de gradabilite avec un mauvais nom

---

### 7.9 — ✅ Module Examens Mixtes Stabilisé (2026-04-04)

**Objectif fermé sur le flux actif professeur → étudiant → correction:**
- ✅ Un examen peut désormais combiner plusieurs types de questions dans le même sujet sur le flux actif:
  - `qcm_single`
  - `qcm_multiple`
  - `true_false`
  - `short_answer`
  - `long_answer`
  - `numeric`
- ✅ Contrat unique de sérialisation/normalisation ajouté dans `src/utils/examQuestionUtils.js`
- ✅ Le builder professeur actif `src/pages/professor/exams/components/ExamQuestions.jsx` gère maintenant ces types sans retomber sur l’ancien modèle `multiple_choice / essay`
- ✅ `src/pages/professor/exams/ExamFormPage.jsx` enregistre et recharge correctement les réponses correctes complexes (QCM multiple, numérique avec tolérance, dissertation)
- ✅ Le runtime étudiant n’instancie plus plusieurs hooks de quiz concurrents:
  - `src/pages/exams/core/Quiz.jsx`
  - `src/pages/exams/core/QuestionCard.jsx`
  - `src/pages/exams/core/QuizNavigation.jsx`
  - `src/pages/exams/core/QuizResults.jsx`
- ✅ Le passage étudiant supporte correctement les réponses:
  - index unique pour QCM simple
  - tableau d’indices pour QCM multiple
  - vrai/faux
  - texte court / texte long
  - numérique avec tolérance
- ✅ La correction professeur pré-remplit maintenant les notes auto-corrigeables pour éviter de re-noter manuellement les QCM/numériques
- ✅ La page résultats étudiant `src/pages/exams/student/ExamResultsPage.jsx` a été réalignée sur les tables canoniques `student_exams`, `quiz_results`, `exam_grades`
- ✅ La route étudiante `src/routes/StudentRoutes.jsx` n’injecte plus de faux résultat stub
- ✅ Build de validation réussi: `npm run build`

**Mise à jour complémentaire 2026-04-04:**
- Les types avancés `matching`, `ordering`, `fill_blank` et `image_question` ont depuis été activés sur le builder professeur actif et raccordés au scoring/affichage partagés du flux étudiant/professeur.

---

### 7.8 — ✅ Phase 3 CRUD Admin Étendu (2026-04-04 — commit 2eea26f6)

**Pages créées pour gestion statut comptes, niveaux/semestres et matières:**
- ✅ `src/pages/admin/AccountStatusPage.jsx` — Gestion du cycle de vie des comptes étudiants
  - CRUD statut (actif ↔ suspendu → diplomé/radié)
  - Table avec statut code (couleur Chip), étudiant, email, ID
  - Dialog selection nouveau statut + champ raison (audit trail)
  - Filtre par nom/email/ID + filtre statut
  - Audit log automatique pour chaque changement de statut
  - Données réelles: students, profiles, audit_log
  
- ✅ `src/pages/admin/LevelsAndSemestersPage.jsx` — Configuration structure académique avec interface à onglets
  - Tab 1: Gestion des filières/niveaux
    - Affiche L1 → M2 avec codes courts (L1, L2, L3, M1, M2)
    - CRUD niveaux (création/modification)
    - Affiche nombre étudiants par niveau
  - Tab 2: Gestion des semestres
    - CRUD semesters (création/modification)
    - Date début/fin avec formatage fr-FR
    - Toggle isActive (Chip couleur)
    - Recherche filtre
  - Données réelles: students (pour levels), grades (pour semesters)
  
- ✅ `src/pages/admin/SubjectsPage.jsx` — Gestion complète matières/cours avec attributs financiers
  - Affichage table: Code (Chip), Nom, Crédits (badge), Coefficient (badge), Semestre, Département
  - CRUD complet: créer/modifier/supprimer matières
  - Champs: code, nom, description, crédits (int), coefficient (float), semestre (int), département
  - Recherche par code ou nom (real-time, case-insensitive)
  - Select dropdown pour department_id
  - Données réelles: courses, departments join, validation nombres
  
**Routes intégrées dans AdminRoutes.jsx:**
- `GET /admin/account-status` → AccountStatusPage (gestion statuts)
- `GET /admin/levels-semesters` → LevelsAndSemestersPage (configuration académique)
- `GET /admin/subjects` → SubjectsPage (gestion matières)

**TypeScript Validation & Build:**
- ✅ Corrections appliquées:
  1. Chip color type error ~ switch statement hardcoded MUI colors (success/warning/info/error)
  2. Calendar icon missing ~ changed to EventNote (MUI icons-material)
  3. Unused ref removed from AccountStatusPage
- ✅ Build réussi après cache cleanup (49.51s): dist/index.html généré avec succès
- ✅ Zéro erreurs TypeScript après corrections

**Statut Phase 3:** 9/15 items marqués (60%) — **+3 pages creées**
- ✅ Admin Dashboard
- ✅ Student CRUD (StudentDetailsPage + StudentImportPage)  
- ✅ Professeurs CRUD (ProfessorsListPage)
- ✅ Départements CRUD (DepartmentsListPage)
- ✅ Audit Log (AuditLogPage)
- ✅ **[NOUVEAU] Statut comptes**
- ✅ **[NOUVEAU] Niveaux & Semestres**
- ✅ **[NOUVEAU] Matières & Coefficients**

**Prochaines étapes Phase 3 recommandées (priorité):**
1. Templates de documents officiels
2. File d'attente de validation des documents
3. Génération en masse de bulletins (BulkBulletinPage — partiellement existant)
4. Dépôt manuel documents dans dossier étudiant
5. Rapports et exports (ReportsPage — partiellement existant)
6. Paiements (PaymentsPage — partiellement existant)

---

### 2026-04-04 — Reprise canonique du lot A Phase 3

- `src/pages/admin/AccountStatusPage.jsx` a été réaligné sur `students + profiles`
  - statuts canoniques: `active`, `suspended`, `graduated`, `withdrawn`
  - activation du compte synchronisée via `profiles.is_active`
  - audit branché via `src/api/admin.js`
- `src/pages/admin/ProfessorsListPage.jsx` ne manipule plus un faux modèle plat `professors.full_name/email/...`
  - CRUD branché sur `src/api/users.js`
  - lecture réelle `profiles + professors`
  - création avec restitution du mot de passe temporaire retourné par `createUser`
- `src/pages/admin/LevelsAndSemestersPage.jsx` ne fait plus d’accès direct Supabase
  - niveaux et semestres pilotés par `src/api/admin.js`
  - ajout du 3e onglet `Maquettes`, manquant jusqu’ici dans le parcours admin
- `src/pages/admin/SubjectsPage.jsx` a été recentrée sur le vrai modèle métier
  - `courses` ne porte plus de faux champ `coefficient`
  - les coefficients affichés viennent désormais de `curriculum_templates`
  - édition matière recentrée sur `code, nom, crédits, niveau, semestre, département, description`
- `src/api/users.js` a été renforcé pour remonter et maintenir les métadonnées `students` / `professors`
- `src/api/admin.js` expose maintenant les helpers canoniques pour:
  - cycle de vie des comptes étudiants
  - niveaux académiques
  - semestres académiques
  - maquettes pédagogiques
- `supabase/migrations/20260404_phases_3_4_5_complete.sql` a été corrigée pour supprimer plusieurs FK incohérentes en `UUID` vers des tables `INTEGER`
- Vérification:
  - plus d’import direct `supabase` dans `AccountStatusPage`, `ProfessorsListPage`, `LevelsAndSemestersPage`, `SubjectsPage`
  - `npm run build` validé après réalignement canonique du lot A

---
