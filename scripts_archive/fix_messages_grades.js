/**
 * Script pour corriger les problèmes spécifiques dans les pages de messages et de notes
 * Ce script résout les problèmes de requêtes Supabase et de gestion des données
 */

import fs from 'fs';
import path from 'path';

// Liste des fichiers à corriger
const filesToFix = [
  'src/pages/messages/MessagesPage.jsx',
  'src/pages/grades/GradesPage.jsx'
];

// Corrections spécifiques pour chaque fichier
const specificFileCorrections = {
  'src/pages/messages/MessagesPage.jsx': [
    {
      // Correction de la requête Supabase pour éviter les erreurs de récursion
      find: ".select(`\n      *,\n      sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url),\n      receiver:profiles!messages_receiver_id_fkey(id, full_name, avatar_url)\n    `)",
      replace: ".select(`\n      *,\n      sender:sender_id(id, full_name, avatar_url),\n      receiver:receiver_id(id, full_name, avatar_url)\n    `)"
    },
    {
      // Correction de l'accès aux données des expéditeurs/destinataires
      find: "message.sender?.full_name || 'Utilisateur inconnu'",
      replace: "message.sender?.full_name || message.sender_id || 'Utilisateur inconnu'"
    },
    {
      // Correction de l'accès aux données des expéditeurs/destinataires
      find: "message.receiver?.full_name || 'Utilisateur inconnu'",
      replace: "message.receiver?.full_name || message.receiver_id || 'Utilisateur inconnu'"
    }
  ],
  'src/pages/grades/GradesPage.jsx': [
    {
      // Correction de la requête Supabase pour éviter les erreurs de relation
      find: ".select(`\n      *,\n      exam:exams!exam_results_exam_id_fkey(id, title, date, type, total_points, passing_grade),\n      student:users!exam_results_student_id_fkey(id, email, profiles(full_name))\n    `)",
      replace: ".select(`\n      *,\n      exam:exam_id(id, title, date, type, total_points, passing_grade),\n      student:student_id(id, email, full_name)\n    `)"
    },
    {
      // Correction de l'accès aux données des examens
      find: "result.exam?.title || 'Examen inconnu'",
      replace: "result.exam?.title || 'Examen inconnu'"
    },
    {
      // Correction de l'accès aux données des étudiants
      find: "result.student?.profiles?.full_name || result.student?.email || 'Étudiant inconnu'",
      replace: "result.student?.full_name || result.student?.email || 'Étudiant inconnu'"
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
    
    // Appliquer les corrections spécifiques pour ce fichier
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

// Fonction principale
const main = () => {
  console.log("=== DÉBUT DE LA CORRECTION DES PAGES DE MESSAGES ET DE NOTES ===");
  
  // Corriger chaque fichier
  for (const file of filesToFix) {
    fixFile(file);
  }
  
  console.log("=== FIN DE LA CORRECTION DES PAGES DE MESSAGES ET DE NOTES ===");
};

// Exécuter la fonction principale
main();
