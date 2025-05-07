/**
 * Script pour corriger les problèmes dans les composants de l'application ESGIS Intranet
 * Ce script corrige les problèmes d'importation, de syntaxe, et de compatibilité
 */

import fs from 'fs';
import path from 'path';

// Liste des fichiers à corriger
const filesToFix = [
  'src/components/AdminDashboard.jsx',
  'src/components/Login.jsx',
  'src/components/QuestionCard.jsx',
  'src/components/Quiz.jsx',
  'src/components/QuizLauncher.jsx',
  'src/components/QuizNavigation.jsx',
  'src/components/QuizResults.jsx',
  'src/pages/exams/student/ExamResultsPage.jsx',
  'src/pages/exams/student/StudentExamsList.jsx',
  'src/pages/exams/student/TakeExamPage.jsx',
  'src/pages/exams/components/ExamBasicInfo.jsx',
  'src/pages/exams/components/ExamQuestions.jsx',
  'src/pages/exams/components/ExamScheduling.jsx',
  'src/pages/exams/components/ExamStudents.jsx',
  'src/pages/exams/components/ExamView.jsx',
  'src/pages/grades/GradesPage.jsx',
  'src/pages/messages/MessagesPage.jsx'
];

// Corrections des chemins d'importation
const importPathCorrections = {
  // Correction des importations de Supabase
  "from 'supabase'": "from '@/supabase'",
  "from '../supabase'": "from '@/supabase'",
  "from '../../supabase'": "from '@/supabase'",
  "from '../../../supabase'": "from '@/supabase'",
  "from '@/services/supabase'": "from '@/supabase'",
  
  // Correction des importations de contexte
  "from '../context/AuthContext'": "from '@/context/AuthContext'",
  "from '../../context/AuthContext'": "from '@/context/AuthContext'",
  "from '../../../context/AuthContext'": "from '@/context/AuthContext'",
  
  // Correction des importations de hooks
  "from '../hooks/useAuth'": "from '@/hooks/useAuth'",
  "from '../../hooks/useAuth'": "from '@/hooks/useAuth'",
  "from '../../../hooks/useAuth'": "from '@/hooks/useAuth'",
  
  "from '../hooks/useQuiz'": "from '@/hooks/useQuiz'",
  "from '../../hooks/useQuiz'": "from '@/hooks/useQuiz'",
  "from '../../../hooks/useQuiz'": "from '@/hooks/useQuiz'",
  
  // Correction des importations de utils
  "from '../utils/examUtils'": "from '@/utils/examUtils'",
  "from '../../utils/examUtils'": "from '@/utils/examUtils'",
  "from '../../../utils/examUtils'": "from '@/utils/examUtils'",
  
  // Correction des importations de composants
  "from 'lucide-react'": "from '@mui/icons-material'",
  "from '../base-components'": "from '@/components/base-components'",
  
  // Correction des importations de types
  "import { QuizStatus } from '../types'": "import { QuizStatus } from '@/types'",
  "import { QuizStatus } from '../../types'": "import { QuizStatus } from '@/types'",
  "import { QuizStatus } from '../../../types'": "import { QuizStatus } from '@/types'"
};

// Corrections des importations de composants spécifiques
const componentImportCorrections = {
  // Correction de l'importation de Clock depuis lucide-react
  "import { Clock } from 'lucide-react'": "import { AccessTime as Clock } from '@mui/icons-material'",
  "import { Clock } from '@mui/icons-material'": "import { AccessTime as Clock } from '@mui/icons-material'",
  
  // Correction de l'importation de Lucide
  "import { Lucide } from '../base-components'": "// Import de Lucide supprimé car non utilisé ou remplacé par Material-UI",
  
  // Correction des importations de date-fns
  "import { format, parseISO } from 'date-fns'": "import { format, parseISO } from 'date-fns'",
  "import { fr } from 'date-fns/locale'": "import { fr } from 'date-fns/locale'"
};

// Corrections spécifiques pour chaque fichier
const specificFileCorrections = {
  'src/components/AdminDashboard.jsx': [
    {
      // Correction de l'erreur liée à l'utilisation de Clock
      find: "formatTimer(timer.seconds)",
      replace: "formatTimer(timer?.seconds || 0)"
    },
    {
      // Correction de l'erreur liée à l'utilisation de Clock
      find: "<Clock className=\"w-5 h-5 mr-2\" />",
      replace: "<Clock sx={{ width: 20, height: 20, mr: 1 }} />"
    }
  ],
  'src/components/Login.jsx': [
    {
      // Correction de l'erreur liée à l'utilisation de Lucide
      find: "<Lucide",
      replace: "// <Lucide - Remplacé par Material-UI\n      <Box"
    }
  ],
  'src/components/Quiz.jsx': [
    {
      // Correction de l'erreur liée à la fonction setupCheatingDetection
      find: "setupCheatingDetection();",
      replace: "// La détection de triche est gérée dans l'effet\n    if (typeof setupCheatingDetection === 'function') {\n      setupCheatingDetection();\n    }"
    },
    {
      // Correction de l'erreur liée à la fonction cleanupCheatingDetection
      find: "cleanupCheatingDetection();",
      replace: "// Le nettoyage est géré dans la fonction de retour\n      if (typeof cleanupCheatingDetection === 'function') {\n        cleanupCheatingDetection();\n      }"
    }
  ],
  'src/pages/exams/student/StudentExamsList.jsx': [
    {
      // Correction de l'erreur liée à l'importation de useAuth
      find: "import { useAuth } from '@/context/AuthContext';",
      replace: "import { useAuth } from '@/hooks/useAuth';"
    }
  ]
};

