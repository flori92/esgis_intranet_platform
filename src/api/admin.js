/**
 * API Administration — Config système, Audit, Rôles, Bulletins
 * ESGIS Campus §5.5 / §7
 */
import { supabase } from '../supabase';

const LEVEL_BY_UI_ID = {
  n1: 'L1',
  n2: 'L2',
  n3: 'L3',
  n4: 'M1',
  n5: 'M2',
};

const normalizeLevel = (value) => LEVEL_BY_UI_ID[value] || value || null;

const countQuery = (table, filter) => {
  let query = supabase.from(table).select('*', { count: 'exact', head: true });

  if (typeof filter === 'function') {
    query = filter(query);
  }

  return query;
};

// ============================================================
// DASHBOARD ADMIN
// ============================================================

/** Récupère les métriques et flux récents du dashboard admin */
export const getAdminDashboardData = async (adminProfileId) => {
  try {
    const notificationScope = [
      adminProfileId ? `recipient_id.eq.${adminProfileId}` : null,
      'recipient_role.eq.admin',
      'recipient_role.eq.all'
    ].filter(Boolean).join(',');

    const statsQueries = [
      countQuery('profiles', (query) => query.eq('role', 'student')),
      countQuery('profiles', (query) => query.eq('role', 'professor')),
      countQuery('courses'),
      countQuery('departments'),
      countQuery('profiles', (query) => query.eq('is_active', true)),
      countQuery('requests', (query) => query.eq('status', 'pending')),
    ];

    const notificationsQuery = supabase
      .from('notifications')
      .select('id, title, content, priority, read, recipient_id, recipient_role, created_at')
      .or(notificationScope)
      .order('created_at', { ascending: false })
      .limit(20);

    const eventsQuery = supabase
      .from('events')
      .select('id, title, description, start_date, end_date, location, type, created_at')
      .gte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true })
      .limit(20);

    const [
      { count: totalStudents },
      { count: totalProfessors },
      { count: totalCourses },
      { count: totalDepartments },
      { count: activeUsers },
      { count: pendingRequests },
      { data: notifications, error: notificationsError },
      { data: events, error: eventsError }
    ] = await Promise.all([
      ...statsQueries,
      notificationsQuery,
      eventsQuery
    ]);

    if (notificationsError) throw notificationsError;
    if (eventsError) throw eventsError;

    return {
      data: {
        stats: {
          totalStudents: totalStudents || 0,
          totalProfessors: totalProfessors || 0,
          totalCourses: totalCourses || 0,
          totalDepartments: totalDepartments || 0,
          activeUsers: activeUsers || 0,
          pendingRequests: pendingRequests || 0,
        },
        notifications: notifications || [],
        events: events || [],
      },
      error: null
    };
  } catch (error) {
    console.error('getAdminDashboardData:', error);
    return { data: null, error };
  }
};

// ============================================================
// AUDIT LOG
// ============================================================

/** Enregistre un événement d'audit */
export const logAuditEvent = async ({ userId, userName, userRole, action, resource, resourceId, details, ipAddress }) => {
  try {
    const { error } = await supabase.from('audit_log').insert({
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      action,
      resource,
      resource_id: resourceId || null,
      details,
      ip_address: ipAddress || null,
      user_agent: navigator.userAgent,
    });
    if (error) console.error('logAuditEvent error:', error);
    return { error };
  } catch (error) {
    console.error('logAuditEvent:', error);
    return { error };
  }
};

