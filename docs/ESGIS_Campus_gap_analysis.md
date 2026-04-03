# ESGIS Campus — Gap Analysis

Ce document compare la specification cible definie dans [ESGIS_Campus_specification_fonctionnelle_complete.md](/Users/floriace/ESGIS/esgis_intranet_platform/docs/ESGIS_Campus_specification_fonctionnelle_complete.md) avec l'etat reel du codebase.

## 1. Resume Executif

Le projet dispose deja d'une base exploitable:

- authentification par role
- layout principal role-based
- routes et espaces distincts admin / professeur / etudiant
- base de gestion academique (departements, cours, etudiants, assignations)
- module examens deja tres avance
- premiers modules documents, notifications, messagerie et stages

En revanche, l'etat actuel reste loin de la cible ESGIS Campus complete:

- plusieurs modules critiques sont encore portes par des donnees mock ou des fallbacks
- certaines routes/menu pointent vers des pages inexistantes ou non branchees
- le modele de donnees et le modele d'authentification sont incoherents selon les ecrans
- le role Super Administrateur est absent
- les workflows les plus strategiques de production ne sont pas encore complets: paiements, validation de documents, verification publique par QR code, forum, 2FA/OTP, notifications multi-canal, audit log, mobile

Conclusion:

- le projet n'est pas a reprendre de zero
- il doit d'abord etre stabilise comme produit web role-based coherent
- ensuite les ecarts fonctionnels doivent etre fermes par vagues, en commencant par les fondations techniques et les parcours metier a plus forte valeur

## 2. Diagnostic Global

### 2.1 Forces deja presentes

- Architecture React/Vite/Supabase deja en place
- Separation des roles deja visible dans les routes et le layout
- CRUD admin deja reele sur plusieurs entites
- Module examens professeur/etudiant deja structure autour de vraies tables
- Templates et documents generes deja presents dans les migrations et l'UI admin
- Notifications et messagerie deja entamees

### 2.2 Faiblesses majeures

- Multiples ecrans utilisent des donnees mock: tableaux de bord, stages, certains ecrans etudiants, pages professeur secondaires
- Incoherences de navigation: certaines routes affichees dans le menu ne sont pas implementees
- Incoherences de modele: certains ecrans utilisent `authState.user.id`, d'autres `authState.student.id`, d'autres supposent `authState.professor` alors que ce champ n'est pas alimente partout
- Plusieurs ensembles de migrations/schema coexistent avec des noms de tables differents
- Le produit cible de la specification depasse nettement le perimetre reel actuellement branche

### 2.3 Risques structurels

- Dette de schema Supabase et RLS
- Dette de navigation et de routage
- Dette d'integration des donnees reelles
- Dette securite et conformite
- Dette UX sur les workflows transversaux

## 3. Etat Par Domaine Fonctionnel

Statuts:

- `OK`: base deja exploitable
- `PARTIEL`: implementation existante mais incomplete ou instable
- `ABSENT`: fonctionnalite cible non implementee

### 3.1 Fondations Plateforme

| Domaine | Etat | Commentaire |
| --- | --- | --- |
| Authentification par role | PARTIEL | Role-based present, mais logique d'identite incoherente selon les pages |
| Layout responsive web | PARTIEL | Base desktop/mobile presente, mais menus et routes pas totalement alignes |
| Mobile natif iOS/Android | ABSENT | Aucun projet mobile natif dans le repo |
| Internationalisation FR/EN | ABSENT | Interface majoritairement en francais uniquement |
| Accessibilite WCAG 2.1 | ABSENT | Pas de strategie explicite ni d'audit accessibilite |
| 2FA / OTP / biometrie | ABSENT | Rien de branche en auth ou examens |
| Audit log | ABSENT | Pas de journal transverse des actions sensibles |
| Monitoring / supervision | ABSENT | Pas de module produit pour cela |

### 3.2 Profil Etudiant

