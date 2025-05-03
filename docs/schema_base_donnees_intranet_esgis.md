# Modélisation de la Base de Données - Intranet ESGIS

Ce document présente la modélisation détaillée de la base de données Supabase pour l'intranet étudiant ESGIS. Il décrit les tables, leurs champs, relations et contraintes, ainsi que les politiques de sécurité Row Level Security (RLS) à mettre en place.

## 1. Structure existante (plateforme d'examens)

La plateforme actuelle comprend déjà les tables suivantes qui seront conservées et étendues :

### 1.1 Table `users` (gérée par Supabase Auth)
| Champ | Type | Description |
|-------|------|-------------|
| id | uuid | Identifiant unique (PK) |
| email | text | Email de l'utilisateur |
| created_at | timestamp | Date de création du compte |
| last_sign_in_at | timestamp | Dernière connexion |
| role | text | Rôle (étudiant, professeur, admin) |

### 1.2 Table `active_students`
| Champ | Type | Description |
|-------|------|-------------|
| id | uuid | Identifiant unique (PK) |
| student_id | text | ID de l'étudiant (FK -> users.id) |
| student_name | text | Nom de l'étudiant |
| status | text | Statut (connected, in_exam, completed) |
| cheating_attempts | integer | Nombre de tentatives de triche |
| connected_at | timestamp | Date de connexion |
| last_activity | timestamp | Dernière activité |

### 1.3 Table `quiz_results`
| Champ | Type | Description |
|-------|------|-------------|
| id | uuid | Identifiant unique (PK) |
| student_id | text | ID de l'étudiant (FK -> users.id) |
| student_name | text | Nom de l'étudiant |
| score | numeric | Score obtenu |
| max_score | numeric | Score maximum possible |
| answers | jsonb | Réponses données par l'étudiant |
| cheating_attempts | integer | Tentatives de triche détectées |
| completed_at | timestamp | Date de complétion |

## 2. Nouvelles tables pour l'intranet

### 2.1 Module Utilisateurs et Authentification

#### 2.1.1 Table `profiles`
| Champ | Type | Description | Contraintes |
|-------|------|-------------|-------------|
| id | uuid | Identifiant unique (PK) | NOT NULL, PK, FK -> users.id |
| user_id | uuid | ID utilisateur | NOT NULL, UNIQUE, FK -> users.id |
| first_name | text | Prénom | NOT NULL |
| last_name | text | Nom | NOT NULL |
| phone | text | Numéro de téléphone | |
| address | text | Adresse | |
| birth_date | date | Date de naissance | |
| profile_picture | text | URL de la photo de profil | |
| bio | text | Biographie/description | |
| role | text | Rôle (étudiant, professeur, admin) | NOT NULL |
| created_at | timestamp | Date de création | NOT NULL, DEFAULT now() |
| updated_at | timestamp | Date de mise à jour | NOT NULL, DEFAULT now() |

#### 2.1.2 Table `roles_permissions`
| Champ | Type | Description | Contraintes |
|-------|------|-------------|-------------|
| id | uuid | Identifiant unique (PK) | NOT NULL, PK |
| role | text | Nom du rôle | NOT NULL |
| resource | text | Ressource concernée | NOT NULL |
| action | text | Action autorisée (create, read, update, delete) | NOT NULL |
| created_at | timestamp | Date de création | NOT NULL, DEFAULT now() |

### 2.2 Module Structure Pédagogique

#### 2.2.1 Table `filieres`
| Champ | Type | Description | Contraintes |
|-------|------|-------------|-------------|
| id | uuid | Identifiant unique (PK) | NOT NULL, PK |
| code | text | Code de la filière | NOT NULL, UNIQUE |
| name | text | Nom de la filière | NOT NULL |
| description | text | Description | |
| responsable_id | uuid | ID du responsable | FK -> profiles.id |
| created_at | timestamp | Date de création | NOT NULL, DEFAULT now() |
| updated_at | timestamp | Date de mise à jour | NOT NULL, DEFAULT now() |