/** Récupère les entrées du journal d'audit */
export const getAuditLogs = async (filters = {}, page = 1, perPage = 50) => {
  try {
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = supabase
      .from('audit_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filters.action) query = query.eq('action', filters.action);
    if (filters.userRole) query = query.eq('user_role', filters.userRole);
    if (filters.resource) query = query.eq('resource', filters.resource);
    if (filters.search) {
      query = query.or(`user_name.ilike.%${filters.search}%,details.ilike.%${filters.search}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return { data, total: count, error: null };
  } catch (error) {
    console.error('getAuditLogs:', error);
    return { data: null, total: 0, error };
  }
};

// ============================================================
// RÔLES & PERMISSIONS
// ============================================================

/** Récupère tous les rôles personnalisés */
export const getRoles = async () => {
  try {
    const { data, error } = await supabase
      .from('custom_roles')
      .select('*')
      .order('created_at');
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/** Crée un rôle */
export const createRole = async (roleData) => {
  try {
    const { data, error } = await supabase.from('custom_roles').insert(roleData).select();
    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/** Met à jour un rôle */
export const updateRole = async (id, roleData) => {
  try {
    const { data, error } = await supabase.from('custom_roles').update(roleData).eq('id', id).select();
    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/** Supprime un rôle */
export const deleteRole = async (id) => {
  try {
    const { error } = await supabase.from('custom_roles').delete().eq('id', id);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
};

// ============================================================
// CONFIG SYSTÈME
// ============================================================

/** Récupère toute la configuration système */
export const getSystemConfig = async () => {
  try {
    const { data, error } = await supabase
      .from('system_config')
      .select('config_key, config_value');
    if (error) throw error;

    // Transformer en objet clé-valeur
    const config = {};
    (data || []).forEach(row => { config[row.config_key] = row.config_value; });
    return { data: config, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/** Met à jour une clé de configuration */
export const updateSystemConfig = async (key, value, updatedBy) => {
  try {
    const { data, error } = await supabase
      .from('system_config')
      .upsert({
        config_key: key,
        config_value: value,
        updated_by: updatedBy,
      }, { onConflict: 'config_key' })
      .select();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/** Sauvegarde toute la configuration d'un coup */
export const saveAllConfig = async (configObject, updatedBy) => {
  try {
    const rows = Object.entries(configObject).map(([key, value]) => ({
      config_key: key,
      config_value: value,
      updated_by: updatedBy,
    }));
    const { error } = await supabase
      .from('system_config')
      .upsert(rows, { onConflict: 'config_key' });
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
};

// ============================================================
// GÉNÉRATION EN MASSE DE BULLETINS
// ============================================================

/** Récupère les étudiants d'un niveau avec leurs moyennes */
export const getStudentsForBulletins = async (niveauId, semestre, anneeAcademique) => {
  try {
    const normalizedLevel = normalizeLevel(niveauId);
    if (!normalizedLevel) {
      return { data: [], error: null };
    }

    const semesterNumber = Number(String(semestre || 'S1').replace('S', '')) || 1;

    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select(`
        id,
        level,
        profile:profile_id(
          id,
          full_name
        )
      `)
      .eq('level', normalizedLevel)
      .eq('status', 'active');

    if (studentsError) throw studentsError;
    if (!students?.length) {
      return { data: [], error: null };
    }

    const studentIds = students.map((student) => student.id);
    const { data: results, error: resultsError } = await supabase
      .from('exam_results')
      .select(`
        id,
        student_id,
        grade,
        exams:exam_id(
          id,
          weight,
          courses:course_id(
            id,
            credits,
            semester
          )
        )
      `)
      .in('student_id', studentIds);

    if (resultsError) throw resultsError;

    const getMention = (avg) => {
      if (avg >= 16) return 'Très Bien';
      if (avg >= 14) return 'Bien';
      if (avg >= 12) return 'Assez Bien';
      if (avg >= 10) return 'Passable';
      return 'Insuffisant';
    };

    const getStatut = (avg) => {
      if (avg >= 10) return 'admis';
      if (avg >= 9) return 'compensation';
      if (avg >= 8) return 'rattrapage';
      return 'ajourné';
    };

    const studentsWithGrades = (students || []).map((student) => {
      const studentResults = (results || []).filter((result) => {
        const resultSemester = result.exams?.courses?.semester;
        return result.student_id === student.id && resultSemester === semesterNumber;
      });

      let totalWeighted = 0;
      let totalCoef = 0;
      const validatedCourses = new Set();

      studentResults.forEach((result) => {
        const weight = Number(result.exams?.weight || 1);
        totalWeighted += Number(result.grade || 0) * weight;
        totalCoef += weight;

        if (Number(result.grade || 0) >= 10 && result.exams?.courses?.id) {
          validatedCourses.add(`${result.exams.courses.id}:${result.exams.courses.credits || 0}`);
        }
      });

      const moyenne = totalCoef > 0 ? Math.round((totalWeighted / totalCoef) * 100) / 100 : 0;
      const credits = [...validatedCourses].reduce((sum, entry) => {
        const [, creditValue] = entry.split(':');
        return sum + Number(creditValue || 0);
      }, 0);

      return {
        id: student.id,
        name: student.profile?.full_name || '-',
        moyenne,
        credits,
        rang: 0,
        mention: getMention(moyenne),
        statut: getStatut(moyenne),
        annee_academique: anneeAcademique,
        semestre,
      };
    });

    // Calculer les rangs
    const valid = studentsWithGrades.filter(Boolean).sort((a, b) => b.moyenne - a.moyenne);
    valid.forEach((s, i) => { s.rang = i + 1; });

    return { data: valid, error: null };
  } catch (error) {
    console.error('getStudentsForBulletins:', error);
    return { data: null, error };
  }
};

/** Enregistre un bulletin généré */
export const saveBulletin = async (bulletinData) => {
  try {
    const { data, error } = await supabase
      .from('generated_documents')
      .insert({
        template_id: bulletinData.template_id,
        student_id: bulletinData.student_id,
        file_path: bulletinData.file_path,
        status: bulletinData.status || 'draft',
        generated_by: bulletinData.generated_by || null,
        approved_by: bulletinData.approved_by || null,
        approval_date: bulletinData.approval_date || null,
      })
      .select();

    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// ============================================================
// QUIZ D'ENTRAÎNEMENT
// ============================================================

/** Récupère les quiz d'entraînement accessibles à un étudiant */
export const getPracticeQuizzes = async (studentId) => {
  try {
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('profile_id', studentId)
      .maybeSingle();

    if (studentError) throw studentError;
    if (!student) {
      return { data: [], error: null };
    }

    const { data: studentCourses, error: courseError } = await supabase
      .from('student_courses')
      .select('course_id')
      .eq('student_id', student.id);

    if (courseError) throw courseError;

    const courseIds = [...new Set((studentCourses || []).map((item) => item.course_id).filter(Boolean))];
    if (!courseIds.length) {
      return { data: [], error: null };
    }

    let query = supabase
      .from('practice_quizzes')
      .select(`
        id,
        title,
        description,
        questions,
        duration_minutes,
        difficulty,
        created_at,
        course:course_id(id, name, code, level, semester),
        professeur:professeur_id(id, full_name)
      `)
      .eq('is_active', true)
      .in('course_id', courseIds)
      .order('created_at', { ascending: false });

    const { data: quizzes, error } = await query;
    if (error) throw error;

    // Enrichir avec les tentatives de l'étudiant
    const enriched = await Promise.all((quizzes || []).map(async (quiz) => {
      const { data: attempts } = await supabase
        .from('practice_quiz_attempts')
        .select('score, max_score, percentage, completed_at')
        .eq('quiz_id', quiz.id)
        .eq('student_id', studentId)
        .order('percentage', { ascending: false });

      const questionsArray = quiz.questions || [];

      return {
        ...quiz,
        cours: quiz.course,
        questions_count: Array.isArray(questionsArray) ? questionsArray.length : 0,
        attempts: attempts?.length || 0,
        best_score: attempts?.[0]?.percentage || null,
      };
    }));

    return { data: enriched, error: null };
  } catch (error) {
    console.error('getPracticeQuizzes:', error);
    return { data: null, error };
  }
};

/** Récupère les questions d'un quiz */
export const getPracticeQuizQuestions = async (quizId) => {
  try {
    const { data, error } = await supabase
      .from('practice_quizzes')
      .select('questions')
      .eq('id', quizId)
      .single();
    if (error) throw error;
    return { data: data?.questions || [], error: null };
  } catch (error) {
    return { data: [], error };
  }
};

/** Enregistre une tentative de quiz */
export const savePracticeQuizAttempt = async (attemptData) => {
  try {
    const payload = {
      ...attemptData,
      student_id: attemptData.student_id,
      answers: attemptData.answers || {},
      completed_at: attemptData.completed_at || new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('practice_quiz_attempts')
      .insert(payload)
      .select();
    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// ============================================================
// VALIDATION QUEUE
// ============================================================

/** Recupere la file de validation avec relations */
export const getValidationQueue = async () => {
  try {
    const { data, error } = await supabase
      .from('validation_queue')
      .select(`
        *,
        student:students(id, profile_id, level),
        requester:profiles(id, first_name, last_name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('getValidationQueue:', error);
    return { data: [], error };
  }
};

/** Met a jour le statut d'un item de la file de validation */
export const updateValidationQueueItem = async (id, updates) => {
  try {
    const { error } = await supabase
      .from('validation_queue')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('updateValidationQueueItem:', error);
    return { error };
  }
};

/** Insere une entree dans le journal d'audit (simplifie) */
export const insertAuditLogEntry = async (entry) => {
  try {
    const { error } = await supabase
      .from('audit_log')
      .insert(Array.isArray(entry) ? entry : [entry]);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('insertAuditLogEntry:', error);
    return { error };
  }
};

// ============================================================
// ACCOUNT STATUS (Students)
// ============================================================

/** Recupere tous les etudiants avec leur profil */
export const getStudentsWithProfiles = async () => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*, profiles(full_name, email), is_active:is_active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('getStudentsWithProfiles:', error);
    return { data: [], error };
  }
};

/** Met a jour le statut d'un etudiant */
export const updateStudentStatus = async (id, updates) => {
  try {
    const { error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('updateStudentStatus:', error);
    return { error };
  }
};

// ============================================================
// LEVELS & SEMESTERS
// ============================================================

/** Recupere les niveaux distincts des etudiants */
export const getStudentLevels = async () => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('level')
      .not('level', 'is', null)
      .order('level');

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('getStudentLevels:', error);
    return { data: [], error };
  }
};

/** Recupere les semestres distincts des notes */
export const getGradeSemesters = async () => {
  try {
    const { data, error } = await supabase
      .from('grades')
      .select('semester')
      .not('semester', 'is', null)
      .order('semester');

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('getGradeSemesters:', error);
    return { data: [], error };
  }
};

// ============================================================
// ADMIN DASHBOARD (counts)
// ============================================================

/** Recupere les statistiques du dashboard admin */
export const getAdminDashboardStats = async () => {
  try {
    const [
      { count: studentsCount },
      { count: professorsCount },
      { count: departmentsCount },
      { count: coursesCount },
      { count: sessionsCount },
      { count: correctionsCount },
    ] = await Promise.all([
      supabase.from('students').select('id', { count: 'exact', head: true }).eq('status', 'actif'),
      supabase.from('professors').select('id', { count: 'exact', head: true }),
      supabase.from('departments').select('id', { count: 'exact', head: true }),
      supabase.from('courses').select('id', { count: 'exact', head: true }),
      supabase.from('exam_sessions').select('id', { count: 'exact', head: true }).eq('status', 'in_progress'),
      supabase.from('demandes_correction_notes').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

    return {
      data: {
        totalStudents: studentsCount || 0,
        totalProfessors: professorsCount || 0,
        totalDepartments: departmentsCount || 0,
        totalCourses: coursesCount || 0,
        activeSessions: sessionsCount || 0,
        pendingCorrections: correctionsCount || 0,
      },
      error: null,
    };
  } catch (error) {
    console.error('getAdminDashboardStats:', error);
    return { data: null, error };
  }
};

/** Recupere l'activite recente du journal d'audit */
export const getRecentAuditActivity = async (limit = 5) => {
  try {
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('getRecentAuditActivity:', error);
    return { data: [], error };
  }
};

// ============================================================
// AUDIT LOG (page-level query with date filters)
// ============================================================

/** Recupere les logs d'audit avec filtres de dates */
export const getAuditLogEntries = async ({ startDate, endDate, limit = 500 } = {}) => {
  try {
    let query = supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (startDate) {
      query = query.gte('created_at', new Date(startDate).toISOString());
    }
    if (endDate) {
      const nextDay = new Date(endDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query = query.lt('created_at', nextDay.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('getAuditLogEntries:', error);
    return { data: [], error };
  }
};

// ============================================================
// STUDENT IMPORT
// ============================================================

/** Verifie si un etudiant existe par student_id */
export const getStudentByStudentId = async (studentIdValue) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('id')
      .eq('student_id', studentIdValue)
      .single();

    return { data, error: error || null };
  } catch (error) {
    return { data: null, error };
  }
};

/** Cree un profil pour l'import */
export const createProfileForImport = async (profileData) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profileData)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('createProfileForImport:', error);
    return { data: null, error };
  }
};

/** Cree un etudiant pour l'import */
export const createStudentForImport = async (studentData) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .insert(studentData)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('createStudentForImport:', error);
    return { data: null, error };
  }
};

