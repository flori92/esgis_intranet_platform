# ESGIS Campus — Schema Canonique

Ce document fixe la cible de schema a utiliser pour les prochains chantiers.

## 1. Decision

Source de verite retenue:

- `supabase/migrations/`

Source legacy a ne plus etendre:

- `migrations/supabase_migration.sql`
- `migrations/apply_migration_web.js`

Raison:

- `supabase/migrations/` est la source la plus proche du produit actuel par domaine
- elle contient les extensions deja alignees avec plusieurs modules reels: examens, documents, roles professeur, stages, actualites/evenements
- le fichier `migrations/supabase_migration.sql` decrit un autre modele applicatif, plus plat et concurrent, qui entre en conflit avec le modele `profiles -> students/professors`

## 2. Modele D'Identite Canonique

Le modele a suivre cote front et cote SQL est:

- `auth.users`
- `profiles`
- `students`
- `professors`

Regles:

- l'utilisateur connecte est identifie par `profiles.id` qui est un UUID aligne sur `auth.users.id`
- `students.profile_id` pointe vers `profiles.id`
- `professors.profile_id` pointe vers `profiles.id`
- les tables metier academiques utilisent ensuite les IDs metier `students.id` et `professors.id` quand elles representent une inscription, une affectation ou une participation academique

Consequences front:

- `authState.user.id` sert d'ID d'authentification
- `authState.profile.id` sert d'ancre identite applicative
- `authState.student.id` et `authState.professor.id` servent d'IDs metier secondaires quand une table attend un etudiant ou un professeur academique

## 3. Tables Canoniques Par Domaine

### 3.1 Structure Academique

- `departments`
- `profiles`
- `students`
- `professors`
- `courses`
- `professor_courses`
- `student_courses`
- `course_sessions`
- `attendances`

### 3.2 Examens

- `exam_centers`
- `exam_sessions`
- `exams`
- `exam_questions`
- `student_exams`
- `exam_supervisors`
- `exam_incidents`
- `exam_grades`

### 3.3 Documents

- `documents`
- `document_templates`
- `generated_documents`
- `document_tags`

### 3.4 Communication

- `notifications`
- `events`
- `news`
- `messages`
- `requests`
- `forums`
- `forum_posts`
- `forum_replies`
- `forum_likes`

### 3.5 Stages

- `entreprises`
- `stage_offres`
- `stage_candidatures`
- `stage_entretiens`
- `internships`

Note:

- `internships` existe deja dans `20250503_initial_schema.sql`
- le module "offres de stages" du front doit converger vers `stage_offres` et ses tables associees

### 3.6 Ressources Pedagogiques Et Quiz

- `course_chapters`
- `course_resources`
- `resource_interactions`
- `practice_quizzes`
- `practice_quiz_attempts`

### 3.7 Paiements Et Corrections

- `payment_records`
- `demandes_correction_notes`

## 3.b Exception De Modele A Respecter

Les nouvelles tables ajoutees le `2026-04-03` suivent une convention differente des tables academiques historiques:

- `forums`, `forum_posts`, `forum_replies`, `forum_likes`
- `course_resources`, `resource_interactions`
- `practice_quizzes`, `practice_quiz_attempts`
- `payment_records`
- `demandes_correction_notes`

Regle:

- leurs FKs utilisateur pointent vers `profiles.id` en UUID
- elles ne pointent pas vers `students.id` ou `professors.id` sauf si une evolution ulterieure le decide explicitement

Consequence frontend:

- pour ces domaines, utiliser prioritairement `authState.profile.id`
- ne pas injecter `authState.student.id` ou `authState.professor.id` dans ces tables sans mapping explicite

## 4. Divergences Critiques Detectees

### 4.1 Deux modeles concurrents pour les relations etudiant/professeur

`supabase/migrations/20250503_initial_schema.sql` utilise:

- `students.id` et `professors.id` en `SERIAL`
- `students.profile_id` et `professors.profile_id` comme lien vers `profiles`

`migrations/supabase_migration.sql` utilise au contraire:

- `student_courses.student_id` en UUID vers `profiles.id`
- `professor_courses.professor_id` en UUID vers `profiles.id`
- `exams.professor_id` en UUID vers `profiles.id`

Decision:

- conserver le modele `profiles -> students/professors`
- ne plus brancher de nouvelles pages sur le modele UUID direct de `migrations/supabase_migration.sql`