#### 2.2.2 Table `niveaux`
| Champ | Type | Description | Contraintes |
|-------|------|-------------|-------------|
| id | uuid | Identifiant unique (PK) | NOT NULL, PK |
| code | text | Code du niveau (L1, L2, etc.) | NOT NULL |
| name | text | Nom du niveau | NOT NULL |
| filiere_id | uuid | ID de la filière | NOT NULL, FK -> filieres.id |
| created_at | timestamp | Date de création | NOT NULL, DEFAULT now() |
| updated_at | timestamp | Date de mise à jour | NOT NULL, DEFAULT now() |

#### 2.2.3 Table `cours`
| Champ | Type | Description | Contraintes |
|-------|------|-------------|-------------|
| id | uuid | Identifiant unique (PK) | NOT NULL, PK |
| code | text | Code du cours | NOT NULL, UNIQUE |
| name | text | Nom du cours | NOT NULL |
| description | text | Description | |
| credits | integer | Nombre de crédits | NOT NULL |
| niveau_id | uuid | ID du niveau | NOT NULL, FK -> niveaux.id |
| professeur_id | uuid | ID du professeur | FK -> profiles.id |
| created_at | timestamp | Date de création | NOT NULL, DEFAULT now() |
| updated_at | timestamp | Date de mise à jour | NOT NULL, DEFAULT now() |

#### 2.2.4 Table `groupes`
| Champ | Type | Description | Contraintes |
|-------|------|-------------|-------------|
| id | uuid | Identifiant unique (PK) | NOT NULL, PK |
| name | text | Nom du groupe | NOT NULL |
| niveau_id | uuid | ID du niveau | NOT NULL, FK -> niveaux.id |
| created_at | timestamp | Date de création | NOT NULL, DEFAULT now() |
| updated_at | timestamp | Date de mise à jour | NOT NULL, DEFAULT now() |

#### 2.2.5 Table `groupe_etudiants`
| Champ | Type | Description | Contraintes |
|-------|------|-------------|-------------|
| id | uuid | Identifiant unique (PK) | NOT NULL, PK |
| groupe_id | uuid | ID du groupe | NOT NULL, FK -> groupes.id |
| etudiant_id | uuid | ID de l'étudiant | NOT NULL, FK -> profiles.id |
| created_at | timestamp | Date de création | NOT NULL, DEFAULT now() |

### 2.3 Module Ressources Pédagogiques

#### 2.3.1 Table `categories_documents`
| Champ | Type | Description | Contraintes |
|-------|------|-------------|-------------|
| id | uuid | Identifiant unique (PK) | NOT NULL, PK |
| name | text | Nom de la catégorie | NOT NULL |
| description | text | Description | |
| created_at | timestamp | Date de création | NOT NULL, DEFAULT now() |
| updated_at | timestamp | Date de mise à jour | NOT NULL, DEFAULT now() |

#### 2.3.2 Table `documents`
| Champ | Type | Description | Contraintes |
|-------|------|-------------|-------------|
| id | uuid | Identifiant unique (PK) | NOT NULL, PK |
| title | text | Titre du document | NOT NULL |
| description | text | Description | |
| file_url | text | URL du fichier dans Supabase Storage | NOT NULL |
| file_type | text | Type de fichier (PDF, DOCX, etc.) | NOT NULL |
| file_size | integer | Taille du fichier en octets | NOT NULL |
| category_id | uuid | ID de la catégorie | FK -> categories_documents.id |
| cours_id | uuid | ID du cours associé | FK -> cours.id |
| uploaded_by | uuid | ID de l'utilisateur qui a uploadé | NOT NULL, FK -> profiles.id |
| is_public | boolean | Document accessible à tous | NOT NULL, DEFAULT false |
| created_at | timestamp | Date de création | NOT NULL, DEFAULT now() |
| updated_at | timestamp | Date de mise à jour | NOT NULL, DEFAULT now() |

#### 2.3.3 Table `examens` (extension de la table existante)
| Champ | Type | Description | Contraintes |
|-------|------|-------------|-------------|
| id | uuid | Identifiant unique (PK) | NOT NULL, PK |
| title | text | Titre de l'examen | NOT NULL |
| description | text | Description | |
| cours_id | uuid | ID du cours associé | NOT NULL, FK -> cours.id |
| professeur_id | uuid | ID du professeur | NOT NULL, FK -> profiles.id |
| date_debut | timestamp | Date et heure de début | NOT NULL |
| date_fin | timestamp | Date et heure de fin | NOT NULL |
| duree_minutes | integer | Durée en minutes | NOT NULL |
| is_active | boolean | Examen actif | NOT NULL, DEFAULT false |
| created_at | timestamp | Date de création | NOT NULL, DEFAULT now() |
| updated_at | timestamp | Date de mise à jour | NOT NULL, DEFAULT now() |

