/**
 * Script pour corriger les problèmes d'importation et de chemins dans les composants
 * Ce script analyse et corrige les chemins d'importation incorrects dans les fichiers spécifiés
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
  "import { Lucide } from '../base-components'": "// Import de Lucide supprimé car non utilisé ou remplacé par Material-UI"
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

// Fonction principale
const main = () => {
  console.log("=== DÉBUT DE LA CORRECTION DES CHEMINS D'IMPORTATION ===");
  
  // Corriger chaque fichier
  for (const file of filesToFix) {
    fixFile(file);
  }
  
  console.log("=== FIN DE LA CORRECTION DES CHEMINS D'IMPORTATION ===");
};

// Exécuter la fonction principale
main();
