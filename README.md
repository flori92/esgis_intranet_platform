# Plateforme d'Examen ESGIS

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Licence](https://img.shields.io/badge/licence-MIT-green.svg)

Plateforme d'examen en ligne pour l'ESGIS, permettant aux étudiants de passer des quiz et aux administrateurs de visualiser les résultats en temps réel.

## 📋 Fonctionnalités

- **Interface étudiant** : Authentification, passage de quiz avec minuteur
- **Interface administrateur** : Tableau de bord des résultats en temps réel
- **Stockage des données** : Supabase pour le stockage et les mises à jour en temps réel
- **Détection de triche** : Suivi des changements de focus pendant l'examen
- **Notifications** : Envoi d'emails automatiques avec les résultats

## 🚀 Déploiement

### Prérequis

- Compte [GitHub](https://github.com)
- Compte [Vercel](https://vercel.com)
- Compte [Supabase](https://supabase.com)
- Node.js et npm installés localement (pour le développement)

### Configuration de Supabase

1. **Création de la base de données**

   Exécutez le script de configuration Supabase :

   ```bash
   cd scripts
   chmod +x setup_supabase.sh
   ./setup_supabase.sh
   ```

   Ou manuellement via l'interface Supabase :
   - Connectez-vous à [Supabase](https://epnhnjkbxgciojevrwfq.supabase.co)
   - Allez dans l'éditeur SQL
   - Copiez et exécutez le contenu du fichier `scripts/create_supabase_tables.sql`

2. **Informations de connexion Supabase**

   ```
   URL: https://epnhnjkbxgciojevrwfq.supabase.co
   Clé anon: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwbmhuamtieGdjaW9qZXZyd2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyMDY5MDYsImV4cCI6MjA2MTc4MjkwNn0.VeqmGA56qySH_f4rwk6bnsvPS6173BtoRA0iCjXnogM
   ```

3. **Connexion directe à la base de données PostgreSQL**

   ```
   Host: db.epnhnjkbxgciojevrwfq.supabase.co
   Port: 5432
   Database: postgres
   User: postgres
   Password: Apollonf@vi92
   ```

### Déploiement sur Vercel

1. **Déploiement automatisé**

   Utilisez le script de déploiement Vercel :

   ```bash
   export VERCEL_TOKEN=votre_token_vercel
   ./deploy-to-vercel.sh
   ```

2. **Déploiement manuel**

   - Connectez-vous à [Vercel](https://vercel.com)
   - Importez le dépôt GitHub `flori92/exam_esgis_platform`
   - Configurez les variables d'environnement :
     ```
     VITE_SUPABASE_URL=https://epnhnjkbxgciojevrwfq.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwbmhuamtieGdjaW9qZXZyd2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyMDY5MDYsImV4cCI6MjA2MTc4MjkwNn0.VeqmGA56qySH_f4rwk6bnsvPS6173BtoRA0iCjXnogM
     ```
   - Cliquez sur "Deploy"

## 💻 Développement local

1. **Cloner le dépôt**

   ```bash
   git clone https://github.com/flori92/exam_esgis_platform.git
   cd exam_esgis_platform
   ```

2. **Installer les dépendances**

   ```bash
   npm install
   ```

3. **Démarrer le serveur de développement**

   ```bash
   npm run dev
   ```

4. **Compiler pour la production**

   ```bash
   npm run build
   ```

## 🧪 Test de l'application

### Interface étudiant

1. Accédez à l'URL de l'application
2. Connectez-vous avec un identifiant étudiant
3. Commencez le quiz
4. Répondez aux questions et soumettez

### Interface administrateur

1. Accédez à l'URL de l'application avec `/admin` à la fin
2. Connectez-vous avec les identifiants administrateur
3. Visualisez les résultats en temps réel

## 📚 Structure du projet

```
exam_esgis_platform/
├── public/             # Fichiers statiques
├── scripts/            # Scripts de configuration et déploiement
├── src/
│   ├── components/     # Composants React
│   ├── context/        # Contextes React (Auth, Quiz)
│   ├── pages/          # Pages principales
│   ├── styles/         # Fichiers CSS
│   ├── types/          # Types TypeScript
│   ├── utils/          # Fonctions utilitaires
│   ├── App.tsx         # Composant racine
│   └── main.tsx        # Point d'entrée
├── index.html          # Page HTML principale
├── vercel.json         # Configuration Vercel
├── package.json        # Dépendances
└── README.md           # Documentation
```

## 🔒 Sécurité

- Les clés Supabase sont stockées dans les variables d'environnement
- La connexion à la base de données est sécurisée par mot de passe
- Les politiques RLS (Row Level Security) sont configurées dans Supabase

## 🛠️ Technologies utilisées

- **Frontend** : React, TypeScript, Vite
- **Backend** : Supabase (PostgreSQL, Auth, Realtime)
- **Déploiement** : Vercel
- **Notifications** : EmailJS

## 📝 Notes importantes

- Le temps par défaut pour le quiz est de 120 minutes
- Les tentatives de triche sont détectées lorsque l'étudiant change de fenêtre
- Les résultats sont affichés en temps réel dans le tableau de bord administrateur

## 🤝 Contribution

Pour contribuer au projet :

1. Forkez le dépôt
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Committez vos changements (`git commit -m '✨ [FEAT] Ajout d'une nouvelle fonctionnalité'`)
4. Poussez vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

Développé avec ❤️ pour ESGIS | 2025
