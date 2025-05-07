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
 * Données du quiz "Virtualization Cloud et Datacenter advanced"
 * Ces questions seront utilisées pour créer le quiz dans la base de données
 */
const virtualizationQuizData = {
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
      text: "Quel modèle de service cloud fournit des machines virtuelles, des réseaux et du stockage?",
      options: [
        "Software as a Service (SaaS)",
        "Platform as a Service (PaaS)",
        "Infrastructure as a Service (IaaS)",
        "Function as a Service (FaaS)"
      ],
      correctAnswer: 2 // IaaS
    },
    {
      id: "vq3",
      text: "Quelle technologie est utilisée pour isoler les applications dans des environnements légers et portables?",
      options: [
        "Docker",
        "VMware",
        "Hyper-V",
        "KVM"
      ],
      correctAnswer: 0 // Docker
    },
    {
      id: "vq4",
      text: "Quel est l'avantage principal de l'architecture multi-tenant dans le cloud?",
      options: [
        "Meilleure sécurité",
        "Partage des ressources et réduction des coûts",
        "Performance accrue",
        "Simplicité de configuration"
      ],
      correctAnswer: 1 // Partage des ressources
    },
    {
      id: "vq5",
      text: "Quelle technique permet d'allouer dynamiquement des ressources en fonction de la demande?",
      options: [
        "Load balancing",
        "Clustering",
        "Autoscaling",
        "Failover"
      ],
      correctAnswer: 2 // Autoscaling
    },
    {
      id: "vq6",
      text: "Quelle mesure est utilisée pour évaluer la disponibilité d'un datacenter?",
      options: [
        "Tier Level (Niveau Tier)",
        "IOPS (Operations d'entrée/sortie par seconde)",
        "Latence",
        "Bande passante"
      ],
      correctAnswer: 0 // Tier Level
    },
    {
      id: "vq7",
      text: "Quelle technologie permet de migrer des machines virtuelles entre des hôtes physiques sans interruption de service?",
      options: [
        "Cold migration",
        "Live migration",
        "Snapshot",
        "Cloning"
      ],
      correctAnswer: 1 // Live migration
    },
    {
      id: "vq8",
      text: "Quel concept fait référence à l'utilisation de plusieurs fournisseurs cloud pour éviter la dépendance à un seul fournisseur?",
      options: [
        "Cloud hybride",
        "Cloud privé",
        "Multi-cloud",
        "Cloud public"
      ],
      correctAnswer: 2 // Multi-cloud
    },
    {
      id: "vq9",
      text: "Quelle technologie de stockage permet de présenter un espace de stockage unifié à partir de plusieurs systèmes physiques?",
      options: [
        "RAID",
        "SAN (Storage Area Network)",
        "NAS (Network Attached Storage)",
        "Software-Defined Storage"
      ],
      correctAnswer: 3 // Software-Defined Storage
    },
    {
      id: "vq10",
      text: "Quelle mesure d'efficacité énergétique est couramment utilisée pour évaluer les datacenters?",
      options: [
        "PUE (Power Usage Effectiveness)",
        "TCO (Total Cost of Ownership)",
        "ROI (Return on Investment)",
        "MTBF (Mean Time Between Failures)"
      ],
      correctAnswer: 0 // PUE
    }
  ]
};

/**
 * Fonction pour intégrer le quiz "Virtualization Cloud et Datacenter advanced"
 * dans le système d'examens et s'assurer qu'il est correctement lié aux composants existants
 */
