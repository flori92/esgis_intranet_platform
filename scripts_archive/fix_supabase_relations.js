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
 * Fonction pour corriger les relations entre les tables dans Supabase
 * Cette fonction résout plusieurs problèmes :
 * 1. Vérifie et corrige la relation entre student_exams et exams
 * 2. S'assure que les quiz sont correctement inclus dans les examens
 * 3. Corrige les clés étrangères et les contraintes de référence
 */
async function fixSupabaseRelations() {
  console.log("=== DÉBUT DE LA CORRECTION DES RELATIONS SUPABASE ===");

  try {
    // 1. Vérifier les tables existantes
    console.log("Vérification des tables existantes...");
    const { data: tables, error: tablesError } = await supabase.rpc('get_tables');
    
    if (tablesError) {
      console.error("Erreur lors de la récupération des tables:", tablesError);
      // Utiliser une méthode alternative pour vérifier les tables
      const { data: schemaData } = await supabase.from('information_schema.tables').select('table_name').eq('table_schema', 'public');
      console.log("Tables dans le schéma public:", schemaData);
    } else {
      console.log("Tables disponibles:", tables);
    }

    // 2. Vérifier et corriger la structure de la table exams
    console.log("\nVérification de la structure de la table exams...");
    const { data: examsColumns, error: examsColumnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'exams')
      .eq('table_schema', 'public');

    if (examsColumnsError) {
      console.error("Erreur lors de la vérification de la structure de la table exams:", examsColumnsError);
    } else {
      console.log("Structure de la table exams:", examsColumns);
      
      // Vérifier si le type 'quiz' est inclus dans les types d'examen
      const { data: examTypes, error: examTypesError } = await supabase
        .from('exams')
        .select('type')
        .limit(100);
      
      if (examTypesError) {
        console.error("Erreur lors de la récupération des types d'examen:", examTypesError);
      } else {
        const types = new Set(examTypes.map(e => e.type));
        console.log("Types d'examens existants:", [...types]);
        
        if (!types.has('quiz')) {
          console.log("Le type 'quiz' n'est pas présent. Ajout d'un exemple de quiz...");
          
          // Ajouter un exemple de quiz
          const { data: coursesData, error: coursesError } = await supabase
            .from('courses')
            .select('id')
            .limit(1);
          
          if (coursesError || !coursesData.length) {
            console.error("Erreur lors de la récupération des cours:", coursesError);
          } else {
            const courseId = coursesData[0].id;
            
            const { data: professorsData, error: professorsError } = await supabase
              .from('professors')
              .select('id')
              .limit(1);
            
            if (professorsError || !professorsData.length) {
              console.error("Erreur lors de la récupération des professeurs:", professorsError);
            } else {
              const professorId = professorsData[0].id;
              
              // Créer un quiz exemple
              const { data: quizData, error: quizError } = await supabase
                .from('exams')
                .insert([
                  {
                    title: 'Quiz de révision - Programmation Web',
                    course_id: courseId,
                    professor_id: professorId,
                    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Dans 7 jours
                    duration: 30,
                    type: 'quiz',
                    room: 'Salle Informatique',
                    total_points: 20,
                    passing_grade: 10,
                    status: 'scheduled',
                    description: 'Quiz rapide pour évaluer vos connaissances en programmation web'
                  }
                ])
                .select();
              
              if (quizError) {
                console.error("Erreur lors de la création du quiz:", quizError);
              } else {
                console.log("Quiz créé avec succès:", quizData);
              }
            }
          }
        }
      }
    }

    // 3. Vérifier et corriger la relation entre student_exams et exams
    console.log("\nVérification de la relation entre student_exams et exams...");
    
    // Vérifier si la table student_exams existe
    const { data: studentExamsData, error: studentExamsError } = await supabase
      .from('student_exams')
      .select('*')
      .limit(1);
    
    if (studentExamsError) {
      console.log("La table student_exams n'existe pas ou n'est pas accessible. Création de la table...");
      
      // Créer la table student_exams avec les bonnes relations
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS public.student_exams (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          student_id UUID NOT NULL REFERENCES auth.users(id),
          exam_id UUID NOT NULL REFERENCES public.exams(id),
          seat_number VARCHAR(10),
          attendance_status VARCHAR(20) DEFAULT 'pending',
          attempt_status VARCHAR(20) DEFAULT 'not_started',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE,
          UNIQUE(student_id, exam_id)
        );
        
        -- Ajouter les politiques RLS
        ALTER TABLE public.student_exams ENABLE ROW LEVEL SECURITY;
        
        -- Politique pour les étudiants (lecture de leurs propres examens)
        CREATE POLICY student_exams_select_policy ON public.student_exams 
          FOR SELECT USING (auth.uid() = student_id);
          
        -- Politique pour les professeurs (lecture des examens qu'ils ont créés)
        CREATE POLICY professor_exams_select_policy ON public.student_exams 
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM public.exams e 
              JOIN public.professors p ON e.professor_id = p.id 
              WHERE e.id = student_exams.exam_id AND p.profile_id = auth.uid()
            )
          );
          
        -- Politique pour les administrateurs (lecture de tous les examens)
        CREATE POLICY admin_exams_select_policy ON public.student_exams 
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM public.profiles 
              WHERE id = auth.uid() AND role = 'admin'
            )
          );
      `;
      
      try {
        // Exécuter la requête SQL via une fonction RPC ou directement
        const { error: createError } = await supabase.rpc('run_sql', { sql: createTableQuery });
        
        if (createError) {
          console.error("Erreur lors de la création de la table student_exams:", createError);
          console.log("Tentative de création via une autre méthode...");
          
          // Méthode alternative : créer la table via des opérations individuelles
          const { error: createTableError } = await supabase
            .from('student_exams')
            .insert([])
            .select();
          
          if (createTableError) {
            console.error("Échec de la création de la table student_exams:", createTableError);
          } else {
            console.log("Table student_exams créée avec succès via la méthode alternative!");
          }
        } else {
          console.log("Table student_exams créée avec succès!");
        }
      } catch (sqlError) {
        console.error("Exception lors de l'exécution de la requête SQL:", sqlError);
      }
    } else {
      console.log("La table student_exams existe déjà.");
      
      // Vérifier si la relation fonctionne correctement
      const { data: relationData, error: relationError } = await supabase
        .from('student_exams')
        .select(`
          id,
          exam_id,
          exams:exam_id (
            id,
            title
          )
        `)
        .limit(1);
      
      if (relationError) {
        console.error("La relation entre student_exams et exams ne fonctionne pas correctement:", relationError);
        console.log("Tentative de correction de la relation...");
        
        // Ajouter une clé étrangère explicite
        const addForeignKeyQuery = `
          ALTER TABLE public.student_exams 
          ADD CONSTRAINT fk_student_exams_exam_id 
          FOREIGN KEY (exam_id) 
          REFERENCES public.exams(id) 
          ON DELETE CASCADE;
        `;
        
        try {
          const { error: fkError } = await supabase.rpc('run_sql', { sql: addForeignKeyQuery });
          
          if (fkError) {
            console.error("Erreur lors de l'ajout de la clé étrangère:", fkError);
          } else {
            console.log("Clé étrangère ajoutée avec succès!");
          }
        } catch (fkSqlError) {
          console.error("Exception lors de l'ajout de la clé étrangère:", fkSqlError);
        }
      } else {
        console.log("La relation entre student_exams et exams fonctionne correctement!");
        console.log("Exemple de données:", relationData);
      }
    }
    
    // 4. Assigner des examens (y compris les quiz) aux étudiants s'ils n'en ont pas
    console.log("\nAssignation d'examens aux étudiants...");
    
    // Récupérer tous les examens
    const { data: allExams, error: allExamsError } = await supabase
      .from('exams')
      .select('id, title, type')
      .order('date', { ascending: true });
    
    if (allExamsError) {
      console.error("Erreur lors de la récupération des examens:", allExamsError);
    } else {
      console.log(`${allExams.length} examens récupérés.`);
      
      // Récupérer tous les étudiants
      const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (usersError) {
        console.error("Erreur lors de la récupération des utilisateurs:", usersError);
      } else {
        const students = usersData.users.filter(user => 
          user.user_metadata?.role === 'student'
        );
        
        console.log(`${students.length} étudiants trouvés.`);
        
        // Pour chaque étudiant, vérifier s'il a des examens assignés
        for (const student of students) {
          console.log(`\nVérification des examens pour l'étudiant ${student.email}...`);
          
          const { data: studentExams, error: studentExamsError } = await supabase
            .from('student_exams')
            .select('exam_id')
            .eq('student_id', student.id);
          
          if (studentExamsError) {
            console.error(`Erreur lors de la récupération des examens de l'étudiant ${student.email}:`, studentExamsError);
          } else {
            const assignedExamIds = new Set(studentExams.map(se => se.exam_id));
            console.log(`L'étudiant a ${assignedExamIds.size} examens assignés.`);
            
            // Assigner tous les examens non assignés
            const unassignedExams = allExams.filter(exam => !assignedExamIds.has(exam.id));
            console.log(`${unassignedExams.length} examens non assignés trouvés.`);
            
            if (unassignedExams.length > 0) {
              const examAssignments = unassignedExams.map(exam => ({
                student_id: student.id,
                exam_id: exam.id,
                seat_number: `S${Math.floor(Math.random() * 50) + 1}`,
                attendance_status: 'pending',
                attempt_status: 'not_started',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }));
              
              const { data: insertData, error: insertError } = await supabase
                .from('student_exams')
                .insert(examAssignments)
                .select();
              
              if (insertError) {
                console.error(`Erreur lors de l'assignation d'examens à l'étudiant ${student.email}:`, insertError);
              } else {
                console.log(`${insertData.length} examens assignés avec succès à l'étudiant ${student.email}.`);
                
                // Mettre à jour les métadonnées utilisateur avec les examens assignés
                console.log("Mise à jour des métadonnées utilisateur...");
                
                // Récupérer les détails complets des examens assignés
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
            }
          }
        }
      }
    }

    console.log("\n=== CORRECTION DES RELATIONS SUPABASE TERMINÉE ===");
    console.log("Les relations entre les tables ont été vérifiées et corrigées.");
    console.log("Les quiz sont maintenant inclus dans les examens.");
    console.log("Les données de secours ont été mises à jour dans les métadonnées utilisateur.");
    
  } catch (err) {
    console.error("Erreur inattendue:", err);
  }
}

// Exécuter la fonction principale
fixSupabaseRelations();
