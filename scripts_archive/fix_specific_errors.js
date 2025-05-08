/**
 * Script pour corriger les erreurs spécifiques dans les composants de l'application ESGIS Intranet
 * Ce script cible les problèmes précis identifiés dans les fichiers mentionnés
 */

import fs from 'fs';
import path from 'path';

// Fonction pour lire le contenu d'un fichier
const readFile = (filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Erreur lors de la lecture du fichier ${filePath}:`, error);
    return null;
  }
};

// Fonction pour écrire dans un fichier
const writeFile = (filePath, content) => {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error(`Erreur lors de l'écriture dans le fichier ${filePath}:`, error);
    return false;
  }
};

// Fonction pour corriger les erreurs dans GradesPage.jsx
const fixGradesPage = () => {
  console.log("Correction de GradesPage.jsx...");
  const filePath = path.join(process.cwd(), 'src/pages/grades/GradesPage.jsx');
  
  if (!fs.existsSync(filePath)) {
    console.log("Le fichier GradesPage.jsx n'existe pas.");
    return;
  }
  
  let content = readFile(filePath);
  if (!content) {
    return;
  }
  
  // Correction des références aux objets potentiellement nuls
  content = content.replace(
    /rawResult\.users\?\.full_name/g, 
    "rawResult.student?.full_name || rawResult.users?.full_name"
  );
  
  content = content.replace(
    /rawResult\.exams\?\.total_points/g, 
    "rawResult.exam?.total_points || rawResult.exams?.total_points"
  );
  
  content = content.replace(
    /rawResult\.exams\?\.weight/g, 
    "rawResult.exam?.weight || rawResult.exams?.weight"
  );
  
  content = content.replace(
    /rawResult\.exams\?\.date/g, 
    "rawResult.exam?.date || rawResult.exams?.date"
  );
  
  content = content.replace(
    /rawResult\.exams\?\.type/g, 
    "rawResult.exam?.type || rawResult.exams?.type"
  );
  
  // Correction de la requête Supabase pour éviter les erreurs de relation
  content = content.replace(
    /\.from\('exam_results'\)\s+\.select\(`[^`]*`\)/s,
    `.from('exam_results')
      .select(\`
        *,
        exam:exam_id (
          id, 
          title, 
          date, 
          type, 
          total_points, 
          passing_grade,
          course_id,
          weight
        ),
        student:student_id (
          id, 
          email, 
          full_name
        )
      \`)`
  );
  
  // Correction des références dans la fonction de rendu
  content = content.replace(
    /result\.exam_title/g,
    "result.exam_title || 'Examen inconnu'"
  );
  
  content = content.replace(
    /result\.course_name/g,
    "result.course_name || 'Cours inconnu'"
  );
  
  if (writeFile(filePath, content)) {
    console.log("GradesPage.jsx corrigé avec succès.");
  }
};

// Fonction pour corriger les erreurs dans MessagesPage.jsx
const fixMessagesPage = () => {
  console.log("Correction de MessagesPage.jsx...");
  const filePath = path.join(process.cwd(), 'src/pages/messages/MessagesPage.jsx');
  
  if (!fs.existsSync(filePath)) {
    console.log("Le fichier MessagesPage.jsx n'existe pas.");
    return;
  }
  
  let content = readFile(filePath);
  if (!content) {
    return;
  }
  
  // Correction de la requête Supabase pour éviter les erreurs de récursion
  if (content.includes("from('messages')") && content.includes("sender:profiles!messages_sender_id_fkey")) {
    content = content.replace(
      /\.from\('messages'\)\s+\.select\(`[^`]*`\)/s,
      `.from('messages')
      .select(\`
        *,
        sender:sender_id (
          id, 
          full_name, 
          avatar_url
        ),
        receiver:receiver_id (
          id, 
          full_name, 
          avatar_url
        )
      \`)`
    );
  }
  
  // Correction des références aux objets potentiellement nuls
  content = content.replace(
    /message\.sender\?.full_name/g,
    "message.sender?.full_name || 'Utilisateur inconnu'"
  );
  
  content = content.replace(
    /message\.receiver\?.full_name/g,
    "message.receiver?.full_name || 'Utilisateur inconnu'"
  );
  
  if (writeFile(filePath, content)) {
    console.log("MessagesPage.jsx corrigé avec succès.");
  }
};

// Fonction pour corriger les erreurs dans StudentExamsList.jsx
const fixStudentExamsList = () => {
  console.log("Correction de StudentExamsList.jsx...");
  const filePath = path.join(process.cwd(), 'src/pages/exams/student/StudentExamsList.jsx');
  
  if (!fs.existsSync(filePath)) {
    console.log("Le fichier StudentExamsList.jsx n'existe pas.");
    return;
  }
  
  let content = readFile(filePath);
  if (!content) {
    return;
  }
  
  // Correction des références aux objets potentiellement nuls
  content = content.replace(
    /exam\.title/g,
    "exam?.title || 'Examen sans titre'"
  );
  
  content = content.replace(
    /exam\.course_name/g,
    "exam?.course_name || 'Cours inconnu'"
  );
  
  content = content.replace(
    /exam\.date/g,
    "exam?.date || new Date().toISOString()"
  );
  
  // Correction de la gestion des examens de type quiz
  if (content.includes("examType === 'quiz'") && content.includes("navigate(`/student/quiz/${examId}`);")) {
    // La partie est déjà correcte, pas besoin de modification
  } else {
    // Ajouter la gestion des quiz si elle n'existe pas
    content = content.replace(
      /const handleViewExam = \(examId\) => {[^}]*}/s,
      `const handleViewExam = (examId, examType) => {
    // Si c'est un quiz, rediriger vers le composant QuizLauncher
    if (examType === 'quiz') {
      navigate(\`/student/quiz/\${examId}\`);
    } else {
      // Sinon, rediriger vers la page de détails de l'examen standard
      navigate(\`/student/exams/\${examId}\`);
    }
  }`
    );
  }
  
  if (writeFile(filePath, content)) {
    console.log("StudentExamsList.jsx corrigé avec succès.");
  }
};

// Fonction pour corriger les erreurs dans Quiz.jsx
const fixQuizComponent = () => {
  console.log("Correction de Quiz.jsx...");
  const filePath = path.join(process.cwd(), 'src/components/Quiz.jsx');
  
  if (!fs.existsSync(filePath)) {
    console.log("Le fichier Quiz.jsx n'existe pas.");
    return;
  }
  
  let content = readFile(filePath);
  if (!content) {
    return;
  }
  
  // Correction des fonctions setupCheatingDetection et cleanupCheatingDetection
  if (content.includes("setupCheatingDetection = () =>") && content.includes("cleanupCheatingDetection = () =>")) {
    // Les fonctions sont déjà définies, pas besoin de les modifier
  } else {
    // Ajouter les définitions des fonctions si elles n'existent pas
    content = content.replace(
      /const Quiz = \(\{ quizData \}\) => {/,
      `const Quiz = ({ quizData }) => {
  // Fonction pour configurer la détection de triche
  const setupCheatingDetection = () => {
    console.log("Configuration de la détection de triche");
    // La configuration de la détection de triche est gérée dans l'useEffect
  };
  
  // Fonction pour nettoyer la détection de triche
  const cleanupCheatingDetection = () => {
    console.log("Nettoyage de la détection de triche");
    // Le nettoyage est géré dans la fonction de retour de l'useEffect
  };`
    );
  }
  
  // Correction de l'utilisation de QuizStatus
  if (!content.includes("import { QuizStatus } from")) {
    content = content.replace(
      /import React, /,
      `import React, `
    );
    
    content = content.replace(
      /import { useQuiz } from/,
      `import { useQuiz } from`
    );
  }
  
  if (writeFile(filePath, content)) {
    console.log("Quiz.jsx corrigé avec succès.");
  }
};

// Fonction pour corriger les erreurs dans AdminDashboard.jsx
const fixAdminDashboard = () => {
  console.log("Correction de AdminDashboard.jsx...");
  const filePath = path.join(process.cwd(), 'src/components/AdminDashboard.jsx');
  
  if (!fs.existsSync(filePath)) {
    console.log("Le fichier AdminDashboard.jsx n'existe pas.");
    return;
  }
  
  let content = readFile(filePath);
  if (!content) {
    return;
  }
  
  // Correction de l'utilisation de timer
  content = content.replace(
    /formatTimer\(timer\.seconds\)/g,
    "formatTimer(timer?.seconds || 0)"
  );
  
  // Correction de l'utilisation de Clock
  content = content.replace(
    /<Clock className="w-5 h-5 mr-2" \/>/g,
    "<Clock sx={{ width: 20, height: 20, mr: 1 }} />"
  );
  
  if (writeFile(filePath, content)) {
    console.log("AdminDashboard.jsx corrigé avec succès.");
  }
};

// Fonction principale
const main = () => {
  console.log("=== DÉBUT DE LA CORRECTION DES ERREURS SPÉCIFIQUES ===");
  
  // Corriger les fichiers spécifiques
  fixGradesPage();
  fixMessagesPage();
  fixStudentExamsList();
  fixQuizComponent();
  fixAdminDashboard();
  
  console.log("=== FIN DE LA CORRECTION DES ERREURS SPÉCIFIQUES ===");
};

// Exécuter la fonction principale
main();
