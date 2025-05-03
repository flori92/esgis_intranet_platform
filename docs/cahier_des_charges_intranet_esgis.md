# Cahier des Charges - Intranet Étudiant ESGIS

## 1. Présentation du projet

### 1.1 Contexte
L'École Supérieure de Gestion d'Informatique et des Sciences (ESGIS) souhaite mettre en place une plateforme intranet complète pour améliorer la communication et les services entre l'administration, les professeurs et les étudiants. Cette plateforme s'appuiera sur la base de la plateforme d'examens en ligne déjà développée.

### 1.2 Objectifs
- Centraliser les informations et services pour tous les acteurs de l'université
- Faciliter la communication entre administration, professeurs et étudiants
- Dématérialiser les processus administratifs
- Améliorer l'accès aux ressources pédagogiques
- Optimiser la gestion des examens et évaluations

### 1.3 Périmètre
La plateforme sera accessible uniquement aux membres de l'ESGIS (étudiants, professeurs, personnel administratif) via une authentification sécurisée.

## 2. Description fonctionnelle

### 2.1 Fonctionnalités communes
- **Authentification sécurisée** avec gestion des rôles (étudiant, professeur, administrateur)
- **Profil utilisateur** personnalisable avec informations de contact et préférences
- **Messagerie interne** pour la communication entre les différents acteurs
- **Notifications** pour les événements importants (nouvelles notes, documents disponibles, etc.)
- **Calendrier partagé** pour les événements universitaires

### 2.2 Espace étudiant
- **Consultation de l'emploi du temps** personnalisé par filière et niveau
- **Accès aux notes et bulletins** avec historique des évaluations
- **Génération de documents administratifs** (certificat de scolarité, attestation, etc.)
- **Bibliothèque de ressources** pour accéder aux cours et TP mis à disposition
- **Passage d'examens en ligne** avec le système existant amélioré
- **Candidature aux offres de stages/emplois** publiées par l'administration
- **Suivi de la scolarité** (crédits, absences, progression)
- **Paiement en ligne** des frais de scolarité avec historique des transactions

### 2.3 Espace professeur
- **Gestion des cours** : upload et organisation des supports de cours
- **Système de notation** : saisie et publication des notes d'évaluations
- **Création et gestion d'examens** en ligne avec le système existant
- **Suivi des étudiants** : progression, statistiques, participation
- **Gestion de l'emploi du temps** : visualisation et demandes de modifications
- **Publication d'annonces** spécifiques à un cours ou une filière

### 2.4 Espace administratif
- **Gestion des utilisateurs** : création, modification, désactivation des comptes
- **Gestion des offres de stages/emplois** : publication et suivi des candidatures
- **Gestion des emplois du temps** : création et modification
- **Génération de documents administratifs** : bulletins, certificats, attestations
- **Gestion des inscriptions** et réinscriptions
- **Suivi des paiements** des frais de scolarité
- **Statistiques et reporting** sur les activités de la plateforme

## 3. Architecture technique

### 3.1 Frontend
- **Framework** : React avec TypeScript (existant)
- **Bibliothèques UI** : 
  - Material-UI ou Chakra UI pour l'interface utilisateur
  - React Router pour la navigation
  - React Query pour la gestion des requêtes API
  - Context API + éventuellement Redux pour la gestion d'état complexe
- **Responsive design** pour une utilisation sur tous les appareils

### 3.2 Backend
- **Base de données** : Supabase (PostgreSQL)
- **Authentification** : Supabase Auth avec JWT
- **Stockage** : Supabase Storage pour les documents
- **API** : API REST Supabase + fonctions serverless pour les opérations complexes
- **Temps réel** : Supabase Realtime pour les notifications et mises à jour en direct

### 3.3 Sécurité
- **HTTPS obligatoire** pour toutes les communications
- **Row Level Security** (RLS) de Supabase pour contrôler l'accès aux données
- **Validation des données** côté client et serveur
- **Journalisation des actions** sensibles pour audit
- **Gestion fine des permissions** selon les rôles

## 4. Modélisation des données

### 4.1 Utilisateurs et authentification
- **users** : informations de base des utilisateurs (existant, à étendre)
- **profiles** : informations détaillées des utilisateurs selon leur rôle
- **roles** : définition des rôles et permissions

### 4.2 Structure pédagogique
- **filieres** : filières d'études disponibles
- **niveaux** : niveaux d'études (L1, L2, L3, M1, M2)
- **cours** : cours dispensés avec références aux professeurs
- **groupes** : groupes d'étudiants pour les cours et TP

### 4.3 Ressources pédagogiques
- **documents** : supports de cours, TP, etc.
- **categories_documents** : catégorisation des documents
- **examens** : configuration des examens (existant)
- **questions** : questions d'examens (existant)
- **resultats_examens** : résultats des examens (existant)