| Domaine | Etat | Commentaire |
| --- | --- | --- |
| Dashboard etudiant | PARTIEL | Existe, mais depend largement de mock/fallback |
| Bibliotheque de cours personnelle | PARTIEL | Documents et filtres existent, mais pas de vrai module "Mes cours" organise par matiere/chapitre |
| Recherche de ressources | PARTIEL | Recherche documents existante, mais perimetre limite |
| Calendrier / emploi du temps | PARTIEL | Vue presente, donnees reelles partielles selon les ecrans |
| Export PDF / iCal agenda | ABSENT | PDF partiel selon pages, iCal absent |
| Notes et resultats | PARTIEL | Plusieurs pages existent, certaines avec vraies requetes, d'autres avec mock |
| Historique academique complet | ABSENT | Pas de vrai parcours complet multi-semestres expose |
| Examens en ligne | PARTIEL/AVANCE | Liste, passage, resultats, correction cote prof existent; OTP, anti-triche complet et experience cible non finalises |
| Documents officiels auto-service | PARTIEL | Certificat de scolarite existe; releves, bulletins, attestations officielles avec validation/QR non finalises |
| Verification publique par QR code | ABSENT | Aucun endpoint/page publique dediee |
| Offres stages & emplois | PARTIEL | Module visible, mais largement mock |
| Messagerie | PARTIEL | Interface existe, modele conversationnel a stabiliser |
| Fil d'annonces | PARTIEL | Notifications/evenements existent, fil unifie non finalise |
| Forums par matiere | ABSENT | Aucun module forum branche |
| Profil et parametres | ABSENT | Pas de page metier finalisee ni de workflow complet de preferences |

### 3.3 Profil Professeur

| Domaine | Etat | Commentaire |
| --- | --- | --- |
| Dashboard professeur | PARTIEL | Ecran present, mais donnees mock |
| Gestion des ressources pedagogiques | PARTIEL | Pages et composants existent, mais pas encore la cible complete par matiere/chapitre/syllabus/statistiques |
| Gestion des notes | PARTIEL | Correction d'examen presente; gradebook complet CC + import Excel + revue avant publication absent |
| Creation d'examens en ligne | OK/PARTIEL | Base forte deja presente |
| Suivi en temps reel des examens | PARTIEL | Quelques bases dans le module, mais pas la vision cible temps reel complete |
| Banque de questions | ABSENT | Pas de module metier visible dedie |
| Suivi des etudiants / promotions | PARTIEL | Idees presentes, pages non finalisees ou non branchees |
| Gestion calendrier personnel | PARTIEL | Planning partage existe, pas de workflow d'absence/echange |
| Messagerie et annonces ciblees | PARTIEL | Messagerie partagee existe, annonces ciblees et moderation forum absentes |

### 3.4 Profil Administration

| Domaine | Etat | Commentaire |
| --- | --- | --- |
| Dashboard administratif | PARTIEL | Plusieurs dashboards/admin variants coexistent; perimetre produit a unifier |
| Gestion des etudiants | OK/PARTIEL | CRUD, detail, export CSV presents; import massif, dossier numerique complet et statut financier manquent |
| Gestion des professeurs | PARTIEL | Roles et assignations existent; gestion complete du lifecycle professeur manque |
| Structure academique | PARTIEL | Departements, cours, affectations existent; filieres, niveaux, maquettes, coefficients restent incomplets |
| Documents officiels | PARTIEL | Templates/generation presents; workflow de validation, generation de masse et verification publique incomplets |
| Stages & partenariats | PARTIEL | Donnees, scripts et UI initiales existent; workflow complet entreprise/candidatures a finaliser |
| Calendrier institutionnel | PARTIEL | Evenements et sessions existent; planification institutionnelle complete manque |
| Communication institutionnelle | PARTIEL | Notifications et annonces possibles partiellement |
| Rapports & exports | PARTIEL | Rapports admin presents, mais couverture metier inegale |
| Paiements | ABSENT/PARTIEL | Tables presentes dans le schema, UI produit non livree |