// ============================================================
// DOCUMENT TEMPLATES
// ============================================================

/** Recupere tous les modeles de documents */
export const getDocumentTemplates = async () => {
  try {
    const { data, error } = await supabase
      .from('document_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('getDocumentTemplates:', error);
    return { data: [], error };
  }
};

/** Cree un modele de document */
export const createDocumentTemplate = async (templateData) => {
  try {
    const { error } = await supabase
      .from('document_templates')
      .insert(Array.isArray(templateData) ? templateData : [templateData]);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('createDocumentTemplate:', error);
    return { error };
  }
};

/** Met a jour un modele de document */
export const updateDocumentTemplate = async (id, updates) => {
  try {
    const { error } = await supabase
      .from('document_templates')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('updateDocumentTemplate:', error);
    return { error };
  }
};

/** Supprime un modele de document */
export const deleteDocumentTemplate = async (id) => {
  try {
    const { error } = await supabase
      .from('document_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('deleteDocumentTemplate:', error);
    return { error };
  }
};

// ============================================================
// SUBJECTS (courses) — admin CRUD
// ============================================================

/** Recupere les cours avec les departements */
export const getCoursesWithDepartments = async () => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*, departments(name)')
      .order('name');

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('getCoursesWithDepartments:', error);
    return { data: [], error };
  }
};

