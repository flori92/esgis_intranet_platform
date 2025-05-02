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

### Vercel (principal)

La plateforme est déployée sur Vercel à l'adresse suivante :
https://project-qa574tdcn-flodrama-projects.vercel.app

### GitHub Pages (alternatif)

La plateforme est également déployée sur GitHub Pages à l'adresse suivante :
https://flori92.github.io/exam_esgis_platform/

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

## Déploiement manuel sur GitHub Pages

1. Construisez l'application avec `npm run build`
2. Déployez le contenu du dossier `dist` sur la branche `gh-pages`

## Licence

Ce projet est sous licence MIT.
