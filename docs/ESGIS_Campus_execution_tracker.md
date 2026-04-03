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
- [ ] Aligner les noms de tables utilises par l'UI et les migrations
- [x] Unifier authState, profile, student, professor, roles
- [x] Corriger les routes et menus casses
- [x] Brancher uniquement des pages existantes et exploitables
- [ ] Identifier et supprimer les dead paths
- [ ] Reduire les fallbacks silencieux
- [ ] Stabiliser les politiques RLS minimales

Definition of done:

- aucune navigation principale ne mene vers une page inexistante
- aucun role n'utilise un modele d'identite different selon la page
- le projet compile et les parcours principaux sont coherents

### Phase 1 — Parcours Etudiant MVP Fiable

Objectif: livrer un espace etudiant utilisable en production.

- [x] Dashboard etudiant sur donnees reelles
- [ ] Mes cours / bibliotheque pedagogique structuree
- [x] Emploi du temps fiable
- [x] Notes et moyennes sur donnees reelles
- [x] Certificat de scolarite officiel fiable
- [ ] Releve de notes officiel PDF
- [ ] Bulletin semestriel officiel
- [x] Historique des documents generes
- [x] Stages: consultation et candidatures reelles
- [x] Messagerie et notifications stables
- [ ] Profil et preferences de base

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
- [ ] Creation d'examen complete
- [x] Suivi temps reel des examens
- [ ] Correction manuelle et automatique
- [x] Suivi des promotions et fiches etudiants
- [x] Communication ciblee

Definition of done:

- un professeur peut enseigner, evaluer et communiquer integralement depuis la plateforme

### Phase 3 — Parcours Administration MVP Fiable

Objectif: livrer les workflows institutionnels critiques.

- [ ] Dossier etudiant numerique complet
- [ ] Creation/import massif d'etudiants
- [ ] Activation/suspension comptes
- [ ] Gestion professeurs complete
- [ ] Filieres, niveaux, semestres, maquettes
- [ ] Matieres, coefficients, credits
- [ ] Templates de documents officiels
- [ ] File d'attente de validation
- [ ] Generation en masse de bulletins
- [ ] Depot manuel de documents dans un dossier etudiant
- [ ] Offres de stages et partenaires
- [ ] Calendrier institutionnel
- [ ] Communication institutionnelle
- [ ] Rapports et exports fiables
- [ ] Paiements et recus

Definition of done:

- l'administration peut gerer le cycle academique sans workflow papier principal

### Phase 4 — Securite, Integrite Et Conformite

Objectif: rendre le systeme defendable et auditable.

- [ ] QR verification publique des documents
- [ ] Historique des modifications de notes
- [ ] Audit log transverse
- [ ] OTP / verification renforcee avant examen
- [ ] 2FA administration
- [ ] Anti-triche navigateur renforce
- [ ] Rapport d'integrite examen
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

- [ ] Audit final des routes/menu
- [x] Reparation des chemins incoherents
- [x] Branchement des pages existantes mais non routees lorsque pertinentes
- [x] Suppression ou report des entrees de menu vers des modules inexistants
- [ ] Cartographie des pages orphelines

### Chantier B — Data Model Unification

- [x] Definir les objets frontend canoniques: user, profile, student, professor, admin
- [x] Corriger les pages qui supposent des champs absents
- [ ] Normaliser l'acces aux IDs metier

### Chantier C — Schema Canonique

- [x] Choisir `supabase/migrations/` comme source de verite ou fusionner proprement
- [x] Documenter les tables cibles par domaine
- [ ] Aligner les noms de tables utilises dans le front

## 4. Definition Des Modules A Geler

Tant que Phase 0 n'est pas terminee, ne pas etendre fonctionnellement:

- super admin
- mobile natif
- forums
- integrations SMS

## 5. Statut Actuel

Date de reference: 2026-04-03

- Phase 0: en cours
- Phase 1: partiellement en cours
- Phase 2: partiellement en cours via examens, dashboard et ressources reelles
- Phase 3: partiellement en cours via CRUD admin
- Phase 4: non demarree
- Phase 5: non demarree

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
- `src/pages/exams/components/ExamScheduling.jsx` remplace aussi `DateTimePicker` par `type="datetime-local"`
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
- Correctifs runtime sur `ExamGradingPage.jsx`, `GradeQuestionItem.jsx`, `ExamStudents.jsx` et `StudentAnswersList.jsx` pour supprimer les references `supabase` implicites
- Build `npm run build` validee apres integration