/** Cree un cours */
export const createCourse = async (courseData) => {
  try {
    const { error } = await supabase
      .from('courses')
      .insert(Array.isArray(courseData) ? courseData : [courseData]);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('createCourse:', error);
    return { error };
  }
};

/** Met a jour un cours */
export const updateCourse = async (id, updates) => {
  try {
    const { error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('updateCourse:', error);
    return { error };
  }
};

/** Supprime un cours */
export const deleteCourse = async (id) => {
  try {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('deleteCourse:', error);
    return { error };
  }
};

// ============================================================
// PROFESSORS — admin CRUD
// ============================================================

/** Recupere les professeurs avec departements */
export const getProfessorsWithDepartments = async () => {
  try {
    const { data, error } = await supabase
      .from('professors')
      .select('*, departments(name)');

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('getProfessorsWithDepartments:', error);
    return { data: [], error };
  }
};

/** Cree un professeur */
export const createProfessor = async (profData) => {
  try {
    const { error } = await supabase
      .from('professors')
      .insert(Array.isArray(profData) ? profData : [profData]);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('createProfessor:', error);
    return { error };
  }
};

/** Met a jour un professeur */
export const updateProfessor = async (id, updates) => {
  try {
    const { error } = await supabase
      .from('professors')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('updateProfessor:', error);
    return { error };
  }
};

/** Supprime un professeur */
export const deleteProfessor = async (id) => {
  try {
    const { error } = await supabase
      .from('professors')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('deleteProfessor:', error);
    return { error };
  }
};

/** Recupere la liste des professeurs (id, full_name) */
export const getProfessorsList = async () => {
  try {
    const { data, error } = await supabase
      .from('professors')
      .select('id, full_name')
      .order('full_name');

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('getProfessorsList:', error);
    return { data: [], error };
  }
};

// ============================================================
// STUDENT DETAILS
// ============================================================

/** Recupere un etudiant par ID */
export const getStudentById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('getStudentById:', error);
    return { data: null, error };
  }
};