### 2.4 Module Scolarité

#### 2.4.1 Table `inscriptions`
| Champ | Type | Description | Contraintes |
|-------|------|-------------|-------------|
| id | uuid | Identifiant unique (PK) | NOT NULL, PK |
| etudiant_id | uuid | ID de l'étudiant | NOT NULL, FK -> profiles.id |
| niveau_id | uuid | ID du niveau | NOT NULL, FK -> niveaux.id |
| annee_academique | text | Année académique (ex: 2025-2026) | NOT NULL |
| date_inscription | date | Date d'inscription | NOT NULL |
| statut | text | Statut (en cours, validée, annulée) | NOT NULL |
| created_at | timestamp | Date de création | NOT NULL, DEFAULT now() |
| updated_at | timestamp | Date de mise à jour | NOT NULL, DEFAULT now() |

#### 2.4.2 Table `notes`
| Champ | Type | Description | Contraintes |
|-------|------|-------------|-------------|
| id | uuid | Identifiant unique (PK) | NOT NULL, PK |
| etudiant_id | uuid | ID de l'étudiant | NOT NULL, FK -> profiles.id |
| cours_id | uuid | ID du cours | NOT NULL, FK -> cours.id |
| examen_id | uuid | ID de l'examen (optionnel) | FK -> examens.id |
| type_evaluation | text | Type (contrôle continu, examen, TP) | NOT NULL |
| note | numeric | Note obtenue | NOT NULL |
| coefficient | numeric | Coefficient de l'évaluation | NOT NULL, DEFAULT 1 |
| commentaire | text | Commentaire | |
| date_evaluation | date | Date de l'évaluation | NOT NULL |
| professeur_id | uuid | ID du professeur | NOT NULL, FK -> profiles.id |
| created_at | timestamp | Date de création | NOT NULL, DEFAULT now() |
| updated_at | timestamp | Date de mise à jour | NOT NULL, DEFAULT now() |

#### 2.4.3 Table `bulletins`
| Champ | Type | Description | Contraintes |
|-------|------|-------------|-------------|
| id | uuid | Identifiant unique (PK) | NOT NULL, PK |
| etudiant_id | uuid | ID de l'étudiant | NOT NULL, FK -> profiles.id |
| niveau_id | uuid | ID du niveau | NOT NULL, FK -> niveaux.id |
| semestre | integer | Numéro du semestre | NOT NULL |
| annee_academique | text | Année académique | NOT NULL |
| moyenne_generale | numeric | Moyenne générale | NOT NULL |
| credits_obtenus | integer | Nombre de crédits obtenus | NOT NULL |
| rang | integer | Rang de l'étudiant | |
| appreciation | text | Appréciation générale | |
| date_generation | timestamp | Date de génération | NOT NULL |
| fichier_url | text | URL du fichier PDF | |
| created_at | timestamp | Date de création | NOT NULL, DEFAULT now() |
| updated_at | timestamp | Date de mise à jour | NOT NULL, DEFAULT now() |

#### 2.4.4 Table `absences`
| Champ | Type | Description | Contraintes |
|-------|------|-------------|-------------|
| id | uuid | Identifiant unique (PK) | NOT NULL, PK |
| etudiant_id | uuid | ID de l'étudiant | NOT NULL, FK -> profiles.id |
| cours_id | uuid | ID du cours | NOT NULL, FK -> cours.id |
| date_absence | date | Date de l'absence | NOT NULL |
| duree_heures | numeric | Durée en heures | NOT NULL |
| justifiee | boolean | Absence justifiée | NOT NULL, DEFAULT false |
| motif | text | Motif de l'absence | |
| document_justificatif | text | URL du document justificatif | |
| created_at | timestamp | Date de création | NOT NULL, DEFAULT now() |
| updated_at | timestamp | Date de mise à jour | NOT NULL, DEFAULT now() |