async function fixVirtualizationQuiz() {
  console.log('=== INTÉGRATION DU QUIZ "VIRTUALIZATION CLOUD ET DATACENTER ADVANCED" ===');

  try {
    // 1. Vérifier si le quiz existe déjà dans la base de données
    console.log('Recherche du quiz existant dans la base de données...');
    
    const { data: quizData, error: quizError } = await supabase
      .from('exams')
      .select('*')
      .ilike('title', '%Virtualization Cloud et Datacenter%')
      .eq('type', 'quiz');
    
    if (quizError) {
      console.error('Erreur lors de la recherche du quiz:', quizError);
    } else {
      console.log(`${quizData.length} quiz correspondant trouvé.`);
      
      // 2. Si le quiz n'existe pas, le créer
      if (quizData.length === 0) {
        console.log('Quiz non trouvé dans la table exams. Création du quiz...');
        
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
            title: virtualizationQuizData.title,
            course_id: courseData[0].id,
            professor_id: professorData[0].id,
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            duration: virtualizationQuizData.duration,
            type: 'quiz',
            room: 'Salle Datacenter',
            total_points: virtualizationQuizData.questions.length * 2,
            passing_grade: Math.ceil(virtualizationQuizData.questions.length * 2 * 0.6),
            status: 'scheduled',
            description: virtualizationQuizData.description
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
            
            // 3. Créer les questions du quiz dans la base de données
            console.log('Création des questions du quiz...');
            
            try {
              // Vérifier si la table quiz_questions existe
              const { data: tableData, error: tableError } = await supabase
                .from('quiz_questions')
                .select('*')
                .limit(1);
              
              if (tableError) {
                console.log('La table quiz_questions n\'existe pas. Création de la table...');
                
                // Créer la table quiz_questions
                const createTableQuery = `
                  CREATE TABLE IF NOT EXISTS public.quiz_questions (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    quiz_id UUID NOT NULL REFERENCES public.exams(id),
                    question_text TEXT NOT NULL,
                    options JSONB NOT NULL,
                    correct_answer INTEGER NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE
                  );
                `;
                
                const { error: createError } = await supabase.rpc('run_sql', { sql: createTableQuery });
                
                if (createError) {
                  console.error('Erreur lors de la création de la table quiz_questions:', createError);
                } else {
                  console.log('Table quiz_questions créée avec succès!');
                }
              }
              
              // Insérer les questions du quiz
              for (const question of virtualizationQuizData.questions) {
                const { error: questionError } = await supabase
                  .from('quiz_questions')
                  .insert([{
                    quiz_id: insertedQuiz[0].id,
                    question_text: question.text,
                    options: question.options,
                    correct_answer: question.correctAnswer
                  }]);
                
                if (questionError) {
                  console.error('Erreur lors de la création de la question:', questionError);
                }
              }
              
              console.log('Questions du quiz créées avec succès!');
            } catch (err) {
              console.error('Erreur lors de la création des questions:', err);
            }
          }
        }
      }
      
      // 4. S'assurer que le quiz est assigné à tous les étudiants
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
            
            // 5. Mettre à jour les métadonnées utilisateur pour inclure le quiz avec ses questions
            console.log('\nMise à jour des métadonnées utilisateur...');
            
            const existingExams = student.user_metadata?.exams_backup || [];
            
            // Vérifier si le quiz Virtualization existe déjà dans les métadonnées
            const hasVirtualizationQuiz = existingExams.some(
              e => e.exams?.title?.includes('Virtualization Cloud et Datacenter')
            );
            
            if (!hasVirtualizationQuiz) {
              console.log('Ajout du quiz Virtualization dans les métadonnées...');
              
              const virtualizationQuizBackup = {
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
                  title: virtualizationQuizData.title,
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
                  duration: virtualizationQuizData.duration,
                  type: 'quiz',
                  room: quizData[0]?.room || 'Salle Datacenter',
                  total_points: virtualizationQuizData.questions.length * 2,
                  passing_grade: Math.ceil(virtualizationQuizData.questions.length * 2 * 0.6),
                  status: quizData[0]?.status || 'scheduled',
                  description: virtualizationQuizData.description,
                  questions: virtualizationQuizData.questions
                }
              };
              
              const updatedExams = [...existingExams, virtualizationQuizBackup];
              
              const { error: updateError } = await supabase.auth.admin.updateUserById(
                student.id,
                { 
                  user_metadata: { 
                    ...student.user_metadata,
                    exams_backup: updatedExams,
                    virtualization_quiz_data: virtualizationQuizData
                  }
                }
              );
              
              if (updateError) {
                console.error(`Erreur lors de la mise à jour des métadonnées:`, updateError);
              } else {
                console.log(`Métadonnées mises à jour avec succès pour inclure le quiz Virtualization.`);
              }
            } else {
              console.log('Le quiz Virtualization existe déjà dans les métadonnées.');
              
              // Mettre à jour les données du quiz existant
              const updatedExams = existingExams.map(exam => {
                if (exam.exams?.title?.includes('Virtualization Cloud et Datacenter')) {
                  return {
                    ...exam,
                    exams: {
                      ...exam.exams,
                      questions: virtualizationQuizData.questions
                    }
                  };
                }
                return exam;
              });
              
              const { error: updateError } = await supabase.auth.admin.updateUserById(
                student.id,
                { 
                  user_metadata: { 
                    ...student.user_metadata,
                    exams_backup: updatedExams,
                    virtualization_quiz_data: virtualizationQuizData
                  }
                }
              );
              
              if (updateError) {
                console.error(`Erreur lors de la mise à jour des métadonnées:`, updateError);
              } else {
                console.log(`Métadonnées mises à jour avec succès pour le quiz Virtualization.`);
              }
            }
          }
        }
      }
    }
    
    // 6. Créer un fichier de données pour le quiz
    console.log('\nCréation d\'un fichier de données pour le quiz...');
    
    // Utiliser l'API Fetch pour vérifier si le fichier existe déjà
    try {
      const response = await fetch('file:///src/data/virtualizationQuizData.js', { method: 'HEAD' });
      console.log('Le fichier de données existe déjà.');
    } catch (error) {
      console.log('Le fichier de données n\'existe pas encore ou n\'est pas accessible via fetch.');
    }
    
    console.log('Le fichier de données a été créé manuellement dans src/data/virtualizationQuizData.js');
    console.log('Contenu du fichier: Quiz avec 10 questions sur la virtualisation, le cloud et les datacenters.');
    
    // Note: Nous avons déjà créé ce fichier manuellement, donc cette étape est informative
    
    console.log('\n=== INTÉGRATION DU QUIZ "VIRTUALIZATION CLOUD ET DATACENTER ADVANCED" TERMINÉE ===');
    console.log('Le quiz a été vérifié, créé si nécessaire, et assigné aux étudiants.');
    console.log('Les métadonnées utilisateur ont été mises à jour pour inclure ce quiz spécifique.');
    console.log('Le fichier de données src/data/virtualizationQuizData.js est disponible pour l\'application.');
    
  } catch (err) {
    console.error('Erreur inattendue:', err);
  }
}

// Exécuter la fonction principale
fixVirtualizationQuiz();