// Fonction pour corriger un fichier
const fixFile = (filePath) => {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    
    // Vérifier si le fichier existe
    if (!fs.existsSync(fullPath)) {
      console.log(`Le fichier ${fullPath} n'existe pas, ignoré.`);
      return;
    }
    
    // Lire le contenu du fichier
    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;
    
    // Appliquer les corrections d'importation
    for (const [oldImport, newImport] of Object.entries(importPathCorrections)) {
      if (content.includes(oldImport)) {
        content = content.replace(new RegExp(oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newImport);
        modified = true;
      }
    }
    
    // Appliquer les corrections d'importation de composants spécifiques
    for (const [oldImport, newImport] of Object.entries(componentImportCorrections)) {
      if (content.includes(oldImport)) {
        content = content.replace(oldImport, newImport);
        modified = true;
      }
    }
    
    // Appliquer les corrections spécifiques pour ce fichier
    const fileName = path.basename(filePath);
    const fileKey = filePath;
    
    if (specificFileCorrections[fileKey]) {
      for (const correction of specificFileCorrections[fileKey]) {
        if (content.includes(correction.find)) {
          content = content.replace(correction.find, correction.replace);
          modified = true;
        }
      }
    }
    
    // Écrire le contenu modifié si des changements ont été effectués
    if (modified) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`Fichier ${filePath} corrigé avec succès.`);
    } else {
      console.log(`Aucune correction nécessaire pour ${filePath}.`);
    }
  } catch (error) {
    console.error(`Erreur lors de la correction du fichier ${filePath}:`, error);
  }
};

// Fonction pour créer un fichier types.js s'il n'existe pas
const createTypesFile = () => {
  const typesPath = path.join(process.cwd(), 'src/types.js');
  
  if (!fs.existsSync(typesPath)) {
    const typesContent = `/**
 * Définitions des types pour l'application ESGIS Intranet
 * @module types
 */

/**
 * Statuts possibles pour un quiz
 * @typedef {'not_started'|'in_progress'|'completed'} QuizStatus
 */
export const QuizStatus = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
};

/**
 * @typedef {Object} Question
 * @property {string} id - Identifiant de la question
 * @property {string} text - Texte de la question
 * @property {string[]} options - Options de réponse
 * @property {number} correctAnswer - Index de la réponse correcte
 */

/**
 * @typedef {Object} Quiz
 * @property {string} title - Titre du quiz
 * @property {string} description - Description du quiz
 * @property {number} duration - Durée du quiz en minutes
 * @property {Question[]} questions - Questions du quiz
 */

/**
 * @typedef {Object} UserAnswer
 * @property {string} questionId - Identifiant de la question
 * @property {number} answerIndex - Index de la réponse sélectionnée
 */

/**
 * @typedef {Object} QuizResult
 * @property {string} quizId - Identifiant du quiz
 * @property {string} userId - Identifiant de l'utilisateur
 * @property {number} score - Score obtenu
 * @property {number} totalPossibleScore - Score maximum possible
 * @property {number} cheatingAttempts - Nombre de tentatives de triche
 * @property {Object.<string, number>} userAnswers - Réponses de l'utilisateur
 */

/**
 * @typedef {Object} Exam
 * @property {number} id - Identifiant de l'examen
 * @property {string} title - Titre de l'examen
 * @property {string} description - Description de l'examen
 * @property {string} date - Date de l'examen
 * @property {number} duration - Durée de l'examen en minutes
 * @property {string} type - Type d'examen ('quiz', 'exam', etc.)
 * @property {string} status - Statut de l'examen ('scheduled', 'in_progress', 'completed', etc.)
 */

/**
 * @typedef {Object} StudentExam
 * @property {number} id - Identifiant de l'inscription à l'examen
 * @property {number} exam_id - Identifiant de l'examen
 * @property {string} student_id - Identifiant de l'étudiant
 * @property {string|null} seat_number - Numéro de place assigné
 * @property {'present'|'absent'|'late'|null} attendance_status - Statut de présence
 * @property {'not_started'|'in_progress'|'submitted'|null} attempt_status - Statut de la tentative
 */

/**
 * @typedef {Object} ExamResult
 * @property {number} id - Identifiant du résultat
 * @property {number} student_exam_id - Identifiant de l'inscription à l'examen
 * @property {string} student_id - Identifiant de l'étudiant
 * @property {number} exam_id - Identifiant de l'examen
 * @property {number} score - Score obtenu
 * @property {number} max_score - Score maximum possible
 */

export default {
  QuizStatus
};`;
    
    fs.writeFileSync(typesPath, typesContent, 'utf8');
    console.log(`Fichier src/types.js créé avec succès.`);
  }
};

// Fonction principale
const main = () => {
  console.log("=== DÉBUT DE LA CORRECTION DES COMPOSANTS ===");
  
  // Créer le fichier types.js s'il n'existe pas
  createTypesFile();
  
  // Corriger chaque fichier
  for (const file of filesToFix) {
    fixFile(file);
  }
  
  console.log("=== FIN DE LA CORRECTION DES COMPOSANTS ===");
};

// Exécuter la fonction principale
main();
