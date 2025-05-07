/**
 * Script pour implémenter la randomisation des questions du quiz de virtualisation
 * Ce script modifie le fichier virtualizationQuizData.js pour ajouter la fonction de randomisation
 * et met à jour le composant QuizLauncher pour l'utiliser
 */

import fs from 'fs';
import path from 'path';

// Fonction principale
const main = async () => {
  console.log("=== IMPLÉMENTATION DE LA RANDOMISATION DES QUESTIONS DU QUIZ DE VIRTUALISATION ===");
  
  try {
    // 1. Vérifier si le fichier de données du quiz existe
    const quizDataPath = path.join(process.cwd(), 'src/data/virtualizationQuizData.js');
    
    if (!fs.existsSync(quizDataPath)) {
      console.error(`Le fichier ${quizDataPath} n'existe pas.`);
      return;
    }
    
    // 2. Lire le contenu du fichier de données du quiz
    let quizDataContent = fs.readFileSync(quizDataPath, 'utf8');
    
    // 3. Vérifier si la fonction de randomisation existe déjà
    if (!quizDataContent.includes('getRandomizedQuestions')) {
      console.log("Ajout de la fonction de randomisation des questions...");
      
      // Ajouter la fonction de randomisation après l'export du virtualizationQuizData
      const randomizationFunction = `

/**
 * Fonction pour obtenir un sous-ensemble aléatoire de questions
 * @param {number} count - Nombre de questions à sélectionner (par défaut: 10)
 * @returns {Array} Sous-ensemble aléatoire de questions
 */
export const getRandomizedQuestions = (count = 10) => {
  // Copier le tableau de questions pour ne pas modifier l'original
  const allQuestions = [...virtualizationQuizData.questions];
  
  // Mélanger les questions avec l'algorithme de Fisher-Yates
  for (let i = allQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
  }
  
  // Retourner le nombre de questions demandé
  return allQuestions.slice(0, Math.min(count, allQuestions.length));
};
`;
      
      // Ajouter la fonction après l'export du virtualizationQuizData
      quizDataContent = quizDataContent.replace(
        /export default virtualizationQuizData;/,
        randomizationFunction + '\nexport default virtualizationQuizData;'
      );
      
      // Écrire le contenu modifié dans le fichier
      fs.writeFileSync(quizDataPath, quizDataContent, 'utf8');
      console.log(`Fonction de randomisation ajoutée dans ${quizDataPath}`);
    } else {
      console.log(`La fonction de randomisation existe déjà dans ${quizDataPath}`);
    }
    
    // 4. Modifier le composant QuizLauncher pour utiliser la randomisation
    const quizLauncherPath = path.join(process.cwd(), 'src/components/QuizLauncher.jsx');
    
    if (fs.existsSync(quizLauncherPath)) {
      let quizLauncherContent = fs.readFileSync(quizLauncherPath, 'utf8');
      
      // Vérifier si le composant importe déjà la fonction de randomisation
      if (!quizLauncherContent.includes('getRandomizedQuestions')) {
        console.log("Mise à jour de l'importation dans QuizLauncher.jsx...");
        
        // Modifier l'importation pour inclure la fonction de randomisation
        quizLauncherContent = quizLauncherContent.replace(
          /import { virtualizationQuizData } from '\.\.\/data\/virtualizationQuizData';/,
          `import { virtualizationQuizData, getRandomizedQuestions } from '../data/virtualizationQuizData';`
        );
        
        // Écrire le contenu modifié dans le fichier
        fs.writeFileSync(quizLauncherPath, quizLauncherContent, 'utf8');
        console.log(`Importation mise à jour dans ${quizLauncherPath}`);
      } else {
        console.log(`L'importation de getRandomizedQuestions existe déjà dans ${quizLauncherPath}`);
      }
      
      // Modifier la fonction fetchQuizData pour utiliser la randomisation
      if (!quizLauncherContent.includes('getRandomizedQuestions(20)')) {
        console.log("Mise à jour de la fonction fetchQuizData pour utiliser la randomisation...");
        
        // Remplacer le chargement du quiz de virtualisation par une version randomisée
        quizLauncherContent = quizLauncherContent.replace(
          /if \(examId === 'quiz1' \|\| examId\.includes\('virtualization'\)\) {[\s\S]*?setQuizData\(virtualizationQuizData\);[\s\S]*?setLoading\(false\);[\s\S]*?return;[\s\S]*?}/,
          `if (examId === 'quiz1' || examId.includes('virtualization')) {
          console.log('Chargement du quiz Virtualization Cloud et Datacenter advanced avec randomisation');
          
          // Créer une copie du quiz avec des questions randomisées
          const randomizedQuestions = getRandomizedQuestions(20); // Sélectionner 20 questions aléatoires
          console.log(\`Sélection de \${randomizedQuestions.length} questions aléatoires parmi \${virtualizationQuizData.questions.length} disponibles\`);
          
          const randomizedQuiz = {
            ...virtualizationQuizData,
            questions: randomizedQuestions
          };
          
          setQuizData(randomizedQuiz);
          setLoading(false);
          return;
        }`
        );
        
        // Remplacer également la solution de secours pour utiliser la randomisation
        quizLauncherContent = quizLauncherContent.replace(
          /if \(examId\.toLowerCase\(\)\.includes\('virtual'\) \|\| examId\.toLowerCase\(\)\.includes\('cloud'\)\) {[\s\S]*?console\.log\('Utilisation des données de secours pour le quiz Virtualization'\);[\s\S]*?setQuizData\(virtualizationQuizData\);[\s\S]*?}/,
          `if (examId.toLowerCase().includes('virtual') || examId.toLowerCase().includes('cloud')) {
          console.log('Utilisation des données de secours pour le quiz Virtualization avec randomisation');
          
          // Créer une copie du quiz avec des questions randomisées
          const randomizedQuestions = getRandomizedQuestions(20); // Sélectionner 20 questions aléatoires
          console.log(\`Sélection de \${randomizedQuestions.length} questions aléatoires parmi \${virtualizationQuizData.questions.length} disponibles\`);
          
          const randomizedQuiz = {
            ...virtualizationQuizData,
            questions: randomizedQuestions
          };
          
          setQuizData(randomizedQuiz);
        }`
        );
        
        // Écrire le contenu modifié dans le fichier
        fs.writeFileSync(quizLauncherPath, quizLauncherContent, 'utf8');
        console.log(`Randomisation des questions implémentée dans ${quizLauncherPath}`);
      } else {
        console.log(`La randomisation des questions est déjà implémentée dans ${quizLauncherPath}`);
      }
    } else {
      console.error(`Le fichier ${quizLauncherPath} n'existe pas.`);
    }
    
    // 5. Vérifier si le composant Quiz.jsx utilise correctement les questions randomisées
    const quizComponentPath = path.join(process.cwd(), 'src/components/Quiz.jsx');
    
    if (fs.existsSync(quizComponentPath)) {
      const quizComponentContent = fs.readFileSync(quizComponentPath, 'utf8');
      
      // Vérifier si le composant utilise correctement les questions
      if (quizComponentContent.includes('questions = quizData?.questions || contextQuestions')) {
        console.log(`Le composant Quiz.jsx utilise correctement les questions fournies via props.`);
      } else {
        console.log(`ATTENTION: Le composant Quiz.jsx pourrait ne pas utiliser correctement les questions randomisées.`);
        console.log(`Veuillez vérifier manuellement le fichier ${quizComponentPath}.`);
      }
    } else {
      console.error(`Le fichier ${quizComponentPath} n'existe pas.`);
    }
    
    console.log("\nRandomisation des questions du quiz de virtualisation implémentée avec succès !");
    console.log("Maintenant, chaque étudiant recevra un sous-ensemble aléatoire de 20 questions parmi toutes les questions disponibles.");
    console.log("Cela empêchera efficacement la communication des réponses entre les étudiants.");
    
  } catch (error) {
    console.error(`Erreur lors de l'implémentation de la randomisation:`, error);
  }
  
  console.log("=== FIN DE L'IMPLÉMENTATION DE LA RANDOMISATION ===");
};

// Exécuter la fonction principale
main();
