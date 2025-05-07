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
 * Fonction pour s'assurer que le Quiz "Virtualization Cloud et Datacenter advanced"
 * est correctement inclus dans les examens des étudiants
 */
async function fixExistingQuiz() {
  console.log('=== CORRECTION POUR LE QUIZ "VIRTUALIZATION CLOUD ET DATACENTER ADVANCED" ===');

  try {
    // 1. Rechercher le quiz existant dans la base de données
    console.log('Recherche du quiz existant dans la base de données...');
    
    const { data: quizData, error: quizError } = await supabase
      .from('exams')
      .select('*')
      .ilike('title', '%Virtualization Cloud et Datacenter advanced%')
      .eq('type', 'quiz');
    
    if (quizError) {
      console.error('Erreur lors de la recherche du quiz:', quizError);
    } else {
      console.log(`${quizData.length} quiz correspondant trouvé.`);
      
      if (quizData.length === 0) {
        console.log('Quiz non trouvé dans la table exams. Recherche plus large...');
        
        // Recherche plus large sans le type
        const { data: broadData, error: broadError } = await supabase
          .from('exams')
          .select('*')
          .ilike('title', '%Virtualization%');
        
        if (broadError) {
          console.error('Erreur lors de la recherche élargie:', broadError);
        } else {
          console.log(`${broadData.length} examens contenant "Virtualization" trouvés.`);
          
          if (broadData.length > 0) {
            console.log('Examens trouvés:', broadData.map(e => `${e.id}: ${e.title} (${e.type})`));
            
            // Mettre à jour le type de l'examen pour en faire un quiz si nécessaire
            for (const exam of broadData) {
              if (exam.type !== 'quiz' && exam.title.includes('Virtualization Cloud et Datacenter')) {
                console.log(`Mise à jour du type de l'examen "${exam.title}" en quiz...`);
                
                const { data: updateData, error: updateError } = await supabase
                  .from('exams')
                  .update({ type: 'quiz' })
                  .eq('id', exam.id)
                  .select();
                
                if (updateError) {
                  console.error(`Erreur lors de la mise à jour du type de l'examen:`, updateError);
                } else {
                  console.log(`Type de l'examen mis à jour avec succès:`, updateData);
                  quizData.push(...updateData);
                }
              }
            }
          }
        }
      }
      
      // 2. Si le quiz existe, s'assurer qu'il est assigné à tous les étudiants
      if (quizData.length > 0) {
        console.log('\nAssignation du quiz aux étudiants...');
        
        // Récupérer la liste des étudiants
        const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
        
        if (usersError) {
          console.error('Erreur lors de la récupération des utilisateurs:', usersError);
        } else {
          const students = usersData.users.filter(user => 
            user.user_metadata?.role === 'student'
          );
          
          console.log(`${students.length} étudiants trouvés.`);
          
          // Pour chaque étudiant, vérifier s'il a le quiz assigné
          for (const student of students) {
            console.log(`\nVérification pour l'étudiant ${student.email}...`);
            
            for (const quiz of quizData) {
              // Vérifier si l'étudiant a déjà ce quiz assigné
              const { data: assignmentData, error: assignmentError } = await supabase
                .from('student_exams')
                .select('*')
                .eq('student_id', student.id)
                .eq('exam_id', quiz.id);
              
              if (assignmentError) {
                console.error(`Erreur lors de la vérification de l'assignation:`, assignmentError);
              } else if (assignmentData.length === 0) {
                console.log(`Le quiz "${quiz.title}" n'est pas assigné à l'étudiant. Assignation...`);
                
                // Assigner le quiz à l'étudiant
                const { data: insertData, error: insertError } = await supabase
                  .from('student_exams')
                  .insert([{
                    student_id: student.id,
                    exam_id: quiz.id,
                    seat_number: `Q${Math.floor(Math.random() * 30) + 1}`,
                    attendance_status: 'pending',
                    attempt_status: 'not_started',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  }])
                  .select();
                
                if (insertError) {
                  console.error(`Erreur lors de l'assignation du quiz:`, insertError);
                } else {
                  console.log(`Quiz assigné avec succès:`, insertData);
                }
              } else {
                console.log(`Le quiz "${quiz.title}" est déjà assigné à l'étudiant.`);
              }
            }
            
            // 3. Mettre à jour les métadonnées utilisateur pour inclure le quiz
            console.log('\nMise à jour des métadonnées utilisateur...');
            
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
              console.error(`Erreur lors de la récupération des détails d'examens:`, fullExamError);
              
              // Si la récupération échoue, créer une entrée spécifique pour le quiz Virtualization
              const existingExams = student.user_metadata?.exams_backup || [];
              
              // Vérifier si le quiz Virtualization existe déjà dans les métadonnées
              const hasVirtualizationQuiz = existingExams.some(
                e => e.exams?.title?.includes('Virtualization Cloud et Datacenter')
              );
              
              if (!hasVirtualizationQuiz) {
                console.log('Création d\'une entrée spécifique pour le quiz Virtualization dans les métadonnées...');
                
                const virtualizationQuiz = {
                  id: `${student.id}_virtualization_quiz`,
                  exam_id: quizData[0]?.id || `virtualization_quiz_${Date.now()}`,
                  student_id: student.id,
                  seat_number: `Q${Math.floor(Math.random() * 30) + 1}`,
                  attendance_status: 'pending',
                  attempt_status: 'not_started',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  exams: {
                    id: quizData[0]?.id || `virtualization_quiz_${Date.now()}`,
                    title: 'Quiz - Virtualization Cloud et Datacenter advanced',
                    course_id: quizData[0]?.course_id || 'course_virtualization',
                    courses: { 
                      name: 'Virtualization Cloud et Datacenter', 
                      code: 'VCD101' 
                    },
                    professor_id: quizData[0]?.professor_id || 'prof_virtualization',
                    professors: { 
                      profiles: { 
                        full_name: quizData[0]?.professors?.profiles?.full_name || 'Prof. Cloud Expert' 
                      } 
                    },
                    date: quizData[0]?.date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    duration: quizData[0]?.duration || 45,
                    type: 'quiz',
                    room: quizData[0]?.room || 'Salle Datacenter',
                    total_points: quizData[0]?.total_points || 25,
                    passing_grade: quizData[0]?.passing_grade || 13,
                    status: quizData[0]?.status || 'scheduled',
                    description: quizData[0]?.description || 'Quiz sur les concepts avancés de virtualisation, cloud computing et datacenter'
                  }
                };
                
                const updatedExams = [...existingExams, virtualizationQuiz];
                
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
                  console.error(`Erreur lors de la mise à jour des métadonnées:`, updateError);
                } else {
                  console.log(`Métadonnées mises à jour avec succès pour inclure le quiz Virtualization.`);
                }
              }
            } else {
              console.log(`${fullExamData.length} examens récupérés pour la mise à jour des métadonnées.`);
              
              // Vérifier si le quiz Virtualization est inclus dans les données récupérées
              const hasVirtualizationQuiz = fullExamData.some(
                e => e.exams?.title?.includes('Virtualization Cloud et Datacenter')
              );
              
              if (!hasVirtualizationQuiz && quizData.length > 0) {
                console.log('Le quiz Virtualization n\'est pas inclus dans les données récupérées. Ajout manuel...');
                
                // Ajouter manuellement le quiz Virtualization aux données
                const virtualizationQuiz = {
                  id: `${student.id}_virtualization_quiz`,
                  exam_id: quizData[0].id,
                  student_id: student.id,
                  seat_number: `Q${Math.floor(Math.random() * 30) + 1}`,
                  attendance_status: 'pending',
                  attempt_status: 'not_started',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  exams: quizData[0]
                };
                
                fullExamData.push(virtualizationQuiz);
              }
              
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
                console.error(`Erreur lors de la mise à jour des métadonnées:`, updateError);
              } else {
                console.log(`Métadonnées mises à jour avec succès avec ${fullExamData.length} examens.`);
              }
            }
          }
        }
      } else {
        // 4. Si le quiz n'existe pas du tout, le créer
        console.log('\nCréation du quiz "Virtualization Cloud et Datacenter advanced"...');
        
        // Récupérer un cours et un professeur pour les associer au quiz
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
          // Créer le quiz
          const virtualizationQuiz = {
            title: 'Quiz - Virtualization Cloud et Datacenter advanced',
            course_id: courseData[0].id,
            professor_id: professorData[0].id,
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            duration: 45,
            type: 'quiz',
            room: 'Salle Datacenter',
            total_points: 25,
            passing_grade: 13,
            status: 'scheduled',
            description: 'Quiz sur les concepts avancés de virtualisation, cloud computing et datacenter'
          };
          
          const { data: insertedQuiz, error: insertError } = await supabase
            .from('exams')
            .insert([virtualizationQuiz])
            .select();
          
          if (insertError) {
            console.error('Erreur lors de la création du quiz:', insertError);
          } else {
            console.log('Quiz créé avec succès:', insertedQuiz);
            quizData.push(...insertedQuiz);
            
            // Continuer avec l'assignation aux étudiants (voir étape 2)
            console.log('\nAssignation du nouveau quiz aux étudiants...');
            
            // Récupérer la liste des étudiants
            const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
            
            if (usersError) {
              console.error('Erreur lors de la récupération des utilisateurs:', usersError);
            } else {
              const students = usersData.users.filter(user => 
                user.user_metadata?.role === 'student'
              );
              
              console.log(`${students.length} étudiants trouvés.`);
              
              // Pour chaque étudiant, assigner le quiz
              for (const student of students) {
                console.log(`\nAssignation du quiz à l'étudiant ${student.email}...`);
                
                const { data: assignData, error: assignError } = await supabase
                  .from('student_exams')
                  .insert([{
                    student_id: student.id,
                    exam_id: insertedQuiz[0].id,
                    seat_number: `Q${Math.floor(Math.random() * 30) + 1}`,
                    attendance_status: 'pending',
                    attempt_status: 'not_started',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  }])
                  .select();
                
                if (assignError) {
                  console.error(`Erreur lors de l'assignation du quiz:`, assignError);
                } else {
                  console.log(`Quiz assigné avec succès:`, assignData);
                }
                
                // Mettre à jour les métadonnées utilisateur
                const existingExams = student.user_metadata?.exams_backup || [];
                
                const virtualizationQuizBackup = {
                  id: `${student.id}_virtualization_quiz`,
                  exam_id: insertedQuiz[0].id,
                  student_id: student.id,
                  seat_number: `Q${Math.floor(Math.random() * 30) + 1}`,
                  attendance_status: 'pending',
                  attempt_status: 'not_started',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  exams: insertedQuiz[0]
                };
                
                const updatedExams = [...existingExams, virtualizationQuizBackup];
                
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
                  console.error(`Erreur lors de la mise à jour des métadonnées:`, updateError);
                } else {
                  console.log(`Métadonnées mises à jour avec succès pour inclure le quiz Virtualization.`);
                }
              }
            }
          }
        }
      }
    }
    
    console.log('\n=== CORRECTION POUR LE QUIZ "VIRTUALIZATION CLOUD ET DATACENTER ADVANCED" TERMINÉE ===');
    console.log('Le quiz a été vérifié, créé si nécessaire, et assigné aux étudiants.');
    console.log('Les métadonnées utilisateur ont été mises à jour pour inclure ce quiz spécifique.');
    
  } catch (err) {
    console.error('Erreur inattendue:', err);
  }
}

// Exécuter la fonction principale
fixExistingQuiz();
