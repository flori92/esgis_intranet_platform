# ESGIS Campus — Couverture API et Migrations

Date de reference: 2026-04-03

## 1. Constats

- Le repo ne contient pas de backend HTTP dedie.
- La surface "API" du projet est composee de:
  - routes frontend dans `src/App.jsx` et `src/routes/*`
  - wrappers Supabase dans `src/api/*`
  - quelques acces directs a Supabase encore presents hors `src/api`

## 2. Etat De Couverture Actuel

### 2.1 Routes frontend

Couvertes et actives:

- `/admin/*`
- `/student/*`
- `/professor/*`
- `/stages/*`
- `/schedule`
- `/grades`
- `/documents`
- `/messages`
- `/notifications`
- `/profile`
- `/forums`
- `/verify/:reference`

### 2.2 Wrappers `src/api` realignes ou couverts par migrations

Couverture correcte ou nettement amelioree:

- `auth.js`
- `announcements.js`
- `admin.js`
- `calendar.js`
- `courses.js`
- `documents.js`
- `forums.js`
- `grades.js`
- `notifications.js`
- `partners.js`
- `profile.js`
- `payments.js`
- `questionBank.js`
- `quiz.js`
- `users.js`

Actions appliquees:

- realignement sur `courses`, `student_courses`, `course_sessions`, `events`, `payment_records`, `payments`
- realignement `practice_quizzes` / `practice_quiz_attempts`
- realignement `forums.course_id`
- remplacement du bloc legacy `cours` / `inscriptions` / `notes` par `grades`
- realignement des demandes de correction sur `demandes_correction_notes`
- centralisation des notifications sur `recipient_id`, `recipient_role`, `content`, `priority`, `read`
- centralisation des documents sur `documents`, `document_tags`, `generated_documents` et le stockage Supabase
- centralisation des parametres de profil et du mot de passe dans `profile.js`
- realignement de la gestion utilisateurs sur `profiles.is_active`, `students.profile_id`, `professors.profile_id`
- correction des contrats de retour `api/quiz` pour exposer `data`
- ajout des fonctions RPC manquantes et des tables runtime de compatibilite

### 2.3 Tables / fonctions ajoutees pour couvrir les usages reels

Nouvelles migrations ajoutees:

- `supabase/migrations/20260403_add_forums_resources_practice_quizzes.sql`
- `supabase/migrations/20260403_api_runtime_support.sql`
- `supabase/migrations/20260403_grades_canonical.sql`
- `supabase/migrations/20260403_profile_settings_fields.sql`

Couvertures ajoutees par migration runtime:

- `active_students`
- `cheating_attempts`
- `quiz_results`
- `increment_download_count(uuid)`
- `increment_post_likes(uuid)`
- `decrement_post_likes(uuid)`
- `increment_reply_likes(uuid)`
- `decrement_reply_likes(uuid)`
- `get_exam_class_statistics(integer)`
- index de coherence pour `resource_interactions`
- index de coherence pour `forum_likes`

Couvertures ajoutees pour les notes:

- table canonique `grades`
- trigger de correction sur `demandes_correction_notes`
- politiques RLS minimales pour `grades`
- correction de la migration historique `20250503_grade_corrections.sql` pour supprimer la dependance a `notes`

## 3. Ecart Restant

Audit automatique post-correctifs sur `src/api/*` vs `supabase/migrations/*`:

- tables encore referencees sans migration canonique:
  - aucune
- fonctions RPC manquantes:
  - aucune

Interpretation:

- les wrappers `src/api/*` sont maintenant couverts par des tables/fonctions presentes dans `supabase/migrations/*`
- le point restant n'est plus `src/api`, mais les acces directs hors couche API

## 4. Modules Encore Partiels

### 4.1 Acces directs a Supabase hors `src/api`

Des acces directs restent presents notamment dans:

- `src/hooks/useSupabaseAuth.js`
- `src/components/dashboard/*`
- quelques pages/modules historiques hors couche `src/api`

Interpretation:

- ce n'est plus un probleme de migration manquante cote `src/api`
- mais ce n'est pas encore une centralisation complete de la couche d'acces aux donnees
- certains de ces ecrans utilisent encore des champs legacy ou des conventions heterogenes

## 5. Conclusion Operationnelle

Oui pour la couche `src/api` et les migrations qu'elle consomme.

Non si l'on parle de toute la surface du front, car des pages interrogent encore Supabase directement hors `src/api`.

Apres les correctifs du 2026-04-03:

- tous les wrappers `src/api` utilises par le produit sont maintenant couverts par des migrations existantes
- le bloc legacy notes professeur a ete remplace par une table canonique `grades`
- les RPC manquantes ont ete eliminees
- la build frontend passe
- le prochain chantier de couverture complete concerne surtout `useSupabaseAuth` et les modules historiques encore hors `src/api`
