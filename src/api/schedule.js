/**
 * Service Emploi du temps — ESGIS Campus
 * Centralise les requêtes liées aux sessions de cours.
 */
import { supabase } from '../supabase';

const resolveStudentEntityId = async (profileId) => {
  if (!profileId) {
    return { studentId: null, error: null };
  }

  const { data, error } = await supabase
    .from('students')
    .select('id')
    .eq('profile_id', profileId)
    .maybeSingle();

  if (error) {
    return { studentId: null, error };
  }

  return { studentId: data?.id ?? null, error: null };
};

const resolveProfessorEntityId = async (profileId) => {
  if (!profileId) {
    return { professorEntityId: null, error: null };
  }

  const { data, error } = await supabase
    .from('professors')
    .select('id')
    .eq('profile_id', profileId)
    .maybeSingle();

  if (error) {
    return { professorEntityId: null, error };
  }

  return { professorEntityId: data?.id ?? null, error: null };
};

/**
 * Récupère les IDs de cours auxquels un étudiant est inscrit.
 * @param {string} studentProfileId - profile_id de l'étudiant
 * @returns {Promise<{ courseIds: string[], error: Error|null }>}
 */
export const getStudentCourseIds = async (studentProfileId) => {
  try {
    const { studentId, error: studentError } = await resolveStudentEntityId(studentProfileId);
    if (studentError) {
      return { courseIds: [], error: studentError };
    }

    if (!studentId) {
      return { courseIds: [], error: null };
    }

    const { data, error } = await supabase
      .from('student_courses')
      .select('course_id')
      .eq('student_id', studentId);

    if (error) {
      return { courseIds: [], error };
    }

    return {
      courseIds: (data || []).map((row) => row.course_id),
      error: null
    };
  } catch (error) {
    console.error('getStudentCourseIds:', error);
    return { courseIds: [], error };
  }
};

/**
 * Récupère les sessions de cours avec filtres optionnels.
 * @param {Object} options
 * @param {string[]} [options.courseIds] - Limiter aux cours donnés
 * @param {string} [options.professorId] - Limiter au professeur donné
 * @param {string} [options.courseId] - Filtrer sur un cours unique ('all' = pas de filtre)
 * @returns {Promise<{ sessions: Array, error: Error|null }>}
 */
export const getScheduleSessions = async ({ courseIds, professorId, courseId } = {}) => {
  try {
    let professorEntityId = null;

    if (professorId) {
      const { professorEntityId: resolvedProfessorId, error: professorError } =
        await resolveProfessorEntityId(professorId);

      if (professorError) {
        return { sessions: [], error: professorError };
      }

      if (!resolvedProfessorId) {
        return { sessions: [], error: null };
      }

      professorEntityId = resolvedProfessorId;
    }

    let query = supabase
      .from('course_sessions')
      .select(`
        id, date, duration, room, status, course_id, professor_id,
        courses:course_id (id, name, code, semester),
        professors:professor_id (
          id,
          profile_id,
          profiles:profile_id (
            full_name
          )
        )
      `)
      .order('date', { ascending: true });

    if (courseIds?.length) {
      query = query.in('course_id', courseIds);
    }

    if (professorEntityId) {
      query = query.eq('professor_id', professorEntityId);
    }

    if (courseId && courseId !== 'all') {
      query = query.eq('course_id', courseId);
    }

    const { data, error } = await query;

    if (error) {
      return { sessions: [], error };
    }

    return { sessions: data || [], error: null };
  } catch (error) {
    console.error('getScheduleSessions:', error);
    return { sessions: [], error };
  }
};
