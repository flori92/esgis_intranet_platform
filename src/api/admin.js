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
const getRelation = (value) => (Array.isArray(value) ? value[0] : value);

const normalizeStudentLifecycleStatus = (value) => {
  const normalized = `${value || 'active'}`.trim().toLowerCase();

  const mapping = {
    active: 'active',
    actif: 'active',
    suspended: 'suspended',
    suspendu: 'suspended',
    graduated: 'graduated',
    'diplomé': 'graduated',
    diplome: 'graduated',
    withdrawn: 'withdrawn',
    'radié': 'withdrawn',
    radie: 'withdrawn'
  };

  return mapping[normalized] || 'active';
};

const normalizeCoursePayload = (courseData = {}) => ({
  name: `${courseData.name || ''}`.trim(),
  code: `${courseData.code || ''}`.trim().toUpperCase(),
  credits: Number(courseData.credits) || 0,
  description: courseData.description || null,
  department_id: courseData.department_id ? Number(courseData.department_id) : null,
  level: normalizeLevel(courseData.level) || 'L1',
  semester: Number(courseData.semester) || 1,
  updated_at: new Date().toISOString()
});

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

const transformNotification = (notif) => {
  if (!notif) return null;
  return {
    id: notif.id,
    title: notif.title,
    content: notif.content || notif.message,
    priority: notif.priority || notif.type || 'medium',
    read: notif.read ?? notif.is_read ?? false,
    recipient_id: notif.recipient_id || notif.user_id,
    recipient_role: notif.recipient_role,
    created_at: notif.created_at,
  };
};

const transformEvent = (event) => {
  if (!event) return null;
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    start_date: event.start_date || event.start_time,
    end_date: event.end_date || event.end_time,
    location: event.location,
    type: event.type || event.event_type || 'other',
    event_type: event.event_type || event.type || 'other',
    created_at: event.created_at,
  };
};

/** Récupère les métriques et flux récents du dashboard admin */
export const getAdminDashboardData = async (adminProfileId) => {
  try {
    const statsQueries = [
      countQuery('profiles', (query) => query.eq('role', 'student')),
      countQuery('profiles', (query) => query.eq('role', 'professor')),
      countQuery('courses'),
      countQuery('departments'),
      countQuery('profiles', (query) => query.eq('is_active', true)),
      countQuery('requests', (query) => query.eq('status', 'pending')),
    ];

    let notificationsQuery = supabase
      .from('notifications')
      .select('*')
      .or(`recipient_id.eq.${adminProfileId},recipient_role.eq.admin,recipient_role.eq.all`)
      .order('created_at', { ascending: false })
      .limit(20);

    const eventsQuery = supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: true })
      .limit(50);

    const [
      { count: totalStudents },
      { count: totalProfessors },
      { count: totalCourses },
      { count: totalDepartments },
      { count: activeUsers },
      { count: pendingRequests },
      { data: notifications, error: notificationsError },
      { data: eventsData, error: eventsError }
    ] = await Promise.all([
      ...statsQueries,
      notificationsQuery,
      eventsQuery
    ]);

    if (notificationsError) throw notificationsError;
    if (eventsError) throw eventsError;

    const now = new Date();
    const upcomingEvents = (eventsData || [])
      .map(transformEvent)
      .filter(e => {
        const eventDate = new Date(e.start_date || e.start_time);
        return eventDate >= now;
      })
      .slice(0, 20);

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
        notifications: (notifications || []).map(transformNotification),
        events: upcomingEvents,
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
// ASSIGNATION DE RÔLES AUX UTILISATEURS
// ============================================================

/** Récupère les rôles assignés à un utilisateur */
export const getUserRoles = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('id, role_id, created_at, custom_roles(id, name, label, permissions)')
      .eq('user_id', userId);
    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error };
  }
};

