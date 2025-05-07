/**
 * Script pour ajouter le quiz de virtualisation dans la liste des examens
 * Ce script s'assure que le quiz "Virtualization Cloud et Datacenter advanced" 
 * est correctement affiché dans la liste des examens des étudiants
 */

import fs from 'fs';
import path from 'path';
import { supabase } from './src/supabase.js';

// Fonction principale
const main = async () => {
  console.log("=== AJOUT DU QUIZ DE VIRTUALISATION DANS LES EXAMENS ===");
  
  try {
    // 1. Vérifier si le fichier de données du quiz existe
    const quizDataPath = path.join(process.cwd(), 'src/data/virtualizationQuizData.js');
    let virtualizationQuizExists = false;
    
    if (fs.existsSync(quizDataPath)) {
      console.log(`Le fichier de données du quiz existe: ${quizDataPath}`);
      virtualizationQuizExists = true;
    } else {
      console.log(`Le fichier de données du quiz n'existe pas. Création du fichier...`);
      
      // Créer le dossier data s'il n'existe pas
      const dataDir = path.join(process.cwd(), 'src/data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Contenu du fichier de données du quiz
      const quizDataContent = `/**
 * Données du quiz "Virtualization Cloud et Datacenter advanced"
 * @module data/virtualizationQuizData
 */

export const virtualizationQuizData = {
  title: "Quiz - Virtualization Cloud et Datacenter advanced",
  description: "Quiz sur les concepts avancés de virtualisation, cloud computing et datacenter",
  duration: 45, // minutes
  questions: [
    {
      id: "vq1",
      text: "Quelle technologie permet de créer plusieurs machines virtuelles sur un seul serveur physique?",
      options: [
        "Containerisation",
        "Hyperviseur",
        "Microservices",
        "Orchestration"
      ],
      correctAnswer: 1 // Hyperviseur
    },
    {
      id: "vq2",
      text: "Quelle est la différence fondamentale entre la virtualisation et la containerisation?",
      options: [
        "La virtualisation est plus récente que la containerisation",
        "La virtualisation émule le matériel complet alors que la containerisation partage le noyau du système d'exploitation",
        "La containerisation nécessite plus de ressources que la virtualisation",
        "La virtualisation ne fonctionne que sur Linux"
      ],
      correctAnswer: 1 // La virtualisation émule le matériel complet...
    },
    {
      id: "vq3",
      text: "Quel est l'avantage principal du cloud computing par rapport à l'infrastructure traditionnelle?",
      options: [
        "Coût initial plus faible",
        "Sécurité absolue",
        "Élasticité et mise à l'échelle automatique",
        "Performances toujours supérieures"
      ],
      correctAnswer: 2 // Élasticité et mise à l'échelle automatique
    },
    {
      id: "vq4",
      text: "Qu'est-ce que l'hyperconvergence dans un datacenter?",
      options: [
        "Une technique de refroidissement avancée",
        "L'intégration du stockage, du calcul et du réseau dans une seule solution",
        "Un protocole de communication entre datacenters",
        "Une méthode de virtualisation spécifique à VMware"
      ],
      correctAnswer: 1 // L'intégration du stockage, du calcul et du réseau...
    },
    {
      id: "vq5",
      text: "Quel service AWS permet de déployer des machines virtuelles dans le cloud?",
      options: [
        "AWS Lambda",
        "Amazon EC2",
        "Amazon S3",
        "AWS Glue"
      ],
      correctAnswer: 1 // Amazon EC2
    },
    {
      id: "vq6",
      text: "Qu'est-ce que le PaaS (Platform as a Service)?",
      options: [
        "Un modèle où l'utilisateur gère tout, du matériel aux applications",
        "Un modèle où l'utilisateur ne gère que les applications et les données",
        "Un modèle où l'utilisateur loue du matériel physique",
        "Un modèle où l'utilisateur paie uniquement pour les fonctions exécutées"
      ],
      correctAnswer: 1 // Un modèle où l'utilisateur ne gère que les applications...
    },
    {
      id: "vq7",
      text: "Quelle technologie est à la base de Docker?",
      options: [
        "Les conteneurs LXC",
        "Les machines virtuelles KVM",
        "Les zones Solaris",
        "Les hyperviseurs de type 1"
      ],
      correctAnswer: 0 // Les conteneurs LXC
    },
    {
      id: "vq8",
      text: "Qu'est-ce que Kubernetes?",
      options: [
        "Un hyperviseur open-source",
        "Une plateforme de virtualisation propriétaire",
        "Un système d'orchestration de conteneurs",
        "Un service de stockage cloud"
      ],
      correctAnswer: 2 // Un système d'orchestration de conteneurs
    },
    {
      id: "vq9",
      text: "Quelle est la principale caractéristique d'un datacenter Tier IV?",
      options: [
        "Redondance partielle",
        "Tolérance aux pannes complète",
        "Coût minimal",
        "Absence de maintenance"
      ],
      correctAnswer: 1 // Tolérance aux pannes complète
    },
    {
      id: "vq10",
      text: "Quelle technologie permet la migration à chaud d'une machine virtuelle?",
      options: [
        "vMotion",
        "Hot Swap",
        "Live Migration",
        "Dynamic Transfer"
      ],
      correctAnswer: 2 // Live Migration
    }
  ]
};
`;
      
      // Écrire le fichier de données du quiz
      fs.writeFileSync(quizDataPath, quizDataContent, 'utf8');
      console.log(`Fichier de données du quiz créé: ${quizDataPath}`);
      virtualizationQuizExists = true;
    }
    
    // 2. Vérifier et modifier le composant StudentExamsList pour afficher le quiz
    const studentExamsListPath = path.join(process.cwd(), 'src/pages/exams/student/StudentExamsList.jsx');
    
    if (fs.existsSync(studentExamsListPath)) {
      let studentExamsListContent = fs.readFileSync(studentExamsListPath, 'utf8');
      
      // Vérifier si le quiz de virtualisation est déjà mentionné explicitement
      if (!studentExamsListContent.includes('Virtualization Cloud et Datacenter advanced')) {
        console.log(`Ajout du quiz de virtualisation dans StudentExamsList.jsx...`);
        
        // Ajouter l'importation du fichier de données du quiz si nécessaire
        if (!studentExamsListContent.includes('import { virtualizationQuizData }')) {
          const importStatement = `import { virtualizationQuizData } from '../../../data/virtualizationQuizData';\n`;
          studentExamsListContent = studentExamsListContent.replace(
            'import React, { useState, useEffect, useRef } from \'react\';',
            'import React, { useState, useEffect, useRef } from \'react\';\n' + importStatement
          );
        }
        
        // Ajouter une fonction pour vérifier si le quiz de virtualisation est disponible
        if (!studentExamsListContent.includes('ensureVirtualizationQuizAvailable')) {
          const virtualizationQuizFunction = `
  // Assurer que le quiz de virtualisation est disponible dans la liste des examens
  const ensureVirtualizationQuizAvailable = (exams) => {
    // Vérifier si le quiz de virtualisation existe déjà dans la liste
    const virtualizationQuizExists = exams.some(exam => 
      exam.title?.includes('Virtualization') || 
      exam.name?.includes('Virtualization')
    );
    
    // Si le quiz n'existe pas, l'ajouter à la liste
    if (!virtualizationQuizExists) {
      const virtualizationQuiz = {
        id: 'virtualization-quiz',
        title: 'Virtualization Cloud et Datacenter advanced',
        description: 'Quiz sur les concepts avancés de virtualisation, cloud computing et datacenter',
        date: new Date().toISOString(),
        duration: 45,
        status: 'available',
        type: 'quiz',
        course: {
          name: 'Cloud Computing et Virtualisation'
        }
      };
      
      return [...exams, virtualizationQuiz];
    }
    
    return exams;
  };
`;
          
          // Trouver un bon endroit pour insérer la fonction
          const insertPosition = studentExamsListContent.indexOf('const StudentExamsList = () => {');
          if (insertPosition !== -1) {
            studentExamsListContent = 
              studentExamsListContent.slice(0, insertPosition) + 
              virtualizationQuizFunction + 
              studentExamsListContent.slice(insertPosition);
          }
        }
        
        // Modifier la fonction fetchExams pour inclure le quiz de virtualisation
        if (!studentExamsListContent.includes('ensureVirtualizationQuizAvailable(')) {
          studentExamsListContent = studentExamsListContent.replace(
            'setExams(availableExams);',
            'setExams(ensureVirtualizationQuizAvailable(availableExams));'
          );
        }
        
        // Écrire le contenu modifié dans le fichier
        fs.writeFileSync(studentExamsListPath, studentExamsListContent, 'utf8');
        console.log(`Quiz de virtualisation ajouté dans ${studentExamsListPath}`);
      } else {
        console.log(`Le quiz de virtualisation est déjà mentionné dans ${studentExamsListPath}`);
      }
    } else {
      console.error(`Le fichier ${studentExamsListPath} n'existe pas.`);
    }
    
    // 3. Vérifier et modifier le composant QuizLauncher pour charger le quiz de virtualisation
    const quizLauncherPath = path.join(process.cwd(), 'src/components/QuizLauncher.jsx');
    
    if (fs.existsSync(quizLauncherPath)) {
      let quizLauncherContent = fs.readFileSync(quizLauncherPath, 'utf8');
      
      // Vérifier si le quiz de virtualisation est déjà mentionné
      if (!quizLauncherContent.includes('virtualizationQuizData')) {
        console.log(`Ajout du quiz de virtualisation dans QuizLauncher.jsx...`);
        
        // Ajouter l'importation du fichier de données du quiz si nécessaire
        if (!quizLauncherContent.includes('import { virtualizationQuizData }')) {
          const importStatement = `import { virtualizationQuizData } from '../data/virtualizationQuizData';\n`;
          quizLauncherContent = quizLauncherContent.replace(
            'import React, { useEffect, useState } from \'react\';',
            'import React, { useEffect, useState } from \'react\';\n' + importStatement
          );
        }
        
        // Modifier la logique pour charger le quiz de virtualisation
        if (!quizLauncherContent.includes('examId.includes(\'virtualization\')')) {
          quizLauncherContent = quizLauncherContent.replace(
            'if (examId === \'quiz1\') {',
            'if (examId === \'quiz1\' || examId.includes(\'virtualization\')) {'
          );
          
          // Ajouter le chargement du quiz de virtualisation
          quizLauncherContent = quizLauncherContent.replace(
            'setQuizData(sampleQuizData);',
            'setQuizData(examId.includes(\'virtualization\') ? virtualizationQuizData : sampleQuizData);'
          );
        }
        
        // Écrire le contenu modifié dans le fichier
        fs.writeFileSync(quizLauncherPath, quizLauncherContent, 'utf8');
        console.log(`Quiz de virtualisation ajouté dans ${quizLauncherPath}`);
      } else {
        console.log(`Le quiz de virtualisation est déjà mentionné dans ${quizLauncherPath}`);
      }
    } else {
      console.error(`Le fichier ${quizLauncherPath} n'existe pas.`);
    }
    
    console.log("Ajout du quiz de virtualisation terminé avec succès.");
  } catch (error) {
    console.error(`Erreur lors de l'ajout du quiz de virtualisation:`, error);
  }
  
  console.log("=== FIN DE L'AJOUT DU QUIZ DE VIRTUALISATION ===");
};

// Exécuter la fonction principale
main();