/** Recupere un profil par ID */
export const getProfileByIdAdmin = async (id) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('getProfileByIdAdmin:', error);
    return { data: null, error };
  }
};

/** Recupere les notes d'un etudiant avec les cours */
export const getStudentGradesAdmin = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('grades')
      .select(`
        *,
        course:courses(name, code, credits, semester)
      `)
      .eq('student_id', studentId)
      .order('courses.semester');

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('getStudentGradesAdmin:', error);
    return { data: [], error };
  }
};

/** Recupere l'assiduite d'un etudiant */
export const getStudentAttendance = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('grades')
      .select('attendance')
      .eq('student_id', studentId)
      .not('attendance', 'is', null);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('getStudentAttendance:', error);
    return { data: [], error };
  }
};

/** Recupere les demandes de correction d'un etudiant */
export const getStudentCorrections = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('demandes_correction_notes')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('getStudentCorrections:', error);
    return { data: [], error };
  }
};

/** Met a jour un etudiant */
export const updateStudent = async (id, updates) => {
  try {
    const { error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('updateStudent:', error);
    return { error };
  }
};

/** Supprime un etudiant */
export const deleteStudent = async (id) => {
  try {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('deleteStudent:', error);
    return { error };
  }
};

// ============================================================
// DEPARTMENTS — admin CRUD
// ============================================================

/** Recupere les departements avec professeurs */
export const getDepartmentsWithProfessors = async () => {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('*, professors(full_name)');

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('getDepartmentsWithProfessors:', error);
    return { data: [], error };
  }
};

/** Cree un departement */
export const createDepartmentAdmin = async (deptData) => {
  try {
    const { error } = await supabase
      .from('departments')
      .insert(Array.isArray(deptData) ? deptData : [deptData]);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('createDepartmentAdmin:', error);
    return { error };
  }
};

/** Met a jour un departement */
export const updateDepartmentAdmin = async (id, updates) => {
  try {
    const { error } = await supabase
      .from('departments')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('updateDepartmentAdmin:', error);
    return { error };
  }
};

/** Supprime un departement */
export const deleteDepartmentAdmin = async (id) => {
  try {
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('deleteDepartmentAdmin:', error);
    return { error };
  }
};

/** Recupere la liste des departements */
export const getDepartmentsList = async () => {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name');

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('getDepartmentsList:', error);
    return { data: [], error };
  }
};
