/**
 * Script pour corriger les avertissements Sourcery dans fix_specific_errors.js
 * Ce script remplace les if sans accolades par des if avec accolades
 */

import fs from 'fs';
import path from 'path';

// Chemin du fichier à corriger
const filePath = path.join(process.cwd(), 'fix_specific_errors.js');

// Fonction principale
const main = () => {
  console.log("=== CORRECTION DES AVERTISSEMENTS SOURCERY ===");
  
  try {
    // Vérifier si le fichier existe
    if (!fs.existsSync(filePath)) {
      console.error(`Le fichier ${filePath} n'existe pas.`);
      return;
    }
    
    // Lire le contenu du fichier
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remplacer tous les "if (!content) return;" par "if (!content) { return; }"
    content = content.replace(/if \(!content\) return;/g, 'if (!content) {\n    return;\n  }');
    
    // Écrire le contenu modifié dans le fichier
    fs.writeFileSync(filePath, content, 'utf8');
    
    console.log(`Avertissements Sourcery corrigés dans ${filePath}`);
  } catch (error) {
    console.error(`Erreur lors de la correction des avertissements Sourcery:`, error);
  }
  
  console.log("=== FIN DE LA CORRECTION DES AVERTISSEMENTS SOURCERY ===");
};

// Exécuter la fonction principale
main();