/** Récupère tous les utilisateurs avec leurs rôles custom */
export const getUsersWithRoles = async () => {
  try {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('is_active', true)
      .order('full_name');
    if (profilesError) throw profilesError;

    const { data: assignments, error: assignError } = await supabase
      .from('user_roles')
      .select('user_id, role_id, custom_roles(id, name, label)');
    if (assignError) throw assignError;

    const userRolesMap = {};
    (assignments || []).forEach((a) => {
      if (!userRolesMap[a.user_id]) userRolesMap[a.user_id] = [];
      if (a.custom_roles) userRolesMap[a.user_id].push(a.custom_roles);
    });

    const result = (profiles || []).map((p) => ({
      ...p,
      custom_roles: userRolesMap[p.id] || [],
    }));

    return { data: result, error: null };
  } catch (error) {
    return { data: [], error };
  }
};

/** Assigne un rôle à un utilisateur */
export const assignRoleToUser = async (userId, roleId) => {
  try {
    const { data: session } = await supabase.auth.getSession();

    const { data, error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role_id: roleId,
        assigned_by: session?.session?.user?.id || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Ce rôle est déjà assigné à cet utilisateur.');
      }
      throw error;
    }
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/** Retire un rôle d'un utilisateur */
export const removeRoleFromUser = async (userId, roleId) => {
  try {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role_id', roleId);
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
export const getStudentsForBulletins = async (niveauId, semestre, anneeAcademique, departmentId = null) => {
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
          full_name,
          department_id,
          departments:department_id(name)
        )
      `)
      .eq('level', normalizedLevel)
      .eq('status', 'active');

    if (studentsError) throw studentsError;
    if (!students?.length) {
      return { data: [], error: null };
    }

    const filteredStudents = (students || []).filter((student) => {
      if (!departmentId) {
        return true;
      }

      return Number(student.profile?.department_id) === Number(departmentId);
    });

    const studentIds = filteredStudents.map((student) => student.id);
    if (!studentIds.length) {
      return { data: [], error: null };
    }

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

    const studentsWithGrades = filteredStudents.map((student) => {
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
        department_id: student.profile?.department_id || null,
        department_name: getRelation(student.profile?.departments)?.name || 'Non assigné',
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
        requester:profiles(id, full_name, email)
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

/** Applique une décision de validation avec journal d'audit */
export const reviewValidationQueueItem = async (id, { decision, comment = '', reviewerId = null, actor = null } = {}) => {
  try {
    const normalizedDecision = decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : decision;

    const { data: currentItem, error: fetchError } = await supabase
      .from('validation_queue')
      .select('id, request_type, status')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    const updates = {
      status: normalizedDecision,
      reviewer_id: reviewerId,
      reviewed_at: new Date().toISOString(),
      review_comment: comment || null,
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await updateValidationQueueItem(id, updates);
    if (updateError) {
      throw updateError;
    }

    await insertAuditLogEntry({
      user_id: actor?.id || reviewerId || null,
      user_name: actor?.full_name || null,
      user_role: actor?.role || 'admin',
      action: normalizedDecision === 'approved' ? 'approve_validation_request' : 'reject_validation_request',
      resource: 'validation_queue',
      resource_id: `${id}`,
      details: [
        `Type: ${currentItem.request_type}`,
        `Statut: ${currentItem.status} -> ${normalizedDecision}`,
        comment ? `Commentaire: ${comment}` : null
      ].filter(Boolean).join(' | ')
    });

    return { error: null };
  } catch (error) {
    console.error('reviewValidationQueueItem:', error);
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

/** Récupère la liste canonique des comptes étudiants avec profil */
export const getStudentAccountStatuses = async () => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        student_number,
        entry_year,
        level,
        status,
        created_at,
        profile:profile_id(
          id,
          full_name,
          email,
          is_active,
          department_id,
          departments:department_id(name)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return {
      data: (data || []).map((student) => ({
        profile: getRelation(student.profile),
        id: student.id,
        profile_id: getRelation(student.profile)?.id || null,
        student_number: student.student_number,
        entry_year: student.entry_year,
        level: student.level,
        status: student.status,
        created_at: student.created_at,
        full_name: getRelation(student.profile)?.full_name || '',
        email: getRelation(student.profile)?.email || '',
        is_active: getRelation(student.profile)?.is_active !== false,
        department_id: getRelation(student.profile)?.department_id || null,
        department_name: getRelation(getRelation(student.profile)?.departments)?.name || 'Non assigné'
      })),
      error: null
    };
  } catch (error) {
    console.error('getStudentAccountStatuses:', error);
    return { data: [], error };
  }
};

/** Met à jour le cycle de vie d'un compte étudiant et journalise l'action */
export const updateStudentAccountStatus = async (studentId, { status, reason = '', actor = null } = {}) => {
  try {
    const normalizedStatus = normalizeStudentLifecycleStatus(status);
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select(`
        id,
        profile_id,
        student_number,
        status,
        profile:profile_id(full_name, email)
      `)
      .eq('id', studentId)
      .single();

    if (studentError) {
      throw studentError;
    }

    const isActive = normalizedStatus === 'active';
    const timestamp = new Date().toISOString();

    const { error: updateStudentError } = await supabase
      .from('students')
      .update({
        status: normalizedStatus,
        updated_at: timestamp
      })
      .eq('id', studentId);

    if (updateStudentError) {
      throw updateStudentError;
    }

    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({
        is_active: isActive,
        updated_at: timestamp
      })
      .eq('id', student.profile_id);

    if (updateProfileError) {
      throw updateProfileError;
    }

    const detailsParts = [
      `Statut étudiant: ${student.status} -> ${normalizedStatus}`,
      reason ? `Raison: ${reason}` : null
    ].filter(Boolean);

    await insertAuditLogEntry({
      user_id: actor?.id || null,
      user_name: actor?.full_name || null,
      user_role: actor?.role || 'admin',
      action: 'update_student_status',
      resource: 'student_account',
      resource_id: `${studentId}`,
      details: detailsParts.join(' | ')
    });

    return { error: null };
  } catch (error) {
    console.error('updateStudentAccountStatus:', error);
    return { error };
  }
};

/** Recupere tous les etudiants avec leur profil */
export const getStudentsWithProfiles = async () => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*, profiles(full_name, email), is_active:is_active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return {
      data: (data || []).map((entry) => ({
        ...entry,
        course: getRelation(entry.course),
        department: getRelation(entry.department)
      })),
      error: null
    };
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

/** Récupère les niveaux académiques avec nombre d'étudiants */
export const getAcademicLevels = async () => {
  try {
    const [levelsRes, studentLevelsRes] = await Promise.all([
      supabase
        .from('academic_levels')
        .select('*')
        .order('sort_order'),
      supabase
        .from('students')
        .select('level')
        .not('level', 'is', null)
    ]);

    if (levelsRes.error) {
      throw levelsRes.error;
    }
    if (studentLevelsRes.error) {
      throw studentLevelsRes.error;
    }

    const studentCountByLevel = {};
    (studentLevelsRes.data || []).forEach((student) => {
      studentCountByLevel[student.level] = (studentCountByLevel[student.level] || 0) + 1;
    });

    return {
      data: (levelsRes.data || []).map((level) => ({
        ...level,
        student_count: studentCountByLevel[level.code] || 0
      })),
      error: null
    };
  } catch (error) {
    console.error('getAcademicLevels:', error);
    return { data: [], error };
  }
};

export const createAcademicLevel = async (payload) => {
  try {
    const { data, error } = await supabase
      .from('academic_levels')
      .insert({
        code: `${payload.code || ''}`.trim().toUpperCase(),
        label: payload.label,
        sort_order: Number(payload.sort_order) || 0,
        is_active: payload.is_active !== false
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('createAcademicLevel:', error);
    return { data: null, error };
  }
};

export const updateAcademicLevel = async (id, payload) => {
  try {
    const { data, error } = await supabase
      .from('academic_levels')
      .update({
        code: `${payload.code || ''}`.trim().toUpperCase(),
        label: payload.label,
        sort_order: Number(payload.sort_order) || 0,
        is_active: payload.is_active !== false
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('updateAcademicLevel:', error);
    return { data: null, error };
  }
};

export const deleteAcademicLevel = async (id) => {
  try {
    const { error } = await supabase
      .from('academic_levels')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('deleteAcademicLevel:', error);
    return { error };
  }
};

/** Récupère les semestres académiques */
export const getAcademicSemesters = async () => {
  try {
    const { data, error } = await supabase
      .from('academic_semesters')
      .select('*')
      .order('academic_year', { ascending: false })
      .order('code');

    if (error) {
      throw error;
    }

    return {
      data: (data || []).map((course) => ({
        ...course,
        departments: getRelation(course.departments)
      })),
      error: null
    };
  } catch (error) {
    console.error('getAcademicSemesters:', error);
    return { data: [], error };
  }
};

export const createAcademicSemester = async (payload) => {
  try {
    const { data, error } = await supabase
      .from('academic_semesters')
      .insert({
        name: payload.name,
        code: payload.code || 'S1',
        academic_year: payload.academic_year,
        start_date: payload.start_date,
        end_date: payload.end_date,
        is_active: payload.is_active === true
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('createAcademicSemester:', error);
    return { data: null, error };
  }
};

export const updateAcademicSemester = async (id, payload) => {
  try {
    const { data, error } = await supabase
      .from('academic_semesters')
      .update({
        name: payload.name,
        code: payload.code || 'S1',
        academic_year: payload.academic_year,
        start_date: payload.start_date,
        end_date: payload.end_date,
        is_active: payload.is_active === true
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('updateAcademicSemester:', error);
    return { data: null, error };
  }
};

export const deleteAcademicSemester = async (id) => {
  try {
    const { error } = await supabase
      .from('academic_semesters')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('deleteAcademicSemester:', error);
    return { error };
  }
};

/** Récupère les années académiques */
export const getAcademicYears = async () => {
  try {
    const { data, error } = await supabase
      .from('academic_years')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) {
      throw error;
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('getAcademicYears:', error);
    return { data: [], error };
  }
};

/** Récupère les maquettes pédagogiques */
export const getCurriculumTemplates = async (filters = {}) => {
  try {
    let query = supabase
      .from('curriculum_templates')
      .select(`
        *,
        course:course_id(id, name, code, credits, level, semester),
        department:department_id(id, name, code)
      `)
      .order('level_code')
      .order('semester_code')
      .order('course_id');

    if (filters.department_id) {
      query = query.eq('department_id', filters.department_id);
    }
    if (filters.level_code) {
      query = query.eq('level_code', filters.level_code);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('getCurriculumTemplates:', error);
    return { data: [], error };
  }
};

export const createCurriculumTemplate = async (payload) => {
  try {
    const { data, error } = await supabase
      .from('curriculum_templates')
      .insert({
        department_id: payload.department_id || null,
        level_code: normalizeLevel(payload.level_code) || 'L1',
        semester_code: payload.semester_code || 'S1',
        course_id: Number(payload.course_id) || null,
        coefficient: Number(payload.coefficient) || 1,
        credits: Number(payload.credits) || 0,
        is_optional: payload.is_optional === true
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('createCurriculumTemplate:', error);
    return { data: null, error };
  }
};

export const updateCurriculumTemplate = async (id, payload) => {
  try {
    const { data, error } = await supabase
      .from('curriculum_templates')
      .update({
        department_id: payload.department_id || null,
        level_code: normalizeLevel(payload.level_code) || 'L1',
        semester_code: payload.semester_code || 'S1',
        course_id: Number(payload.course_id) || null,
        coefficient: Number(payload.coefficient) || 1,
        credits: Number(payload.credits) || 0,
        is_optional: payload.is_optional === true
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('updateCurriculumTemplate:', error);
    return { data: null, error };
  }
};

export const deleteCurriculumTemplate = async (id) => {
  try {
    const { error } = await supabase
      .from('curriculum_templates')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('deleteCurriculumTemplate:', error);
    return { error };
  }
};

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
      .select('*, departments:department_id(name)')
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
      .insert(Array.isArray(courseData) ? courseData.map(normalizeCoursePayload) : [normalizeCoursePayload(courseData)]);

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
      .update(normalizeCoursePayload(updates))
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
      .select('id, profiles(full_name)');

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
      .select('*, professors!head_professor_id(profiles(full_name))');

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