### 4.2 Migration `add_missing_tables` invalide par type

`supabase/migrations/20250504102629_add_missing_tables.sql` cree plusieurs FKs incoherentes:

- `schedule.student_id UUID REFERENCES students(id)` alors que `students.id` est un entier
- `schedule.professor_id UUID REFERENCES professors(id)` alors que `professors.id` est un entier
- `stage_offres.professeur_id UUID REFERENCES professors(id)` alors que `professors.id` est un entier
- `stage_candidatures.etudiant_id UUID REFERENCES students(id)` alors que `students.id` est un entier

Decision:

- cette migration ne doit pas etre prise telle quelle comme verite finale
- ses domaines fonctionnels sont conserves
- ses types et relations doivent etre corriges avant execution sur un environnement propre

### 4.3 Noms de tables divergents entre UI et schema

Cas identifies:

- `offres_stage` dans `src/pages/admin/InitializeDataPage.jsx`
- `stage_offres` dans `supabase/migrations/20250504102629_add_missing_tables.sql`

- `actualites` dans `src/pages/admin/InitializeDataPage.jsx`
- `news` dans `supabase/migrations/20250504_news_events.sql`

- `schedules` dans `src/pages/admin/InitializeDataPage.jsx`
- `schedule` dans `supabase/migrations/20250504102629_add_missing_tables.sql`
- `course_sessions` dans `supabase/migrations/20250503_initial_schema.sql`

- `exam_students` dans les anciennes copies legacy `src/pages/exams/professor/*` maintenant supprimees
- `student_exams` dans `supabase/migrations/20250503_student_courses.sql`

Decision:

- `stage_offres` est le nom canonique
- `news` est le nom canonique
- `student_exams` est le nom canonique
- pour le planning, `course_sessions` doit devenir la base institutionnelle; `schedule` ne doit rester qu'en compatibilite si necessaire

### 4.4 Tables utilisees par le front mais absentes du schema canonique

Usages front detectes sans table canonique correspondante dans `supabase/migrations/`:

- `exam_students`
- `student_answers`
- `documents_public`
- `conversations`
- `files`
- `quiz_questions`
- `actualites`
- `schedules`
- `classrooms`
- `offres_stage`

Interpretation:

- certaines viennent d'anciens prototypes
- certaines devraient etre remplacees par des tables canoniques existantes
- certaines devront etre explicitement creees si le workflow est conserve

## 5. Remplacements A Appliquer Cote Front

### 5.1 Remplacements immediats

- `exam_students` -> `student_exams`
- `offres_stage` -> `stage_offres`
- `actualites` -> `news`

### 5.2 Cas a refactorer plutot qu'a renommer

- `student_answers`
  le schema canonique stocke deja `student_exams.answers` pour les reponses et `exam_grades` pour la notation par question

- `schedules`
  le produit doit converger vers `course_sessions` pour les seances de cours et `events` pour les evenements institutionnels

- `conversations`
  le schema canonique contient `messages`, pas de moteur conversationnel autonome aujourd'hui

- `documents_public`
  le schema canonique contient `documents`; si une vue publique est necessaire, elle devra etre creee explicitement comme vue SQL et non supposee par le front

- `files`
  le stockage de fichiers doit passer par Supabase Storage; une table metadata dediee doit etre specifiee si l'UI en depend reellement

## 6. Ordre D'Execution Recommande

1. Corriger les pages front qui pointent vers des tables non canoniques
2. Reparer ou remplacer la migration `20250504102629_add_missing_tables.sql`
3. Geler `migrations/supabase_migration.sql` comme archive legacy
4. Ajouter, si besoin, des vues de compatibilite temporaires uniquement pour les modules non encore refactorises

## 7. Priorite Technique Immediate

Les prochains correctifs schema/front doivent cibler en premier:

- `src/pages/admin/InitializeDataPage.jsx`
- `src/pages/professor/exams/ExamFormPage.jsx`
- `src/pages/professor/exams/ExamsListPage.jsx`
- `src/pages/professor/exams/ExamGradingPage.jsx`
- `src/pages/messages/MessagesPage.jsx`
- `src/pages/documents/DocumentsPage.jsx`

Ce document complete:

- `docs/ESGIS_Campus_specification_fonctionnelle_complete.md`
- `docs/ESGIS_Campus_gap_analysis.md`
- `docs/ESGIS_Campus_execution_tracker.md`