#### 2.4.5 Table `emplois_du_temps`
| Champ | Type | Description | Contraintes |
|-------|------|-------------|-------------|
| id | uuid | Identifiant unique (PK) | NOT NULL, PK |
| cours_id | uuid | ID du cours | NOT NULL, FK -> cours.id |
| professeur_id | uuid | ID du professeur | NOT NULL, FK -> profiles.id |
| groupe_id | uuid | ID du groupe | FK -> groupes.id |
| jour_semaine | integer | Jour de la semaine (1-7) | NOT NULL |
| heure_debut | time | Heure de début | NOT NULL |
| heure_fin | time | Heure de fin | NOT NULL |
| salle | text | Salle | |
| recurrence | text | Type de récurrence | NOT NULL, DEFAULT 'weekly' |
| date_debut | date | Date de début | NOT NULL |
| date_fin | date | Date de fin | |
| created_at | timestamp | Date de création | NOT NULL, DEFAULT now() |
| updated_at | timestamp | Date de mise à jour | NOT NULL, DEFAULT now() |

#### 2.4.6 Table `evenements`
| Champ | Type | Description | Contraintes |
|-------|------|-------------|-------------|
| id | uuid | Identifiant unique (PK) | NOT NULL, PK |
| title | text | Titre de l'événement | NOT NULL |
| description | text | Description | |
| lieu | text | Lieu | |
| date_debut | timestamp | Date et heure de début | NOT NULL |
| date_fin | timestamp | Date et heure de fin | NOT NULL |
| type | text | Type d'événement | NOT NULL |
| organisateur_id | uuid | ID de l'organisateur | FK -> profiles.id |
| public_cible | text[] | Public ciblé (array) | |
| created_at | timestamp | Date de création | NOT NULL, DEFAULT now() |
| updated_at | timestamp | Date de mise à jour | NOT NULL, DEFAULT now() |

### 2.5 Module Administration

#### 2.5.1 Table `offres_stages_emplois`
| Champ | Type | Description | Contraintes |
|-------|------|-------------|-------------|
| id | uuid | Identifiant unique (PK) | NOT NULL, PK |
| title | text | Titre de l'offre | NOT NULL |
| description | text | Description détaillée | NOT NULL |
| entreprise | text | Nom de l'entreprise | NOT NULL |
| lieu | text | Lieu | NOT NULL |
| type | text | Type (stage, emploi, alternance) | NOT NULL |
| date_debut | date | Date de début | |
| duree | text | Durée | |
| remuneration | text | Rémunération | |
| competences_requises | text[] | Compétences requises (array) | |
| niveau_requis | text[] | Niveaux d'études requis (array) | |
| date_publication | date | Date de publication | NOT NULL |
| date_expiration | date | Date d'expiration | |
| contact_email | text | Email de contact | |
| contact_phone | text | Téléphone de contact | |
| fichier_url | text | URL du fichier descriptif | |
| publiee_par | uuid | ID de l'administrateur | NOT NULL, FK -> profiles.id |
| created_at | timestamp | Date de création | NOT NULL, DEFAULT now() |
| updated_at | timestamp | Date de mise à jour | NOT NULL, DEFAULT now() |

#### 2.5.2 Table `candidatures`
| Champ | Type | Description | Contraintes |
|-------|------|-------------|-------------|
| id | uuid | Identifiant unique (PK) | NOT NULL, PK |
| offre_id | uuid | ID de l'offre | NOT NULL, FK -> offres_stages_emplois.id |
| etudiant_id | uuid | ID de l'étudiant | NOT NULL, FK -> profiles.id |
| lettre_motivation | text | Lettre de motivation | |
| cv_url | text | URL du CV | |
| statut | text | Statut (soumise, en cours, acceptée, refusée) | NOT NULL |
| date_candidature | timestamp | Date de candidature | NOT NULL |
| commentaire | text | Commentaire | |
| created_at | timestamp | Date de création | NOT NULL, DEFAULT now() |
| updated_at | timestamp | Date de mise à jour | NOT NULL, DEFAULT now() |

