#!/bin/bash

# Script de déploiement rapide pour l'intranet ESGIS
# Ce script contourne les problèmes de build en créant une version minimale
# directement déployable sur GitHub Pages

set -e  # Arrêter en cas d'erreur

echo "🚀 Préparation du déploiement direct..."

# Création du dossier temporaire
TEMP_DIR="temp-deploy-$(date +%s)"
mkdir -p $TEMP_DIR

# Création des fichiers de base
echo "📄 Création des fichiers minimaux pour le déploiement..."

# Fichier index.html
cat > $TEMP_DIR/index.html << 'EOL'
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Plateforme Intranet ESGIS</title>
  <link rel="stylesheet" href="styles.css">
  <link rel="icon" href="favicon.ico" type="image/x-icon">
</head>
<body>
  <div class="app-container">
    <header>
      <h1>Plateforme Intranet ESGIS</h1>
      <p>Système de Gestion Intégré des Activités Académiques</p>
    </header>
    
    <main>
      <div class="status-banner">
        <h2>🛠️ Maintenance en cours</h2>
        <p>La plateforme est actuellement en cours de maintenance et sera bientôt disponible avec toutes ses fonctionnalités.</p>
        <p>Nous travaillons activement pour résoudre les problèmes techniques et améliorer votre expérience utilisateur.</p>
        <p><strong>Date prévue de retour :</strong> Prochainement</p>
      </div>
      
      <section class="features">
        <h2>Fonctionnalités principales</h2>
        <div class="features-grid">
          <div class="feature-card">
            <h3>👨‍🎓 Gestion des Étudiants</h3>
            <p>Inscription, suivi académique, gestion des données personnelles</p>
          </div>
          <div class="feature-card">
            <h3>👨‍🏫 Gestion des Professeurs</h3>
            <p>Attribution des cours, emplois du temps, évaluations</p>
          </div>
          <div class="feature-card">
            <h3>📝 Examens et Quiz</h3>
            <p>Création et administration d'examens en ligne sécurisés</p>
          </div>
          <div class="feature-card">
            <h3>📚 Gestion Documentaire</h3>
            <p>Partage de cours et ressources pédagogiques</p>
          </div>
        </div>
      </section>

      <section class="contact">
        <h2>Besoin d'assistance ?</h2>
        <p>Pour toute question concernant la plateforme, veuillez contacter l'administration de l'ESGIS.</p>
      </section>
    </main>
    
    <footer>
      <p>&copy; 2025 ESGIS - École Supérieure de Gestion, d'Informatique et des Sciences</p>
    </footer>
  </div>
</body>
</html>
EOL

# Fichier CSS
cat > $TEMP_DIR/styles.css << 'EOL'
/* Styles généraux */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  margin: 0;
  padding: 0;
  background-color: #f5f5f5;
  color: #333;
  line-height: 1.6;
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* Entête */
header {
  background-color: #1a365d;
  color: white;
  padding: 2rem;
  text-align: center;
}

header h1 {
  margin: 0;
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

/* Contenu principal */
main {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* Bannière de statut */
.status-banner {
  background-color: #fef3c7;
  border-left: 4px solid #d97706;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border-radius: 5px;
}

.status-banner h2 {
  margin-top: 0;
  color: #92400e;
  margin-bottom: 0.5rem;
}

/* Section fonctionnalités */
.features h2 {
  text-align: center;
  margin-bottom: 2rem;
  color: #1a365d;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.feature-card {
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-card h3 {
  color: #1a365d;
  margin-top: 0;
  margin-bottom: 0.5rem;
}

/* Section contact */
.contact {
  background-color: #e6f7ff;
  padding: 1.5rem;
  border-radius: 8px;
  margin-top: 2rem;
  text-align: center;
}

.contact h2 {
  color: #0077b6;
  margin-bottom: 0.5rem;
}

/* Pied de page */
footer {
  background-color: #1a365d;
  color: white;
  padding: 1.5rem;
  text-align: center;
}

/* Responsive */
@media (max-width: 768px) {
  header h1 {
    font-size: 2rem;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
}
EOL

# Fichier .nojekyll pour GitHub Pages
touch $TEMP_DIR/.nojekyll

echo "🌐 Déploiement sur GitHub Pages..."

# Vérification de gh-pages
if ! npm list -g gh-pages > /dev/null; then
  echo "📦 Installation de gh-pages globalement..."
  npm install -g gh-pages
fi

# Déploiement via gh-pages
npx gh-pages -d $TEMP_DIR -m "✨ DEPLOY: Version minimale en attendant la résolution des problèmes de build"

# Nettoyage
echo "🧹 Nettoyage des fichiers temporaires..."
rm -rf $TEMP_DIR

echo "✅ Déploiement terminé avec succès !"
echo "🔗 Le site devrait être accessible sous peu à l'adresse: https://[votre-organisation].github.io/intranet-esgis/"
echo "⚠️ Note: Cette page est temporaire en attendant la résolution complète des problèmes de build."
