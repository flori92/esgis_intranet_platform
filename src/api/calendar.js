/**
 * API Calendrier & Emploi du temps — ESGIS Campus §5.7
 */
import { supabase } from '../supabase';

const toLegacyWeekday = (dateValue) => {
  const date = new Date(dateValue);
  const day = date.getDay();
  return day === 0 ? 7 : day;
};

const toTimeString = (dateValue) => {
  const date = new Date(dateValue);
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${hours}:${minutes}`;
};

const addMinutes = (dateValue, minutes) => {
  const date = new Date(dateValue);
  date.setMinutes(date.getMinutes() + Number(minutes || 0));
  return date;
};

const getProfessorIdsByFilters = async (filters) => {
  if (!filters.professeurId) return null;

  const { data: professor, error } = await supabase
    .from('professors')
    .select('id')
    .eq('profile_id', filters.professeurId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return professor?.id ? [professor.id] : [];
};

/** Recupere tous les creneaux d'emploi du temps */
export const getScheduleEvents = async (filters = {}) => {
  try {
    let query = supabase
      .from('course_sessions')
      .select(`
        id,
        course_id,
        professor_id,
        department_id,
        level_code,
        date,
        duration,
        room,
        status,
        created_at,
        updated_at,
        courses:course_id(
          id,
          code,
          name,
          level,
          semester
        ),
        professors:professor_id(
          id,
          profile_id,
          profiles:profile_id(
            id,
            full_name
          )
        )
      `)
      .order('date', { ascending: true });

    if (filters.departmentId) {
      query = query.eq('department_id', filters.departmentId);
    }
    if (filters.levelCode) {
      query = query.eq('level_code', filters.levelCode);
    }

    const professorIds = await getProfessorIdsByFilters(filters);
    if (professorIds && professorIds.length === 0) {
      return { data: [], error: null };
    }

    if (professorIds?.length) {
      query = query.in('professor_id', professorIds);
    }
    if (filters.coursId || filters.courseId) {
      query = query.eq('course_id', filters.coursId || filters.courseId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const formatted = (data || []).map((session) => {
      const startTime = session.date;
      const endTime = addMinutes(session.date, session.duration);
      const professorProfile = session.professors?.profiles;

      return {
        ...session,
        jour_semaine: toLegacyWeekday(startTime),
        heure_debut: toTimeString(startTime),
        heure_fin: toTimeString(endTime),
        salle: session.room,
        date_debut: startTime,
        date_fin: endTime.toISOString(),
        cours: session.courses,
        professeur: {
          id: session.professors?.id,
          profile_id: session.professors?.profile_id,
          full_name: professorProfile?.full_name || '-',
        },
        groupe: null,
      };
    });

    return { data: formatted, error: null };
  } catch (error) {
    console.error('getScheduleEvents:', error);
    return { data: null, error };
  }
};

/** Recupere les evenements institutionnels */
export const getInstitutionalEvents = async (filters = {}) => {
  try {
    let query = supabase
      .from('events')
      .select('id, title, description, location, start_date, end_date, type, department_id, level_code, created_by, created_at, updated_at')
      .order('start_date', { ascending: true });

    if (filters.departmentId) {
      query = query.eq('department_id', filters.departmentId);
    }
    if (filters.levelCode) {
      query = query.eq('level_code', filters.levelCode);
    }

    const { data, error } = await query;

    if (error) throw error;

    const formatted = (data || []).map((event) => ({
      ...event,
      lieu: event.location,
      date_debut: event.start_date,
      date_fin: event.end_date,
      organisateur_id: event.created_by,
      public_cible: ['all'],
    }));

    return { data: formatted, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/** Cree un creneau */
export const createScheduleEvent = async (eventData) => {
  try {
    const { data, error } = await supabase
      .from('course_sessions')
      .insert(eventData)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/** Met a jour un creneau */
export const updateScheduleEvent = async (id, eventData) => {
  try {
    const { data, error } = await supabase
      .from('course_sessions')
      .update(eventData)
      .eq('id', id)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/** Supprime un creneau */
export const deleteScheduleEvent = async (id) => {
  try {
    const { error } = await supabase.from('course_sessions').delete().eq('id', id);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
};

/** Cree un evenement institutionnel */
export const createInstitutionalEvent = async (eventData) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .insert(eventData)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/** Supprime un evenement */
export const deleteInstitutionalEvent = async (id) => {
  try {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
};
