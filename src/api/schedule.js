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
    if (!studentProfileId) {
      return { courseIds: [], error: null };
    }

    const { data, error } = await supabase
      .from('student_courses')
      .select('course_id')
      .eq('student_id', studentProfileId);

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
 * @param {number} [options.departmentId] - Filtrer par département
 * @param {string} [options.levelCode] - Filtrer par niveau
 * @returns {Promise<{ sessions: Array, error: Error|null }>}
 */
export const getScheduleSessions = async ({ courseIds, professorId, courseId, departmentId, levelCode } = {}) => {
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
        id, date, duration, room, status, course_id, professor_id, department_id, level_code,
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

    if (departmentId) {
      query = query.eq('department_id', departmentId);
    }

    if (levelCode) {
      query = query.eq('level_code', levelCode);
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

/**
 * Récupère les événements du calendrier académique (jours fériés, événements ESGIS).
 * @param {Object} filters
 * @returns {Promise<{ events: Array, error: Error|null }>}
 */
export const getInstitutionalCalendar = async (filters = {}) => {
  try {
    let query = supabase
      .from('events')
      .select('id, title, description, location, start_date, end_date, type, department_id, level_code')
      .order('start_date', { ascending: true });

    if (filters.departmentId) {
      query = query.eq('department_id', filters.departmentId);
    }
    if (filters.levelCode) {
      query = query.eq('level_code', filters.levelCode);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { events: data || [], error: null };
  } catch (error) {
    console.error('getInstitutionalCalendar:', error);
    return { events: [], error };
  }
};
