import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

// Création du client Supabase avec la clé de service (service_role)
const supabaseUrl = process.env.SUPABASE_URL || 'https://epnhnjkbxgciojevrwfq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwbmhuamtieGdjaW9qZXZyd2ZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjIwNjkwNiwiZXhwIjoyMDYxNzgyOTA2fQ.kbEs9bN0vpsf9cE8TZuj0-sBz6LCQ3o3LU0sptEx-mY';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Script pour s'assurer que les Quiz sont correctement inclus parmi les examens
 * et que les relations entre les tables fonctionnent correctement
 */
async function fixQuizRelations() {
  console.log("=== CORRECTION DES RELATIONS POUR LES QUIZ ===");

  try {
    // 1. Vérifier si des quiz existent déjà dans la table exams
    console.log("Vérification des quiz existants...");
    const { data: quizData, error: quizError } = await supabase
      .from('exams')
      .select('id, title, type')
      .eq('type', 'quiz');
    
    if (quizError) {
      console.error("Erreur lors de la vérification des quiz:", quizError);
      return;
    }
    
    console.log(`${quizData.length} quiz trouvés dans la base de données.`);
    
    // 2. Si aucun quiz n'existe, en créer quelques-uns
    if (quizData.length === 0) {
      console.log("Aucun quiz trouvé. Création de quiz exemples...");
      
      // Récupérer un cours et un professeur pour les associer aux quiz
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('id, name')
        .limit(3);
      
      if (courseError || !courseData || courseData.length === 0) {
        console.error("Erreur lors de la récupération des cours:", courseError);
        return;
      }
      
      const { data: professorData, error: professorError } = await supabase
        .from('professors')
        .select('id, profile_id')
        .limit(2);
      
      if (professorError || !professorData || professorData.length === 0) {
        console.error("Erreur lors de la récupération des professeurs:", professorError);
        return;
      }
      
      // Créer des quiz exemples
      const quizExamples = [
        {
          title: 'Quiz de révision - Programmation Web',
          course_id: courseData[0].id,
          professor_id: professorData[0].id,
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Dans 7 jours
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
          course_id: courseData.length > 1 ? courseData[1].id : courseData[0].id,
          professor_id: professorData.length > 1 ? professorData[1].id : professorData[0].id,
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // Dans 14 jours
          duration: 45,
          type: 'quiz',
          room: 'Salle 102',
          total_points: 30,
          passing_grade: 15,
          status: 'scheduled',
          description: 'Quiz de mi-parcours sur les concepts fondamentaux des bases de données'
        },
        {
          title: 'Quiz surprise - Algorithmes',
          course_id: courseData.length > 2 ? courseData[2].id : courseData[0].id,
          professor_id: professorData[0].id,
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // Dans 3 jours
          duration: 20,
          type: 'quiz',
          room: 'Salle 201',
          total_points: 15,
          passing_grade: 8,
          status: 'scheduled',
          description: 'Quiz surprise pour tester vos connaissances en algorithmes'
        }
      ];
      
      const { data: insertedQuizzes, error: insertError } = await supabase
        .from('exams')
        .insert(quizExamples)
        .select();
      
      if (insertError) {
        console.error("Erreur lors de la création des quiz:", insertError);
      } else {
        console.log(`${insertedQuizzes.length} quiz créés avec succès.`);
        
        // Mettre à jour la liste des quiz
        quizData.push(...insertedQuizzes);
      }
    }
    
    // 3. S'assurer que les quiz sont assignés aux étudiants
    console.log("\nAssignation des quiz aux étudiants...");
    
    // Récupérer tous les étudiants
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error("Erreur lors de la récupération des utilisateurs:", usersError);
      return;
    }
    
    const students = usersData.users.filter(user => 
      user.user_metadata?.role === 'student'
    );
    
    console.log(`${students.length} étudiants trouvés.`);
    
    // Pour chaque étudiant, vérifier s'il a des quiz assignés
    for (const student of students) {
      console.log(`\nVérification des quiz pour l'étudiant ${student.email}...`);
      
      // Récupérer les examens déjà assignés à l'étudiant
      const { data: studentExams, error: studentExamsError } = await supabase
        .from('student_exams')
        .select('exam_id')
        .eq('student_id', student.id);
      
      if (studentExamsError) {
        console.error(`Erreur lors de la récupération des examens de l'étudiant ${student.email}:`, studentExamsError);
        continue;
      }
      
      const assignedExamIds = new Set(studentExams.map(se => se.exam_id));
      console.log(`L'étudiant a ${assignedExamIds.size} examens assignés.`);
      
      // Trouver les quiz non assignés
      const unassignedQuizzes = quizData.filter(quiz => !assignedExamIds.has(quiz.id));
      console.log(`${unassignedQuizzes.length} quiz non assignés trouvés.`);
      
      if (unassignedQuizzes.length > 0) {
        // Assigner les quiz non assignés à l'étudiant
        const quizAssignments = unassignedQuizzes.map(quiz => ({
          student_id: student.id,
          exam_id: quiz.id,
          seat_number: `Q${Math.floor(Math.random() * 30) + 1}`,
          attendance_status: 'pending',
          attempt_status: 'not_started',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        const { data: insertData, error: insertError } = await supabase
          .from('student_exams')
          .insert(quizAssignments)
          .select();
        
        if (insertError) {
          console.error(`Erreur lors de l'assignation des quiz à l'étudiant ${student.email}:`, insertError);
        } else {
          console.log(`${insertData.length} quiz assignés avec succès à l'étudiant ${student.email}.`);
        }
      }
      
      // 4. Mettre à jour les métadonnées utilisateur avec les examens et quiz
      console.log("Mise à jour des métadonnées utilisateur...");
      
      // Récupérer tous les examens de l'étudiant avec leurs détails
      const { data: fullExamData, error: fullExamError } = await supabase
        .from('student_exams')
        .select(`
          id,
          exam_id,
          student_id,
          seat_number,
          attendance_status,
          attempt_status,
          created_at,
          updated_at,
          exams:exam_id (
            id,
            title,
            course_id,
            courses:course_id (name, code),
            professor_id,
            professors:professor_id (profiles:profile_id(full_name)),
            date,
            duration,
            type,
            room,
            total_points,
            passing_grade,
            status,
            description
          )
        `)
        .eq('student_id', student.id);
      
      if (fullExamError) {
        console.error(`Erreur lors de la récupération des détails d'examens pour ${student.email}:`, fullExamError);
      } else {
        console.log(`${fullExamData.length} examens récupérés pour la mise à jour des métadonnées.`);
        
        // Mettre à jour les métadonnées utilisateur
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          student.id,
          { 
            user_metadata: { 
              ...student.user_metadata,
              exams_backup: fullExamData
            }
          }
        );
        
        if (updateError) {
          console.error(`Erreur lors de la mise à jour des métadonnées pour ${student.email}:`, updateError);
        } else {
          console.log(`Métadonnées mises à jour avec succès pour ${student.email}`);
        }
      }
    }
    
    console.log("\n=== CORRECTION DES RELATIONS POUR LES QUIZ TERMINÉE ===");
    console.log("Les quiz ont été créés et assignés aux étudiants.");
    console.log("Les métadonnées utilisateur ont été mises à jour.");
    
  } catch (err) {
    console.error("Erreur inattendue:", err);
  }
}

// Exécuter la fonction principale
fixQuizRelations();
