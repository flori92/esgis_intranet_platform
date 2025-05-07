import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
dotenv.config();

/**
 * Script pour mettre à jour le logo ESGIS avec la bonne version
 * Ce script télécharge le logo depuis une URL et le place dans les dossiers appropriés
 */

// URL du logo ESGIS correct (à remplacer par l'URL réelle du logo)
const LOGO_URL = 'https://esgis.org/wp-content/uploads/2023/01/logo-esgis.png';

// Chemins où le logo doit être placé
const LOGO_PATHS = [
  './public/images/logo-esgis-white.svg',
  './public/logo-esgis-white.svg',
  './images/logo-esgis-white.svg'
];

/**
 * Télécharge le logo depuis l'URL et le sauvegarde dans les chemins spécifiés
 */
async function updateLogo() {
  console.log("=== MISE À JOUR DU LOGO ESGIS ===");
  
  try {
    console.log(`Téléchargement du logo depuis ${LOGO_URL}...`);
    
    // Télécharger le logo
    const response = await fetch(LOGO_URL);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const logoBuffer = await response.buffer();
    
    // Créer les dossiers nécessaires s'ils n'existent pas
    for (const logoPath of LOGO_PATHS) {
      const directory = path.dirname(logoPath);
      
      if (!fs.existsSync(directory)) {
        console.log(`Création du dossier ${directory}...`);
        fs.mkdirSync(directory, { recursive: true });
      }
      
      // Sauvegarder le logo
      console.log(`Sauvegarde du logo dans ${logoPath}...`);
      fs.writeFileSync(logoPath, logoBuffer);
    }
    
    console.log("Logo ESGIS mis à jour avec succès!");
    
    // Mettre à jour le fichier assetUtils.js pour utiliser le bon chemin
    const assetUtilsPath = './src/utils/assetUtils.js';
    console.log(`Mise à jour du fichier ${assetUtilsPath}...`);
    
    if (fs.existsSync(assetUtilsPath)) {
      let assetUtilsContent = fs.readFileSync(assetUtilsPath, 'utf8');
      
      // Mettre à jour le chemin du logo si nécessaire
      if (assetUtilsContent.includes('logo-esgis-white.svg')) {
        console.log("Le fichier utilise déjà le bon nom de fichier.");
      } else {
        assetUtilsContent = assetUtilsContent.replace(
          /getAssetPath\('images\/.*?'\)/g, 
          "getAssetPath('images/logo-esgis-white.svg')"
        );
        fs.writeFileSync(assetUtilsPath, assetUtilsContent);
        console.log("Chemin du logo mis à jour dans assetUtils.js");
      }
    } else {
      console.error(`Le fichier ${assetUtilsPath} n'existe pas.`);
    }
    
    console.log("=== MISE À JOUR DU LOGO TERMINÉE ===");
    
  } catch (error) {
    console.error("Erreur lors de la mise à jour du logo:", error);
  }
}

// Exécuter la fonction principale
updateLogo();
