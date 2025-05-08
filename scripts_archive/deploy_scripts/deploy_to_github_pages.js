/**
 * Script pour déployer l'application ESGIS Intranet Platform sur GitHub Pages
 * Ce script construit l'application et la déploie sur la branche gh-pages
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Fonction pour exécuter une commande shell
const runCommand = (command) => {
  try {
    console.log(`Exécution de la commande: ${command}`);
    const output = execSync(command, { encoding: 'utf8', stdio: 'inherit' });
    return { success: true, output };
  } catch (error) {
    console.error(`Erreur lors de l'exécution de la commande: ${command}`);
    console.error(error.message);
    return { success: false, error };
  }
};

// Fonction pour vérifier si le fichier package.json contient les scripts nécessaires
const checkPackageJson = () => {
  console.log("Vérification du fichier package.json...");
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error("Le fichier package.json n'existe pas.");
    return false;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Vérifier si le script de déploiement existe
    if (!packageJson.scripts || !packageJson.scripts.deploy) {
      console.log("Ajout du script de déploiement dans package.json...");
      
      if (!packageJson.scripts) {
        packageJson.scripts = {};
      }
      
      packageJson.scripts.deploy = "gh-pages -d build";
      
      // Vérifier si le script de build existe
      if (!packageJson.scripts.build) {
        packageJson.scripts.build = "react-scripts build";
      }
      
      // Ajouter la propriété homepage si elle n'existe pas
      if (!packageJson.homepage) {
        packageJson.homepage = "https://flori92.github.io/esgis_intranet_platform";
      }
      
      // Écrire les modifications dans package.json
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
      console.log("Script de déploiement ajouté avec succès.");
    } else {
      console.log("Le script de déploiement existe déjà.");
    }
    
    return true;
  } catch (error) {
    console.error("Erreur lors de la lecture du fichier package.json:", error);
    return false;
  }
};

// Fonction pour installer les dépendances nécessaires
const installDependencies = () => {
  console.log("Installation des dépendances nécessaires...");
  
  // Vérifier si gh-pages est installé
  const result = runCommand("npm list gh-pages --depth=0");
  
  if (!result.success || !result.output || !result.output.includes("gh-pages")) {
    console.log("Installation de gh-pages...");
    const installResult = runCommand("npm install --save-dev gh-pages");
    
    if (!installResult.success) {
      console.error("Erreur lors de l'installation de gh-pages.");
      return false;
    }
  } else {
    console.log("gh-pages est déjà installé.");
  }
  
  return true;
};

// Fonction pour construire l'application
const buildApp = () => {
  console.log("Construction de l'application...");
  
  const buildResult = runCommand("npm run build");
  
  if (!buildResult.success) {
    console.error("Erreur lors de la construction de l'application.");
    return false;
  }
  
  console.log("Application construite avec succès.");
  return true;
};

// Fonction pour déployer l'application sur GitHub Pages
const deployToGitHubPages = () => {
  console.log("Déploiement de l'application sur GitHub Pages...");
  
  const deployResult = runCommand("npm run deploy -- -m \"✨ DEPLOY: Mise à jour de l'application avec corrections\"");
  
  if (!deployResult.success) {
    console.error("Erreur lors du déploiement de l'application.");
    return false;
  }
  
  console.log("Application déployée avec succès sur GitHub Pages.");
  return true;
};

// Fonction principale
const main = () => {
  console.log("=== DÉBUT DU DÉPLOIEMENT SUR GITHUB PAGES ===");
  
  // Vérifier et mettre à jour package.json
  if (!checkPackageJson()) {
    console.error("Impossible de continuer sans un fichier package.json valide.");
    process.exit(1);
  }
  
  // Installer les dépendances nécessaires
  if (!installDependencies()) {
    console.error("Impossible de continuer sans les dépendances nécessaires.");
    process.exit(1);
  }
  
  // Construire l'application
  if (!buildApp()) {
    console.error("Impossible de continuer sans une construction réussie de l'application.");
    process.exit(1);
  }
  
  // Déployer l'application sur GitHub Pages
  if (!deployToGitHubPages()) {
    console.error("Erreur lors du déploiement de l'application sur GitHub Pages.");
    process.exit(1);
  }
  
  console.log("=== FIN DU DÉPLOIEMENT SUR GITHUB PAGES ===");
  console.log("L'application est maintenant disponible à l'adresse: https://flori92.github.io/esgis_intranet_platform");
};

// Exécuter la fonction principale
main();
