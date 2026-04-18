import { supabase } from '../supabase';

/**
 * Récupère les données consolidées pour le tableau de bord administrateur
 */
export const getAdminDashboardData = async () => {
  try {
    const safeCount = async (table, filter = {}) => {
      let query = supabase.from(table).select('*', { count: 'exact', head: true });
      Object.entries(filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      const { count, error } = await query;
      return error ? 0 : count;
    };

    const [
      studentsCount,
      professorsCount,
      departmentsCount,
      coursesCount,
      pendingCorrections,
      recentActivity
    ] = await Promise.all([
      safeCount('students', { status: 'active' }),
      safeCount('professors'),
      safeCount('departments'),
      safeCount('courses'),
      safeCount('demandes_correction_notes', { statut: 'en_attente' }),
      supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(6)
    ]);

    return {
      data: {
        stats: {
          totalStudents: studentsCount,
          totalProfessors: professorsCount,
          totalDepartments: departmentsCount,
          totalCourses: coursesCount,
          pendingCorrections: pendingCorrections
        },
        recentActivity: recentActivity.data || []
      },
      error: null
    };
  } catch (error) {
    console.error('getAdminDashboardData:', error);
    return { data: null, error };
  }
};
