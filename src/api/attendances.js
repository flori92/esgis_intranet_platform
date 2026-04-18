import { supabase } from '../supabase';

/**
 * Récupère les présences pour une session de cours donnée
 * @param {number} sessionId 
 */
export const getSessionAttendances = async (sessionId) => {
  try {
    const { data, error } = await supabase
      .from('attendances')
      .select(`
        *,
        students(
          id,
          student_number,
          profiles(full_name, email)
        )
      `)
      .eq('session_id', sessionId);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('getSessionAttendances:', error);
    return { data: [], error };
  }
};

/**
 * Enregistre ou met à jour la présence d'un étudiant
 * @param {Object} payload { session_id, student_id, status, comment }
 */
export const upsertAttendance = async (payload) => {
  try {
    // Vérifier si l'enregistrement existe déjà
    const { data: existing } = await supabase
      .from('attendances')
      .select('id')
      .eq('session_id', payload.session_id)
      .eq('student_id', payload.student_id)
      .maybeSingle();

    let response;
    if (existing) {
      response = await supabase
        .from('attendances')
        .update({ status: payload.status, comment: payload.comment })
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      response = await supabase
        .from('attendances')
        .insert(payload)
        .select()
        .single();
    }

    if (response.error) throw response.error;
    return { data: response.data, error: null };
  } catch (error) {
    console.error('upsertAttendance:', error);
    return { data: null, error };
  }
};

/**
 * Enregistre les présences en masse pour une session
 * @param {Array} attendancesList 
 */
export const bulkUpsertAttendances = async (attendancesList) => {
  try {
    const promises = attendancesList.map(att => upsertAttendance(att));
    await Promise.all(promises);
    return { error: null };
  } catch (error) {
    console.error('bulkUpsertAttendances:', error);
    return { error };
  }
};

/**
 * Récupère les statistiques de présence pour tous les étudiants d'un cours
 * @param {number} courseId - ID du cours
 */
export const getCourseAttendanceStats = async (courseId) => {
  try {
    const { data, error } = await supabase
      .from('mv_student_attendance_stats')
      .select('*')
      .eq('course_id', Number(courseId))
      .order('attendance_rate', { ascending: false });

    if (error) throw error;

    return { 
      data: (data || []).map(stat => ({
        ...stat,
        attendance_summary: `${stat.present_count}/${stat.total_sessions} séances`
      })), 
      error: null 
    };
  } catch (error) {
    console.error('getCourseAttendanceStats:', error);
    return { data: [], error };
  }
};

/**
 * Récupère les statistiques de présence pour tous les cours du professeur authentifié
 * @returns {Promise<Array>} Statistiques globales par étudiant
 */
export const getAllCoursesAttendanceStats = async () => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    
    if (!user) throw new Error('Utilisateur non authentifié');

    // Use the global view for performance
    const { data: globalStats, error: statsError } = await supabase
      .from('v_student_global_attendance_stats')
      .select('*')
      .order('global_attendance_rate', { ascending: false });

    if (statsError) throw statsError;

    // Fetch details from MV for course breakdown
    const { data: details, error: detailsError } = await supabase
      .from('mv_student_attendance_stats')
      .select('*');

    if (detailsError) throw detailsError;

    const finalStats = (globalStats || []).map(student => {
      const studentDetails = (details || []).filter(d => d.student_id === student.student_id);
      return {
        ...student,
        courses: studentDetails.map(d => ({
          course_id: d.course_id,
          course_name: d.course_name,
          course_code: d.course_code,
          attendance_rate: d.attendance_rate,
          attendance_summary: `${d.present_count}/${d.total_sessions} séances`,
          present_count: d.present_count,
          total_sessions: d.total_sessions
        })),
        global_summary: `${student.total_present}/${student.total_sessions} séances`
      };
    });

    return { data: finalStats, error: null };
  } catch (error) {
    console.error('getAllCoursesAttendanceStats:', error);
    return { data: [], error };
  }
};

/**
 * Récupère les cours du professeur authentifié
 * @returns {Promise<Array>} Liste des cours du professeur
 */
export const getProfessorCourses = async () => {
  try {
    // Récupérer l'ID du professeur authentifié
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    
    if (!user) {
      throw new Error('Utilisateur non authentifié');
    }

    // Récupérer les cours du professeur
    const { data: courses, error: coursesError } = await supabase
      .from('professor_courses')
      .select(`
        course_id,
        courses!inner(
          id,
          name,
          code
        )
      `)
      .eq('professor_id', user.id);

    if (coursesError) throw coursesError;

    return { data: courses || [], error: null };
  } catch (error) {
    console.error('getProfessorCourses:', error);
    return { data: [], error };
  }
};

/**
 * Récupère le bilan des absences d'un étudiant (pour l'étudiant lui-même)
 * @param {number} studentId (integer ID de la table students)
 */
export const getStudentAbsences = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('attendances')
      .select(`
        *,
        course_sessions(
          date,
          duration,
          courses(name, code)
        )
      `)
      .eq('student_id', studentId)
      .in('status', ['absent', 'late', 'excused'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('getStudentAbsences:', error);
    return { data: [], error };
  }
};
