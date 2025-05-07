/**
 * Script pour implémenter la randomisation des questions du quiz de virtualisation
 * conformément à l'implémentation originale du projet
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
    
    // 3. Ajouter la fonction de randomisation
    if (!quizDataContent.includes('getRandomizedQuestions')) {
      console.log("Ajout de la fonction de randomisation des questions...");
      
      // Ajouter la fonction de randomisation après l'export du virtualizationQuizData
      const randomizationFunction = `

/**
 * Fonction pour obtenir un sous-ensemble aléatoire de questions
 * Cette fonction utilise l'algorithme de Fisher-Yates pour mélanger les questions
 * et garantir que chaque étudiant reçoit un ensemble différent de questions
 * @param {Array} questions - Liste complète des questions
 * @param {number} count - Nombre de questions à sélectionner (par défaut: toutes)
 * @returns {Array} Sous-ensemble aléatoire de questions
 */
export const getRandomizedQuestions = (questions, count = questions.length) => {
  // Copier le tableau de questions pour ne pas modifier l'original
  const allQuestions = [...questions];
  
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
    
    // 4. Modifier le composant QuizContext pour utiliser la randomisation
    const quizContextPath = path.join(process.cwd(), 'src/context/QuizContext.jsx');
    
    if (fs.existsSync(quizContextPath)) {
      let quizContextContent = fs.readFileSync(quizContextPath, 'utf8');
      
      // Vérifier si le contexte importe déjà la fonction de randomisation
      if (!quizContextContent.includes('getRandomizedQuestions')) {
        console.log("Mise à jour des importations dans QuizContext.jsx...");
        
        // Ajouter l'importation de la fonction de randomisation
        if (quizContextContent.includes("import * as quizService from '../api/quiz';")) {
          quizContextContent = quizContextContent.replace(
            "import * as quizService from '../api/quiz';",
            "import * as quizService from '../api/quiz';\nimport { getRandomizedQuestions } from '../data/virtualizationQuizData';"
          );
        } else {
          console.log("ATTENTION: Impossible de trouver l'emplacement pour ajouter l'importation dans QuizContext.jsx");
        }
        
        // Modifier la fonction startQuiz pour utiliser la randomisation
        if (quizContextContent.includes("setQuestions(examQuestions);")) {
          quizContextContent = quizContextContent.replace(
            "setQuestions(examQuestions);",
            "// Randomiser les questions pour éviter la communication des réponses entre étudiants\nconst randomizedQuestions = getRandomizedQuestions(examQuestions);\nconsole.log(`Questions randomisées: ${randomizedQuestions.length}`);\nsetQuestions(randomizedQuestions);"
          );
        } else {
          console.log("ATTENTION: Impossible de trouver l'emplacement pour modifier la fonction startQuiz dans QuizContext.jsx");
        }
        
        // Écrire le contenu modifié dans le fichier
        fs.writeFileSync(quizContextPath, quizContextContent, 'utf8');
        console.log(`Randomisation des questions implémentée dans ${quizContextPath}`);
      } else {
        console.log(`La randomisation des questions est déjà implémentée dans ${quizContextPath}`);
      }
    } else {
      console.error(`Le fichier ${quizContextPath} n'existe pas.`);
    }
    
    // 5. Modifier le composant QuizLauncher pour utiliser la randomisation
    const quizLauncherPath = path.join(process.cwd(), 'src/components/QuizLauncher.jsx');
    
    if (fs.existsSync(quizLauncherPath)) {
      let quizLauncherContent = fs.readFileSync(quizLauncherPath, 'utf8');
      
      // Vérifier si le composant importe déjà la fonction de randomisation
      if (!quizLauncherContent.includes('getRandomizedQuestions')) {
        console.log("Mise à jour des importations dans QuizLauncher.jsx...");
        
        // Modifier l'importation pour inclure la fonction de randomisation
        quizLauncherContent = quizLauncherContent.replace(
          /import { virtualizationQuizData } from '\.\.\/data\/virtualizationQuizData';/,
          `import { virtualizationQuizData, getRandomizedQuestions } from '../data/virtualizationQuizData';`
        );
        
        // Modifier la fonction fetchQuizData pour utiliser la randomisation
        quizLauncherContent = quizLauncherContent.replace(
          /if \(examId === 'quiz1' \|\| examId\.includes\('virtualization'\)\) {[\s\S]*?console\.log\('Chargement du quiz Virtualization Cloud et Datacenter advanced'\);[\s\S]*?setQuizData\(virtualizationQuizData\);/,
          `if (examId === 'quiz1' || examId.includes('virtualization')) {
          console.log('Chargement du quiz Virtualization Cloud et Datacenter advanced');
          
          // Randomiser les questions pour éviter la communication des réponses entre étudiants
          const randomizedQuestions = getRandomizedQuestions(virtualizationQuizData.questions);
          console.log(\`Questions randomisées: \${randomizedQuestions.length}\`);
          
          const randomizedQuiz = {
            ...virtualizationQuizData,
            questions: randomizedQuestions
          };
          
          setQuizData(randomizedQuiz);`
        );
        
        // Modifier également la solution de secours pour utiliser la randomisation
        quizLauncherContent = quizLauncherContent.replace(
          /if \(examId\.toLowerCase\(\)\.includes\('virtual'\) \|\| examId\.toLowerCase\(\)\.includes\('cloud'\)\) {[\s\S]*?console\.log\('Utilisation des données de secours pour le quiz Virtualization'\);[\s\S]*?setQuizData\(virtualizationQuizData\);/,
          `if (examId.toLowerCase().includes('virtual') || examId.toLowerCase().includes('cloud')) {
          console.log('Utilisation des données de secours pour le quiz Virtualization');
          
          // Randomiser les questions pour éviter la communication des réponses entre étudiants
          const randomizedQuestions = getRandomizedQuestions(virtualizationQuizData.questions);
          console.log(\`Questions randomisées: \${randomizedQuestions.length}\`);
          
          const randomizedQuiz = {
            ...virtualizationQuizData,
            questions: randomizedQuestions
          };
          
          setQuizData(randomizedQuiz);`
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
    
    console.log("\nRandomisation des questions du quiz de virtualisation implémentée avec succès !");
    console.log("Maintenant, chaque étudiant recevra un ensemble aléatoire de questions.");
    console.log("Cela empêchera efficacement la communication des réponses entre les étudiants.");
    
  } catch (error) {
    console.error(`Erreur lors de l'implémentation de la randomisation:`, error);
  }
  
  console.log("=== FIN DE L'IMPLÉMENTATION DE LA RANDOMISATION ===");
};

// Exécuter la fonction principale
main();
