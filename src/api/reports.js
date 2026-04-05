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
      { data: filieres, error: filiError },
      { data: students, error: studError },
      { data: professors, error: profError },
      { data: exams, error: examError },
      { data: grades, error: gradeError },
      { data: documents, error: docError }
    ] = await Promise.all([
      supabase.from('departments').select('*'),
      supabase.from('filieres').select('*'),
      supabase.from('students').select('*, departments(name), filieres(name)'),
      supabase.from('professors').select('*, departments(name)'),
      supabase.from('exams').select('*, professor:profiles!professor_id(id, full_name), courses(id, name)'),
      supabase.from('grades').select('id, student_id, course_id, value, max_value, is_published'),
      supabase.from('generated_documents').select('id, created_at, status')
    ]);

    const firstError = deptError || filiError || studError || profError || examError || gradeError || docError;
    if (firstError) {
      return { data: null, error: firstError };
    }

    return {
      data: {
        departments: departments || [],
        filieres: filieres || [],
        students: students || [],
        professors: professors || [],
        exams: exams || [],
        grades: grades || [],
        documents: documents || []
      },
      error: null
    };
  } catch (error) {
    console.error('getReportsData:', error);
    return { data: null, error };
  }
};
