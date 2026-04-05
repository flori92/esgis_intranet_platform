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
