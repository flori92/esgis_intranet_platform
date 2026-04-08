import { supabase } from '../supabase';
import { uploadFile, removeFiles, createSignedUrl } from './storage';

const BUCKET = 'schedules';

const buildFilePath = ({ departmentId, levelCode, academicYear, weekStartDate }) =>
  `${departmentId}/${levelCode}/${academicYear || 'default'}/${weekStartDate}.pdf`;

/**
 * List weekly schedules with optional filters.
 */
export const getWeeklySchedules = async (filters = {}) => {
  try {
    let query = supabase
      .from('weekly_schedules')
      .select(`
        *,
        departments(id, name),
        profiles!uploaded_by(id, full_name)
      `)
      .order('week_start_date', { ascending: false });

    if (filters.departmentId) {
      query = query.eq('department_id', filters.departmentId);
    }
    if (filters.levelCode) {
      query = query.eq('level_code', filters.levelCode);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error };
  }
};

/**
 * Get latest published schedule for a student's filiere, or department + level.
 */
export const getStudentCurrentSchedule = async ({ departmentId, levelCode, filiereId }) => {
  try {
    let query = supabase
      .from('weekly_schedules')
      .select(`
        *,
        departments(id, name),
        profiles!uploaded_by(id, full_name)
      `)
      .eq('status', 'published')
      .order('week_start_date', { ascending: false });

    if (filiereId) {
      // Priorité à la filière spécifique
      query = query.eq('filiere_id', filiereId);
    } else {
      query = query.eq('department_id', departmentId).eq('level_code', levelCode);
    }

    const { data, error } = await query.limit(1).maybeSingle();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Get all published schedules for a student (history).
 */
export const getStudentScheduleHistory = async ({ departmentId, levelCode, filiereId }) => {
  try {
    let query = supabase
      .from('weekly_schedules')
      .select(`
        id, title, week_start_date, notes, file_path, created_at,
        departments(id, name),
        profiles!uploaded_by(id, full_name)
      `)
      .eq('status', 'published')
      .order('week_start_date', { ascending: false });

    if (filiereId) {
      query = query.eq('filiere_id', filiereId);
    } else {
      query = query.eq('department_id', departmentId).eq('level_code', levelCode);
    }

    const { data, error } = await query.limit(20);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error };
  }
};

/**
 * Upload a weekly schedule PDF and create the DB record.
 */
export const uploadWeeklySchedule = async ({
  file,
  title,
  departmentId,
  levelCode,
  weekStartDate,
  academicYear,
  notes,
  uploadedBy
}) => {
  try {
    const filePath = buildFilePath({ departmentId, levelCode, academicYear, weekStartDate });

    const { error: uploadError } = await uploadFile(BUCKET, filePath, file, {
      upsert: true,
      contentType: 'application/pdf'
    });
    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from('weekly_schedules')
      .insert({
        title,
        file_path: filePath,
        department_id: departmentId,
        level_code: levelCode,
        week_start_date: weekStartDate,
        academic_year: academicYear,
        uploaded_by: uploadedBy,
        notes,
        status: 'published'
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Update schedule metadata or status.
 */
export const updateWeeklySchedule = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('weekly_schedules')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Delete a schedule record and its PDF file.
 */
export const deleteWeeklySchedule = async (id) => {
  try {
    const { data: schedule, error: fetchError } = await supabase
      .from('weekly_schedules')
      .select('file_path')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    if (schedule?.file_path) {
      await removeFiles(BUCKET, [schedule.file_path]);
    }

    const { error } = await supabase
      .from('weekly_schedules')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
};

/**
 * Generate a signed URL for PDF preview/download (1 hour).
 */
export const getScheduleSignedUrl = async (filePath) => {
  try {
    const { signedUrl, error } = await createSignedUrl(BUCKET, filePath, 3600);
    if (error) throw error;
    return { signedUrl, error: null };
  } catch (error) {
    return { signedUrl: null, error };
  }
};

/**
 * Get all departments (for the upload form dropdown).
 */
export const getDepartments = async () => {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('id, name')
      .order('name');

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error };
  }
};

/**
 * Notify students of a new schedule.
 */
export const notifyStudentsOfNewSchedule = async ({ departmentId, levelCode, title, weekStartDate }) => {
  try {
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('profile_id')
      .eq('department_id', departmentId)
      .eq('level', levelCode);

    if (studentsError) throw studentsError;
    if (!students?.length) return { sent: 0, error: null };

    const { createNotificationsBulk } = await import('./notifications');

    const notifications = students.map((s) => ({
      recipient_id: s.profile_id,
      title: 'Nouvel emploi du temps disponible',
      content: `L'EDT "${title}" (semaine du ${weekStartDate}) est disponible.`,
      priority: 'high',
      read: false
    }));

    const { error } = await createNotificationsBulk(notifications);
    if (error) throw error;

    return { sent: notifications.length, error: null };
  } catch (error) {
    return { sent: 0, error };
  }
};
