# Migrations Supabase

## Description

Ce dossier contient les scripts de migration pour la base de données Supabase du projet ESGIS Intranet Platform. Les migrations permettent d'ajouter les tables manquantes et de configurer les politiques de sécurité nécessaires au bon fonctionnement de l'application.

## Structure

- `supabase_migration.sql` : Script SQL contenant toutes les définitions de tables, fonctions, déclencheurs et politiques de sécurité
- `apply_migration.sh` : Script shell pour faciliter l'application des migrations

## Tables ajoutées

Le script de migration ajoute les tables suivantes :

1. `quiz_results` : Stocke les résultats des quiz des étudiants
2. `quiz_questions` : Contient les questions des quiz
3. `quiz` : Définit les quiz créés par les professeurs
4. `quiz_attempts` : Enregistre les tentatives des étudiants pour chaque quiz
5. `quiz_results_temp` : Table temporaire utilisée dans QuizContext.tsx

## Fonctions RPC

Le script ajoute également des fonctions RPC (Remote Procedure Call) pour faciliter certaines opérations :

- `get_student_dashboard_events` : Récupère les événements du tableau de bord d'un étudiant

## Politiques de sécurité

Des politiques de sécurité RLS (Row Level Security) sont configurées pour chaque table afin de garantir que :

- Les étudiants ne peuvent voir que leurs propres résultats et tentatives
- Les professeurs peuvent voir tous les résultats
- Seuls les professeurs peuvent créer/modifier/supprimer des quiz

## Comment appliquer les migrations

1. Assurez-vous que le fichier `.env` à la racine du projet contient les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
2. Exécutez le script `apply_migration.sh` :

```bash
cd migrations
./apply_migration.sh
```

Le script vérifiera l'installation de Supabase CLI, se connectera à votre projet Supabase et appliquera les migrations.

## Vérification

Après avoir appliqué les migrations, vous pouvez vérifier que les tables ont été créées en consultant l'interface d'administration de Supabase ou en exécutant la requête suivante :

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('quiz_results', 'quiz_questions', 'quiz', 'quiz_attempts', 'quiz_results_temp');
```

## Remarques

- Ces migrations sont essentielles pour le bon fonctionnement des fonctionnalités de quiz de l'application
- Si vous rencontrez des erreurs lors de l'application des migrations, vérifiez les logs pour plus de détails
- Les politiques de sécurité sont configurées selon les rôles définis dans la table `profiles`