### 4.4 Scolarité
- **inscriptions** : inscriptions des étudiants par année
- **notes** : notes des étudiants pour chaque évaluation
- **bulletins** : bulletins générés par semestre
- **absences** : suivi des absences
- **emplois_du_temps** : planification des cours et examens
- **evenements** : événements universitaires

### 4.5 Administration
- **offres_stages_emplois** : offres publiées par l'administration
- **candidatures** : candidatures des étudiants aux offres
- **paiements** : suivi des paiements des frais de scolarité
- **documents_administratifs** : modèles et documents générés

## 5. Interfaces utilisateur

### 5.1 Interface commune
- **Page de connexion** sécurisée
- **Tableau de bord** personnalisé selon le rôle
- **Barre de navigation** adaptée au rôle
- **Profil utilisateur** éditable
- **Messagerie** interne
- **Notifications** en temps réel

### 5.2 Interface étudiant
- **Emploi du temps** interactif
- **Espace notes et bulletins**
- **Générateur de documents administratifs**
- **Bibliothèque de ressources** avec recherche
- **Plateforme d'examens** en ligne (existante)
- **Espace candidatures** aux offres de stages/emplois
- **Suivi de scolarité** avec visualisation graphique
- **Espace paiement** sécurisé

### 5.3 Interface professeur
- **Gestionnaire de cours et ressources**
- **Système de notation** avec import/export
- **Créateur d'examens** en ligne (existant)
- **Tableau de suivi des étudiants**
- **Visualisation de l'emploi du temps**
- **Éditeur d'annonces**

### 5.4 Interface administrative
- **Gestionnaire d'utilisateurs**
- **Gestionnaire d'offres de stages/emplois**
- **Éditeur d'emplois du temps**
- **Générateur de documents administratifs**
- **Gestionnaire d'inscriptions**
- **Suivi des paiements**
- **Tableau de bord statistique**

## 6. Plan de développement

### 6.1 Phase 1 : Fondations (1-2 mois)
- Mise en place de l'architecture technique étendue
- Développement du système d'authentification avec gestion des rôles
- Création des interfaces de base et navigation
- Extension du modèle de données Supabase

### 6.2 Phase 2 : Fonctionnalités étudiantes (1-2 mois)
- Développement de l'emploi du temps
- Système de consultation des notes et bulletins
- Générateur de documents administratifs
- Intégration du système d'examens existant
- Bibliothèque de ressources pédagogiques

### 6.3 Phase 3 : Fonctionnalités professeurs (1-2 mois)
- Système de gestion des cours et ressources
- Développement du système de notation
- Amélioration du créateur d'examens
- Outils de suivi des étudiants
- Gestion des annonces

### 6.4 Phase 4 : Fonctionnalités administratives (1-2 mois)
- Gestion des utilisateurs
- Système d'offres de stages/emplois
- Éditeur d'emplois du temps
- Gestion des inscriptions et documents
- Suivi des paiements et statistiques

### 6.5 Phase 5 : Finalisation et déploiement (1 mois)
- Tests utilisateurs et corrections
- Optimisation des performances
- Documentation utilisateur
- Formation des administrateurs
- Déploiement progressif

## 7. Besoins techniques et humains

### 7.1 Équipe de développement
- 2-3 développeurs frontend React/TypeScript
- 1-2 développeurs backend Supabase/PostgreSQL
- 1 designer UI/UX
- 1 chef de projet
- 1 testeur QA

### 7.2 Infrastructure
- Compte Supabase avec plan adapté au volume de données
- Serveur d'hébergement pour le frontend (plus robuste que GitHub Pages)
- Domaine dédié (intranet.esgis.edu ou similaire)
- Système de sauvegarde automatisé
- Environnements de développement, test et production

### 7.3 Outils de développement
- GitHub pour le versioning du code
- Figma pour les maquettes UI/UX
- Jira ou Trello pour le suivi de projet
- Documentation technique avec GitBook ou similaire

## 8. Livrables attendus

- Code source complet et documenté
- Base de données Supabase configurée
- Documentation technique détaillée
- Manuel utilisateur pour chaque type d'utilisateur
- Formation pour les administrateurs système
- Support technique initial après déploiement

## 9. Prochaines étapes immédiates

1. **Validation du cahier des charges** par les parties prenantes
2. **Modélisation détaillée de la base de données** Supabase
3. **Création des maquettes UI/UX** pour les principales interfaces
4. **Mise en place de l'environnement de développement**
5. **Développement d'un prototype fonctionnel** pour validation

---

Document préparé le 3 mai 2025
