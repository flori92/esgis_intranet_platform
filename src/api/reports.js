/**
 * Service Rapports & Statistiques admin
 * Centralise les requêtes de ReportsPage.
 */
import { supabase } from '../supabase';

/**
 * Charge toutes les donnees brutes necessaires aux rapports admin.
 * @returns {Promise<{ data: { departments, students, professors, exams } | null, error: Error|null }>}
 */
export const getReportsData = async () => {
  try {
    const [
      { data: departments, error: deptError },
      { data: students, error: studError },
      { data: professors, error: profError },
      { data: exams, error: examError }
    ] = await Promise.all([
      supabase.from('departments').select('*'),
      supabase.from('students').select('*, departments(name)'),
      supabase.from('professors').select('*, departments(name)'),
      supabase.from('exams').select('*, professors(full_name), courses(name)')
    ]);

    const firstError = deptError || studError || profError || examError;
    if (firstError) {
      return { data: null, error: firstError };
    }

    return {
      data: {
        departments: departments || [],
        students: students || [],
        professors: professors || [],
        exams: exams || []
      },
      error: null
    };
  } catch (error) {
    console.error('getReportsData:', error);
    return { data: null, error };
  }
};