#### 2.5.3 Table `paiements`
| Champ | Type | Description | Contraintes |
|-------|------|-------------|-------------|
| id | uuid | Identifiant unique (PK) | NOT NULL, PK |
| etudiant_id | uuid | ID de l'étudiant | NOT NULL, FK -> profiles.id |
| inscription_id | uuid | ID de l'inscription | FK -> inscriptions.id |
| montant | numeric | Montant payé | NOT NULL |
| devise | text | Devise | NOT NULL, DEFAULT 'XOF' |
| type | text | Type de paiement | NOT NULL |
| motif | text | Motif du paiement | NOT NULL |
| date_paiement | timestamp | Date du paiement | NOT NULL |
| reference | text | Référence du paiement | |
| methode_paiement | text | Méthode de paiement | NOT NULL |
| statut | text | Statut (en attente, validé, annulé) | NOT NULL |
| recu_url | text | URL du reçu | |
| created_at | timestamp | Date de création | NOT NULL, DEFAULT now() |
| updated_at | timestamp | Date de mise à jour | NOT NULL, DEFAULT now() |

#### 2.5.4 Table `documents_administratifs`
| Champ | Type | Description | Contraintes |
|-------|------|-------------|-------------|
| id | uuid | Identifiant unique (PK) | NOT NULL, PK |
| type | text | Type de document | NOT NULL |
| template | text | Template HTML/JSON | |
| description | text | Description | |
| created_at | timestamp | Date de création | NOT NULL, DEFAULT now() |
| updated_at | timestamp | Date de mise à jour | NOT NULL, DEFAULT now() |

#### 2.5.5 Table `documents_generes`
| Champ | Type | Description | Contraintes |
|-------|------|-------------|-------------|
| id | uuid | Identifiant unique (PK) | NOT NULL, PK |
| document_type_id | uuid | ID du type de document | NOT NULL, FK -> documents_administratifs.id |
| etudiant_id | uuid | ID de l'étudiant | NOT NULL, FK -> profiles.id |
| fichier_url | text | URL du fichier généré | NOT NULL |
| date_generation | timestamp | Date de génération | NOT NULL |
| reference | text | Référence unique | NOT NULL |
| created_at | timestamp | Date de création | NOT NULL, DEFAULT now() |

### 2.6 Module Communication

#### 2.6.1 Table `messages`
| Champ | Type | Description | Contraintes |
|-------|------|-------------|-------------|
| id | uuid | Identifiant unique (PK) | NOT NULL, PK |
| expediteur_id | uuid | ID de l'expéditeur | NOT NULL, FK -> profiles.id |
| destinataire_id | uuid | ID du destinataire | NOT NULL, FK -> profiles.id |
| sujet | text | Sujet du message | NOT NULL |
| contenu | text | Contenu du message | NOT NULL |
| lu | boolean | Message lu | NOT NULL, DEFAULT false |
| date_lecture | timestamp | Date de lecture | |
| created_at | timestamp | Date de création | NOT NULL, DEFAULT now() |

#### 2.6.2 Table `notifications`
| Champ | Type | Description | Contraintes |
|-------|------|-------------|-------------|
| id | uuid | Identifiant unique (PK) | NOT NULL, PK |
| user_id | uuid | ID de l'utilisateur | NOT NULL, FK -> profiles.id |
| type | text | Type de notification | NOT NULL |
| titre | text | Titre | NOT NULL |
| contenu | text | Contenu | NOT NULL |
| lien | text | Lien associé | |
| lu | boolean | Notification lue | NOT NULL, DEFAULT false |
| created_at | timestamp | Date de création | NOT NULL, DEFAULT now() |

## 3. Relations et contraintes

### 3.1 Clés étrangères
- profiles.user_id -> users.id
- cours.professeur_id -> profiles.id
- cours.niveau_id -> niveaux.id
- niveaux.filiere_id -> filieres.id
- documents.cours_id -> cours.id
- documents.uploaded_by -> profiles.id
- examens.cours_id -> cours.id
- examens.professeur_id -> profiles.id
- notes.etudiant_id -> profiles.id
- notes.cours_id -> cours.id
- notes.examen_id -> examens.id
- bulletins.etudiant_id -> profiles.id
- bulletins.niveau_id -> niveaux.id
- etc.