### 3.5 Profil Super Administrateur

| Domaine | Etat | Commentaire |
| --- | --- | --- |
| Role super admin | ABSENT | Aucune route ni interface dediee |
| Gestion fine des roles globaux | PARTIEL | Debut cote professor roles, pas de RBAC systemique complet |
| Configuration systeme | ABSENT | Pas de module produit operationnel |
| Audit log | ABSENT | Non implemente |
| Monitoring | ABSENT | Non implemente |
| Sauvegardes | ABSENT | Non implemente cote produit |

## 4. Ecarts Techniques Critiques

### 4.1 Navigation et routage

Problemes identifies:

- routes affichees dans le menu sans page reelle
- pages presentes dans `src/pages` non branchees dans les routes
- incoherences de chemins entre boutons, menus et routes declarees

Impact:

- experience utilisateur fragile
- fonctionnalites invisibles ou inaccessibles
- dette de maintenance elevee

### 4.2 Modele d'authentification et d'identite

Problemes identifies:

- certaines pages supposent un objet `authState.student`
- d'autres utilisent directement `authState.user.id`
- certaines pages supposent un objet `authState.professor` qui n'est pas toujours alimente

Impact:

- erreurs runtime
- requetes incoherentes
- difficulte a securiser proprement les acces

### 4.3 Schema et migrations

Problemes identifies:

- plusieurs sources de verite: `migrations/`, `supabase/migrations/`, `scripts/`
- tables equivalentes sous noms differents selon les ecrans (`stage_offres` vs `offres_stage`, `news` vs `actualites`, etc.)
- risque de divergence entre l'UI et le schema reel

Impact:

- integration Supabase instable
- RLS difficile a fiabiliser
- livraison production risquee

### 4.4 Donnees mock et fallbacks

Problemes identifies:

- dependance importante aux mocks dans les dashboards et modules secondaires
- certaines pages basculent silencieusement en fallback au lieu d'exposer clairement l'etat reel

Impact:

- faux sentiment d'avancement
- faible confiance produit
- tests utilisateurs peu fiables

## 5. Priorites Produit Recommandees

### Priorite 0 — Stabilisation du socle

- definir une source de verite unique du schema
- unifier le modele auth/profil/role
- corriger les routes et menus casses
- eliminer les incompatibilites les plus bloquantes

### Priorite 1 — Verticale Etudiant de base

- dashboard rebranche sur donnees reelles
- emploi du temps fiable
- notes fiables
- documents officiels prioritaires: certificat, releve, bulletin

### Priorite 2 — Verticale Professeur de production

- depot de ressources pedagogiques reel
- gradebook complet
- examens et correction finalises

### Priorite 3 — Verticale Administration de production

- cycle de vie etudiant/professeur
- structure academique complete
- documents officiels et validations
- partenariats/stages

### Priorite 4 — Securite et conformite

- QR verification publique
- 2FA/OTP
- audit log
- notifications multi-canal

### Priorite 5 — Extensions

- mobile natif
- forums
- monitoring backoffice

## 6. Decision D'Execution

Pour reussir ESGIS Campus, la bonne strategie n'est pas de multiplier les pages "placeholder". Il faut:

1. stabiliser le coeur web role-based
2. rendre fiables les donnees academiques reelles
3. finaliser les workflows metier critiques
4. seulement ensuite etendre vers le super admin, le mobile et les integrations avancees

Ce document doit etre lu conjointement avec:

- [ESGIS_Campus_specification_fonctionnelle_complete.md](/Users/floriace/ESGIS/esgis_intranet_platform/docs/ESGIS_Campus_specification_fonctionnelle_complete.md)
- [ESGIS_Campus_execution_tracker.md](/Users/floriace/ESGIS/esgis_intranet_platform/docs/ESGIS_Campus_execution_tracker.md)
