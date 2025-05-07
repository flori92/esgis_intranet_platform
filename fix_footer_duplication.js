/**
 * Script pour corriger la duplication du footer dans certaines pages
 * Ce problème est probablement dû à des composants qui incluent leur propre footer
 * en plus du footer global dans MainLayout
 */

import fs from 'fs';
import path from 'path';

// Fonction principale
const main = () => {
  console.log("=== CORRECTION DE LA DUPLICATION DU FOOTER ===");
  
  try {
    // Vérifier si le fichier MainLayout existe
    const mainLayoutPath = path.join(process.cwd(), 'src/components/layout/MainLayout.jsx');
    if (!fs.existsSync(mainLayoutPath)) {
      console.error(`Le fichier ${mainLayoutPath} n'existe pas.`);
      return;
    }
    
    // Lire le contenu du fichier MainLayout
    let mainLayoutContent = fs.readFileSync(mainLayoutPath, 'utf8');
    
    // Ajouter un identifiant unique au footer pour pouvoir le cibler avec CSS
    mainLayoutContent = mainLayoutContent.replace(
      `<Box
          component="footer"
          sx={{`,
      `<Box
          component="footer"
          id="main-footer"
          sx={{`
    );
    
    // Écrire le contenu modifié dans le fichier
    fs.writeFileSync(mainLayoutPath, mainLayoutContent, 'utf8');
    console.log(`Footer identifié dans ${mainLayoutPath}`);
    
    // Créer un fichier CSS pour masquer les footers dupliqués
    const cssPath = path.join(process.cwd(), 'public/styles/footer-fix.css');
    const cssContent = `
/* Correction pour éviter la duplication des footers */
footer:not(#main-footer) {
  display: none !important;
}
`;
    
    // Créer le dossier styles s'il n'existe pas
    const stylesDir = path.join(process.cwd(), 'public/styles');
    if (!fs.existsSync(stylesDir)) {
      fs.mkdirSync(stylesDir, { recursive: true });
    }
    
    // Écrire le fichier CSS
    fs.writeFileSync(cssPath, cssContent, 'utf8');
    console.log(`Fichier CSS créé: ${cssPath}`);
    
    // Ajouter le lien vers le CSS dans index.html
    const indexPath = path.join(process.cwd(), 'index.html');
    if (fs.existsSync(indexPath)) {
      let indexContent = fs.readFileSync(indexPath, 'utf8');
      
      // Vérifier si le lien CSS existe déjà
      if (!indexContent.includes('footer-fix.css')) {
        // Ajouter le lien CSS avant la fermeture de la balise head
        indexContent = indexContent.replace(
          '</head>',
          '  <link rel="stylesheet" href="/styles/footer-fix.css">\n</head>'
        );
        
        // Écrire le contenu modifié dans le fichier
        fs.writeFileSync(indexPath, indexContent, 'utf8');
        console.log(`Lien CSS ajouté dans ${indexPath}`);
      } else {
        console.log(`Le lien CSS existe déjà dans ${indexPath}`);
      }
    } else {
      console.error(`Le fichier ${indexPath} n'existe pas.`);
    }
    
    console.log("Correction de la duplication du footer terminée avec succès.");
  } catch (error) {
    console.error(`Erreur lors de la correction de la duplication du footer:`, error);
  }
  
  console.log("=== FIN DE LA CORRECTION DE LA DUPLICATION DU FOOTER ===");
};

// Exécuter la fonction principale
main();
