# Plateforme d'Examen ESGIS

Une plateforme d'examen en ligne pour les étudiants de l'ESGIS, permettant de passer des examens avec détection de triche et suivi des résultats en temps réel.

## Fonctionnalités

- Authentification des étudiants et administrateurs
- Interface d'examen interactive
- Détection de triche (changement d'onglet/fenêtre)
- Tableau de bord administrateur en temps réel
- Stockage des résultats dans Supabase
- Notifications par email des résultats

## Technologies utilisées

- React avec TypeScript
- Vite pour le bundling
- Supabase pour la base de données et l'authentification
- Tailwind CSS pour le style
- EmailJS pour les notifications par email

## Déploiement

### Vercel

La plateforme est déployée sur Vercel à l'adresse suivante :
https://esgis-intranet-platform.vercel.app

## Configuration de Supabase

Pour que l'application fonctionne correctement, vous devez créer les tables suivantes dans Supabase :

1. `quiz_results` - Stocke les résultats des examens
2. `active_students` - Suit les étudiants connectés en temps réel

Les scripts SQL pour créer ces tables se trouvent dans le dossier `scripts/`.

## Développement local

1. Clonez le dépôt
2. Installez les dépendances avec `npm install`
3. Créez un fichier `.env` avec vos clés Supabase
4. Lancez le serveur de développement avec `npm run dev`

Le déploiement du projet se fait désormais uniquement depuis la branche `main` via Vercel.

## Licence

Ce projet est sous licence MIT.
