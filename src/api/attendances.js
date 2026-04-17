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
    // Récupérer toutes les sessions du cours
    const { data: sessions, error: sessionsError } = await supabase
      .from('course_sessions')
      .select('id, date')
      .eq('course_id', courseId)
      .order('date', { ascending: true });

    if (sessionsError) throw sessionsError;

    const totalSessions = sessions.length;
    if (totalSessions === 0) {
      return { data: [], error: null };
    }

    // Récupérer toutes les présences pour toutes les sessions de ce cours
    const sessionIds = sessions.map(s => s.id);
    const { data: attendances, error: attError } = await supabase
      .from('attendances')
      .select(`
        session_id,
        student_id,
        status
      `)
      .in('session_id', sessionIds);

    if (attError) throw attError;

    // Grouper par étudiant et calculer les statistiques
    const studentStats = {};
    
    // Initialiser tous les étudiants inscrits au cours
    const { data: enrolledStudents, error: studentsError } = await supabase
      .from('student_courses')
      .select(`
        student_id,
        student_entity_id,
        students!inner(
          id,
          student_number,
          profiles!inner(full_name)
        )
      `)
      .eq('course_id', courseId);

    if (studentsError) throw studentsError;

    // Initialiser les statistiques pour chaque étudiant
    enrolledStudents.forEach(({ student_id, student_entity_id, students }) => {
      studentStats[student_entity_id] = {
        student_id,
        student_entity_id,
        student_number: students.student_number,
        full_name: students.profiles.full_name,
        total_sessions: totalSessions,
        present_count: 0,
        absent_count: 0,
        late_count: 0,
        excused_count: 0,
        attendance_rate: 0,
        sessions: []
      };
    });

    // Compter les présences par statut
    attendances.forEach(att => {
      if (studentStats[att.student_id]) {
        studentStats[att.student_id][`${att.status}_count`]++;
        studentStats[att.student_id].sessions.push({
          session_id: att.session_id,
          status: att.status
        });
      }
    });

    // Calculer le taux de présence et convertir en tableau
    const statsArray = Object.values(studentStats).map(stat => ({
      ...stat,
      attendance_rate: totalSessions > 0 ? Math.round((stat.present_count / totalSessions) * 100) : 0,
      attendance_summary: `${stat.present_count}/${totalSessions} séances`
    }));

    // Trier par taux de présence décroissant
    statsArray.sort((a, b) => b.attendance_rate - a.attendance_rate);

    return { data: statsArray, error: null };
  } catch (error) {
    console.error('getCourseAttendanceStats:', error);
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
