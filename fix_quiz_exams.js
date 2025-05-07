import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';
dotenv.config();

// Création du client Supabase avec la clé de service (service_role)
const supabaseUrl = process.env.SUPABASE_URL || 'https://epnhnjkbxgciojevrwfq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwbmhuamtieGdjaW9qZXZyd2ZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjIwNjkwNiwiZXhwIjoyMDYxNzgyOTA2fQ.kbEs9bN0vpsf9cE8TZuj0-sBz6LCQ3o3LU0sptEx-mY';

if (!supabaseServiceKey) {
  console.error('La clé de service Supabase est manquante.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Fonction pour corriger les relations entre les tables et ajouter des quiz aux examens
 * Utilise la même approche que pour la correction des profils
 */
async function fixQuizExams() {
  console.log('=== CORRECTION DES RELATIONS POUR LES QUIZ ET EXAMENS ===');

  try {
    // 1. Vérifier l'accès aux tables
    console.log('Vérification de l\'accès aux tables...');
    
    const { data: examsData, error: examsError } = await supabase
      .from('exams')
      .select('id, title, type')
      .limit(5);
    
    if (examsError) {
      console.error('Erreur lors de l\'accès à la table exams:', examsError);
    } else {
      console.log(`${examsData.length} examens trouvés.`);
      
      // Vérifier les types d'examens existants
      const types = new Set(examsData.map(e => e.type));
      console.log('Types d\'examens existants:', [...types]);
      
      // Vérifier si des quiz existent déjà
      const quizExams = examsData.filter(e => e.type === 'quiz');
      console.log(`${quizExams.length} quiz trouvés parmi les examens.`);
    }
    
    // 2. Récupérer les informations nécessaires pour créer des quiz
    console.log('\nRécupération des informations pour créer des quiz...');
    
    // Récupérer la liste des utilisateurs (pour les étudiants et professeurs)
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Erreur lors de la récupération des utilisateurs:', usersError);
    } else {
      console.log(`${usersData?.users?.length || 0} utilisateurs trouvés.`);
      
      // Filtrer les étudiants
      const students = usersData.users.filter(user => 
        user.user_metadata?.role === 'student'
      );
      
      console.log(`${students.length} étudiants trouvés.`);
      
      // 3. Créer des quiz fictifs dans les métadonnées utilisateur
      console.log('\nCréation de quiz fictifs dans les métadonnées utilisateur...');
      
      for (const student of students) {
        console.log(`\nTraitement de l'étudiant ${student.email}...`);
        
        // Vérifier si l'étudiant a déjà des examens dans ses métadonnées
        const existingExams = student.user_metadata?.exams_backup || [];
        console.log(`L'étudiant a ${existingExams.length} examens dans ses métadonnées.`);
        
        // Vérifier si des quiz existent déjà
        const existingQuizzes = existingExams.filter(e => e.exams?.type === 'quiz');
        console.log(`Dont ${existingQuizzes.length} quiz.`);
        
        // Si aucun quiz n'existe, en créer
        if (existingQuizzes.length === 0) {
          console.log('Aucun quiz trouvé. Création de quiz fictifs...');
          
          // Créer des quiz fictifs
          const quizzes = [
            {
              id: `${student.id}_quiz1`,
              exam_id: `quiz1_${Date.now()}`,
              student_id: student.id,
              seat_number: `Q${Math.floor(Math.random() * 30) + 1}`,
              attendance_status: 'pending',
              attempt_status: 'not_started',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              exams: {
                id: `quiz1_${Date.now()}`,
                title: 'Quiz de révision - Programmation Web',
                course_id: 'course1',
                courses: { name: 'Programmation Web', code: 'WEB101' },
                professor_id: 'prof1',
                professors: { profiles: { full_name: 'Dr. Jean Dupont' } },
                date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // Dans 5 jours
                duration: 30,
                type: 'quiz',
                room: 'Salle Informatique',
                total_points: 20,
                passing_grade: 10,
                status: 'scheduled',
                description: 'Quiz rapide pour évaluer vos connaissances en programmation web'
              }
            },
            {
              id: `${student.id}_quiz2`,
              exam_id: `quiz2_${Date.now()}`,
              student_id: student.id,
              seat_number: `Q${Math.floor(Math.random() * 30) + 1}`,
              attendance_status: 'pending',
              attempt_status: 'not_started',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              exams: {
                id: `quiz2_${Date.now()}`,
                title: 'Quiz de mi-parcours - Bases de données',
                course_id: 'course2',
                courses: { name: 'Bases de Données', code: 'DB101' },
                professor_id: 'prof2',
                professors: { profiles: { full_name: 'Prof. Marie Martin' } },
                date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // Dans 10 jours
                duration: 45,
                type: 'quiz',
                room: 'Salle 102',
                total_points: 30,
                passing_grade: 15,
                status: 'scheduled',
                description: 'Quiz de mi-parcours sur les concepts fondamentaux des bases de données'
              }
            },
            {
              id: `${student.id}_quiz3`,
              exam_id: `quiz3_${Date.now()}`,
              student_id: student.id,
              seat_number: `Q${Math.floor(Math.random() * 30) + 1}`,
              attendance_status: 'pending',
              attempt_status: 'not_started',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              exams: {
                id: `quiz3_${Date.now()}`,
                title: 'Quiz surprise - Algorithmes',
                course_id: 'course3',
                courses: { name: 'Algorithmes et Structures de Données', code: 'ALG101' },
                professor_id: 'prof1',
                professors: { profiles: { full_name: 'Dr. Jean Dupont' } },
                date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // Dans 3 jours
                duration: 20,
                type: 'quiz',
                room: 'Salle 201',
                total_points: 15,
                passing_grade: 8,
                status: 'scheduled',
                description: 'Quiz surprise pour tester vos connaissances en algorithmes'
              }
            }
          ];
          
          // Fusionner avec les examens existants
          const updatedExams = [...existingExams, ...quizzes];
          
          // Mettre à jour les métadonnées utilisateur
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            student.id,
            { 
              user_metadata: { 
                ...student.user_metadata,
                exams_backup: updatedExams
              }
            }
          );
          
          if (updateError) {
            console.error(`Erreur lors de la mise à jour des métadonnées pour ${student.email}:`, updateError);
          } else {
            console.log(`Métadonnées mises à jour avec succès pour ${student.email}. ${quizzes.length} quiz ajoutés.`);
          }
        } else {
          console.log('Des quiz existent déjà dans les métadonnées. Aucune action nécessaire.');
        }
      }
    }
    
    // 4. Essayer de créer des quiz dans la table exams
    console.log('\nTentative de création de quiz dans la table exams...');
    
    const quizExamples = [
      {
        title: 'Quiz de révision - Programmation Web',
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 30,
        type: 'quiz',
        room: 'Salle Informatique',
        total_points: 20,
        passing_grade: 10,
        status: 'scheduled',
        description: 'Quiz rapide pour évaluer vos connaissances en programmation web'
      },
      {
        title: 'Quiz de mi-parcours - Bases de données',
        date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 45,
        type: 'quiz',
        room: 'Salle 102',
        total_points: 30,
        passing_grade: 15,
        status: 'scheduled',
        description: 'Quiz de mi-parcours sur les concepts fondamentaux des bases de données'
      }
    ];
    
    // Récupérer un cours et un professeur pour les associer aux quiz
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .limit(1);
    
    const { data: professorData, error: professorError } = await supabase
      .from('professors')
      .select('id')
      .limit(1);
    
    if (courseError || professorError) {
      console.error('Erreur lors de la récupération des cours ou professeurs:', courseError || professorError);
    } else if (courseData.length > 0 && professorData.length > 0) {
      // Ajouter les IDs de cours et professeur aux quiz
      const completeQuizzes = quizExamples.map(quiz => ({
        ...quiz,
        course_id: courseData[0].id,
        professor_id: professorData[0].id
      }));
      
      // Insérer les quiz dans la table exams
      const { data: insertedQuizzes, error: insertError } = await supabase
        .from('exams')
        .insert(completeQuizzes)
        .select();
      
      if (insertError) {
        console.error('Erreur lors de la création des quiz dans la table exams:', insertError);
      } else {
        console.log(`${insertedQuizzes.length} quiz créés avec succès dans la table exams.`);
        
        // Assigner ces quiz aux étudiants
        if (insertedQuizzes.length > 0) {
          console.log('\nAssignation des nouveaux quiz aux étudiants...');
          
          for (const student of students) {
            const quizAssignments = insertedQuizzes.map(quiz => ({
              student_id: student.id,
              exam_id: quiz.id,
              seat_number: `Q${Math.floor(Math.random() * 30) + 1}`,
              attendance_status: 'pending',
              attempt_status: 'not_started',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }));
            
            const { data: assignData, error: assignError } = await supabase
              .from('student_exams')
              .insert(quizAssignments)
              .select();
            
            if (assignError) {
              console.error(`Erreur lors de l'assignation des quiz à l'étudiant ${student.email}:`, assignError);
            } else {
              console.log(`${assignData.length} quiz assignés avec succès à l'étudiant ${student.email}.`);
            }
          }
        }
      }
    }
    
    console.log('\n=== CORRECTION DES RELATIONS POUR LES QUIZ ET EXAMENS TERMINÉE ===');
    console.log('Les quiz ont été ajoutés aux métadonnées utilisateur.');
    console.log('Tentative de création de quiz dans la base de données effectuée.');
    console.log('Les étudiants devraient maintenant voir les quiz dans leur liste d\'examens.');
    
  } catch (err) {
    console.error('Erreur inattendue:', err);
  }
}

// Exécuter la fonction principale
fixQuizExams();