### 3.2 Contraintes d'unicité
- profiles.user_id (UNIQUE)
- filieres.code (UNIQUE)
- cours.code (UNIQUE)
- inscriptions (UNIQUE(etudiant_id, niveau_id, annee_academique))
- emplois_du_temps (UNIQUE(cours_id, professeur_id, jour_semaine, heure_debut))
- etc.

## 4. Politiques de sécurité (RLS)

### 4.1 Table `profiles`
- Tous les utilisateurs peuvent lire leur propre profil
- Les administrateurs peuvent lire et modifier tous les profils
- Les professeurs peuvent lire les profils des étudiants de leurs cours

### 4.2 Table `documents`
- Les administrateurs peuvent tout faire
- Les professeurs peuvent créer/modifier/supprimer leurs propres documents
- Les étudiants peuvent lire les documents publics et ceux liés à leurs cours

### 4.3 Table `notes`
- Les administrateurs peuvent tout faire
- Les professeurs peuvent créer/modifier les notes pour leurs cours
- Les étudiants peuvent uniquement lire leurs propres notes

### 4.4 Table `emplois_du_temps`
- Les administrateurs peuvent tout faire
- Les professeurs peuvent lire leur propre emploi du temps
- Les étudiants peuvent lire l'emploi du temps de leurs cours/groupes

## 5. Indexes pour optimisation

### 5.1 Indexes simples
- profiles(user_id)
- cours(professeur_id)
- notes(etudiant_id)
- notes(cours_id)
- emplois_du_temps(cours_id)
- emplois_du_temps(professeur_id)
- documents(cours_id)
- messages(expediteur_id)
- messages(destinataire_id)

### 5.2 Indexes composites
- inscriptions(etudiant_id, annee_academique)
- notes(etudiant_id, cours_id)
- emplois_du_temps(jour_semaine, heure_debut)
- candidatures(offre_id, etudiant_id)

## 6. Triggers et fonctions

### 6.1 Trigger `update_updated_at`
Mise à jour automatique du champ updated_at pour toutes les tables concernées.

### 6.2 Trigger `generate_bulletin_pdf`
Génération automatique du PDF du bulletin lors de la création d'un bulletin.

### 6.3 Trigger `notify_new_note`
Création d'une notification lorsqu'une nouvelle note est ajoutée.

### 6.4 Trigger `notify_new_message`
Création d'une notification lorsqu'un nouveau message est reçu.

## 7. Scripts de migration

### 7.1 Migration depuis la plateforme d'examens actuelle
```sql
-- 1. Création des nouvelles tables
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  user_id UUID UNIQUE REFERENCES auth.users(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  -- autres champs
);

-- 2. Migration des données existantes
INSERT INTO profiles (id, user_id, first_name, last_name, role)
SELECT id, id, 
  SPLIT_PART(student_name, ' ', 1), 
  SPLIT_PART(student_name, ' ', 2),
  'etudiant'
FROM active_students;

-- etc.
```

### 7.2 Scripts d'initialisation des données de base
```sql
-- Insertion des filières
INSERT INTO filieres (id, code, name, description)
VALUES 
  (uuid_generate_v4(), 'INFO', 'Informatique', 'Filière informatique'),
  (uuid_generate_v4(), 'GEST', 'Gestion', 'Filière gestion'),
  (uuid_generate_v4(), 'COMM', 'Communication', 'Filière communication');

-- Insertion des niveaux
INSERT INTO niveaux (id, code, name, filiere_id)
SELECT 
  uuid_generate_v4(), 
  code, 
  name, 
  filiere_id
FROM (
  VALUES 
    ('L1-INFO', 'Licence 1', (SELECT id FROM filieres WHERE code = 'INFO')),
    ('L2-INFO', 'Licence 2', (SELECT id FROM filieres WHERE code = 'INFO')),
    ('L3-INFO', 'Licence 3', (SELECT id FROM filieres WHERE code = 'INFO')),
    ('M1-INFO', 'Master 1', (SELECT id FROM filieres WHERE code = 'INFO')),
    ('M2-INFO', 'Master 2', (SELECT id FROM filieres WHERE code = 'INFO')),
    -- autres niveaux
) AS t(code, name, filiere_id);

-- etc.
```

---

Document préparé le 3 mai 2025
