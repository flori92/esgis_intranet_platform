import fs from 'fs';
import path from 'path';

/**
 * Script pour mettre à jour le logo ESGIS dans le projet
 * Ce script va créer les fichiers SVG pour le logo ESGIS basé sur les images fournies
 */

// Chemins des fichiers logo
const logoWhiteSvgPath = path.join(process.cwd(), 'public', 'images', 'logo-esgis-white.svg');
const logoPngPath = path.join(process.cwd(), 'public', 'images', 'esgis-logo.png');
const logoOfficialPath = path.join(process.cwd(), 'public', 'images', 'logo-esgis-officiel.jpg');

// Contenu du logo ESGIS en SVG (version blanche pour le thème sombre)
const logoWhiteSvgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" width="240" height="60" viewBox="0 0 240 60" fill="none">
  <g fill="#FFFFFF">
    <!-- Texte ESGIS stylisé -->
    <path d="M10 10H40V15H15V20H35V25H15V30H40V35H10V10Z" />
    <path d="M45 10H55C60 10 65 15 65 22.5C65 30 60 35 55 35H45V10ZM55 30C57.5 30 60 27.5 60 22.5C60 17.5 57.5 15 55 15H50V30H55Z" />
    <path d="M70 10H100V15H85V20H95V25H85V30H100V35H70V10Z" />
    <path d="M105 10H115V30H130V35H105V10Z" />
    <path d="M135 10H165V15H150V20H160V25H150V30H165V35H135V10Z" />
    
    <!-- Chapeau de diplômé stylisé (inspiré du logo fourni) -->
    <path d="M175 15L190 10L205 15L190 20L175 15Z" />
    <path d="M190 25V20L205 15V20L190 25Z" />
    <path d="M185 30L190 25L195 30L190 35L185 30Z" />
    
    <!-- Slogan -->
    <text x="120" y="50" font-family="Arial, sans-serif" font-size="6" text-anchor="middle">ÉCOLE SUPÉRIEURE DE GESTION D'INFORMATIQUE ET DES SCIENCES</text>
  </g>
</svg>`;

/**
 * Fonction pour mettre à jour le logo ESGIS
 */
function updateLogo() {
  console.log('=== MISE À JOUR DU LOGO ESGIS ===');
  
  try {
    // Créer les répertoires nécessaires s'ils n'existent pas
    const imagesDir = path.join(process.cwd(), 'public', 'images');
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }
    
    // Écrire le logo SVG blanc
    fs.writeFileSync(logoWhiteSvgPath, logoWhiteSvgContent);
    console.log(`\n✅ Logo SVG blanc créé: ${logoWhiteSvgPath}`);
    
    console.log('\n⚠️ Pour les logos PNG et JPG, veuillez les télécharger manuellement depuis les images fournies.');
    console.log('⚠️ Placez-les dans le répertoire public/images/ avec les noms suivants:');
    console.log('   - esgis-logo.png');
    console.log('   - logo-esgis-officiel.jpg');
    
    console.log('\n✨ Logo SVG ESGIS mis à jour avec succès!');
    console.log('📝 N\'oubliez pas de committer et pousser ces modifications vers GitHub.');
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du logo:', error);
  }
}

// Exécuter la fonction principale
updateLogo();
