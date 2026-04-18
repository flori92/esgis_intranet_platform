import { supabase } from '../supabase';
import { getProfessorManagedCourses } from './courses';
import {
  calculateWeightedCourseProgress,
  DEFAULT_COMPLETION_SETTINGS,
  mergeCourseCompletionSettings,
  serializeCourseCompletionSettings
} from '../utils/courseCompletion';

const average = (values = []) => {
  const numericValues = values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  if (!numericValues.length) {
    return 0;
  }

  return numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
};

const getDateValue = (value) => {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const unique = (values = []) => [...new Set(values.filter(Boolean))];

const toRiskLabel = (reason) => {
  switch (reason) {
    case 'attendance_below_threshold':
      return 'Presence sous le seuil';
    case 'assignments_overdue':
      return 'Devoirs en retard';
    case 'quiz_below_threshold':
      return 'Quiz sous le seuil';
    case 'average_below_threshold':
      return 'Moyenne sous le seuil';
    default:
      return reason;
  }
};

const buildStudentDirectory = (students = [], profiles = []) => {
  const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));

  return new Map(
    (students || []).map((student) => [
      student.id,
      {
        id: student.id,
        studentNumber: student.student_number || '-',
        profileId: student.profile_id || null,
        fullName: profileMap.get(student.profile_id)?.full_name || 'Etudiant'
      }
    ])
  );
};

const buildStudentProgressMap = (activityRows = [], settings) => {
  const rowsByStudent = new Map();

  (activityRows || []).forEach((row) => {
    const studentId = Number(row?.student_id);

    if (!studentId) {
      return;
    }

    if (!rowsByStudent.has(studentId)) {
      rowsByStudent.set(studentId, []);
    }

    rowsByStudent.get(studentId).push({
      type: row.activity_type,
      progress: Number(row.progress_percentage || 0) || 0,
      status: row.status || 'not_started'
    });
  });

  return new Map(
    Array.from(rowsByStudent.entries()).map(([studentId, items]) => [
      studentId,
      {
        progress: calculateWeightedCourseProgress(items, settings),
        overdueActivities: items.filter((item) => item.status === 'overdue').length,
        completedActivities: items.filter((item) => item.status === 'completed').length,
        totalActivities: items.length
      }
    ])
  );
};

const buildAnalyticsByStudentMap = (rows = []) => {
  const sortedRows = [...(rows || [])].sort(
    (left, right) => getDateValue(right.updated_at || right.created_at) - getDateValue(left.updated_at || left.created_at)
  );

  const map = new Map();

  sortedRows.forEach((row) => {
    const studentId = Number(row?.student_id);

    if (!studentId || map.has(studentId)) {
      return;
    }

    map.set(studentId, row);
  });

  return map;
};

const computeSeverity = ({ attendance, predictedGrade, overdueActivities }) => {
  let score = 0;

  if (Number.isFinite(attendance) && attendance < 40) {
    score += 3;
  } else if (Number.isFinite(attendance) && attendance < 60) {
    score += 2;
  }

  if (Number.isFinite(predictedGrade) && predictedGrade < 8) {
    score += 3;
  } else if (Number.isFinite(predictedGrade) && predictedGrade < 10) {
    score += 2;
  }

  if (Number.isFinite(overdueActivities) && overdueActivities >= 2) {
    score += 2;
  } else if (Number.isFinite(overdueActivities) && overdueActivities > 0) {
    score += 1;
  }

  if (score >= 6) {
    return { label: 'Critique', level: 'critical', score };
  }

  if (score >= 4) {
    return { label: 'Elevee', level: 'high', score };
  }

  return { label: 'A surveiller', level: 'medium', score };
};

const ensureProfessorCanManageCourse = async (profileId, courseId) => {
  const { data: courses, error } = await getProfessorManagedCourses(profileId);

  if (error) {
    throw error;
  }

  if (!(courses || []).some((course) => Number(course.id) === Number(courseId))) {
    throw new Error('Acces non autorise a ce cours');
  }
};

export const getProfessorLearningInsights = async ({ profileId, courseId = null }) => {
  try {
    if (!profileId) {
      return { data: null, error: new Error('Professeur non identifie') };
    }

    // 1. Fetch data from Dynamic View for real-time performance
    let viewQuery = supabase
      .from('v_professor_course_stats')
      .select('*')
      .eq('professor_id', profileId);

    if (courseId) {
      viewQuery = viewQuery.eq('course_id', Number(courseId));
    }

    const { data: viewData, error: viewError } = await viewQuery;

    if (viewError) {
      console.error('Error fetching from v_professor_course_stats:', viewError);
      // Fallback or handle error
    }

    const { data: managedCourses, error: managedCoursesError } = await getProfessorManagedCourses(profileId);

    if (managedCoursesError) {
      throw managedCoursesError;
    }

    const scopedCourses = (managedCourses || []).filter(
      (managedCourse) => !courseId || Number(managedCourse.id) === Number(courseId)
    );
    const scopedCourseIds = scopedCourses.map((managedCourse) => managedCourse.id);

    if (!scopedCourseIds.length) {
      return {
        data: {
          summary: {
            totalCourses: 0,
            totalTrackedStudents: 0,
            atRiskStudents: 0,
            overdueActivities: 0,
            averageProgress: 0,
            averageAttendance: 0,
            averagePredictedGrade: 0,
            configuredCourses: 0
          },
          courses: [],
          studentsNeedingAttention: []
        },
        error: null
      };
    }

    // Attempt to refresh metrics in background (don't wait if it's slow, but here we keep it for consistency)
    try {
      supabase.rpc('refresh_professor_learning_metrics', {
        p_professor_profile_id: profileId,
        p_course_id: courseId ? Number(courseId) : null
      }).then(({ error }) => {
        if (error) console.warn('Background refresh_professor_learning_metrics failed:', error.message);
      });
    } catch (e) {
      // Ignore
    }

    const [{ data: settingsRows, error: settingsError }, { data: enrollmentRows, error: enrollmentError }, { data: analyticsRows, error: analyticsError }, { data: activityRows, error: activityError }] =
      await Promise.all([
        supabase.from('course_completion_settings').select('*').in('course_id', scopedCourseIds),
        supabase
          .from('student_courses')
          .select('course_id, student_entity_id')
          .in('course_id', scopedCourseIds),
        supabase
          .from('student_performance_analytics')
          .select('*')
          .in('course_id', scopedCourseIds),
        supabase
          .from('course_activity_progress')
          .select('*')
          .in('course_id', scopedCourseIds)
      ]);

    if (settingsError) throw settingsError;
    if (enrollmentError) throw enrollmentError;
    if (analyticsError) throw analyticsError;
    if (activityError) throw activityError;

    const studentIds = unique((enrollmentRows || []).map((row) => row.student_entity_id).map(Number));
    const { data: studentsRows, error: studentsError } = studentIds.length
      ? await supabase.from('students').select('id, student_number, profile_id').in('id', studentIds)
      : { data: [], error: null };

    if (studentsError) throw studentsError;

    const profileIds = unique((studentsRows || []).map((student) => student.profile_id));
    const { data: profilesRows, error: profilesError } = profileIds.length
      ? await supabase.from('profiles').select('id, full_name').in('id', profileIds)
      : { data: [], error: null };

    if (profilesError) throw profilesError;

    const studentDirectory = buildStudentDirectory(studentsRows || [], profilesRows || []);
    const settingsMap = new Map(
      (settingsRows || []).map((row) => [Number(row.course_id), mergeCourseCompletionSettings(row)])
    );
    const customSettingsCourseIds = new Set((settingsRows || []).map((row) => Number(row.course_id)));

    const courseInsights = scopedCourses
      .map((managedCourse) => {
        const mergedSettings = mergeCourseCompletionSettings(
          settingsMap.get(Number(managedCourse.id)) || DEFAULT_COMPLETION_SETTINGS
        );
        
        // Use Dynamic View data if available for this course
        const courseViewData = (viewData || []).find(v => Number(v.course_id) === Number(managedCourse.id));
        
        const courseActivityRows = (activityRows || []).filter(
          (row) => Number(row.course_id) === Number(managedCourse.id)
        );
        const courseAnalyticsRows = (analyticsRows || []).filter(
          (row) => Number(row.course_id) === Number(managedCourse.id)
        );
        
        const studentProgressMap = buildStudentProgressMap(courseActivityRows, mergedSettings);
        const analyticsByStudent = buildAnalyticsByStudentMap(courseAnalyticsRows);
        const enrolledStudentIds = unique(
          (enrollmentRows || [])
            .filter(row => Number(row.course_id) === Number(managedCourse.id))
            .map((row) => Number(row.student_entity_id))
        );

        return {
          course: managedCourse,
          settings: mergedSettings,
          hasCustomSettings: customSettingsCourseIds.has(Number(managedCourse.id)),
          studentCount: courseViewData?.student_count ?? enrolledStudentIds.length,
          averageProgress: courseViewData?.avg_progress ?? average(enrolledStudentIds.map(id => studentProgressMap.get(id)?.progress)),
          completedActivities: courseActivityRows.filter((row) => row.status === 'completed').length,
          totalActivities: courseActivityRows.length,
          overdueActivities: courseActivityRows.filter((row) => row.status === 'overdue').length,
          atRiskStudents: courseViewData?.at_risk_count ?? enrolledStudentIds.filter((studentId) => {
            const analytics = analyticsByStudent.get(studentId);
            const progress = studentProgressMap.get(studentId);
            return Boolean(analytics?.risk_flag) || Number(progress?.overdueActivities || 0) > 0;
          }).length,
          averageAttendance: courseViewData?.avg_attendance ?? average(courseAnalyticsRows.map((row) => row.attendance_percentage)),
          averagePredictedGrade: courseViewData?.avg_predicted_grade ?? average(
            courseAnalyticsRows.map((row) => row.predicted_grade || row.final_grade)
          ),
          updatedAt: courseViewData?.last_updated ?? null
        };
      })
      .sort((left, right) => {
        if (left.atRiskStudents !== right.atRiskStudents) {
          return right.atRiskStudents - left.atRiskStudents;
        }
        return right.overdueActivities - left.overdueActivities;
      });

    const studentsNeedingAttention = courseInsights
      .flatMap((courseInsight) => {
        const courseActivityRows = (activityRows || []).filter(
          (row) => Number(row.course_id) === Number(courseInsight.course.id)
        );
        const courseAnalyticsRows = (analyticsRows || []).filter(
          (row) => Number(row.course_id) === Number(courseInsight.course.id)
        );
        const studentProgressMap = buildStudentProgressMap(courseActivityRows, courseInsight.settings);
        const analyticsByStudent = buildAnalyticsByStudentMap(courseAnalyticsRows);

        return unique(
          [
            ...courseAnalyticsRows.map((row) => Number(row.student_id)),
            ...courseActivityRows.map((row) => Number(row.student_id))
          ].filter(Boolean)
        )
          .map((studentId) => {
            const analytics = analyticsByStudent.get(studentId) || null;
            const progress = studentProgressMap.get(studentId) || {
              progress: 0,
              overdueActivities: 0,
              completedActivities: 0,
              totalActivities: 0
            };
            const student = studentDirectory.get(studentId) || {
              fullName: 'Etudiant',
              studentNumber: '-'
            };
            
            if (!analytics?.risk_flag && progress.overdueActivities === 0) {
              return null;
            }

            const reasons = unique([
              ...(analytics?.risk_reasons || []).map(toRiskLabel),
              ...(progress.overdueActivities > 0 ? ['Devoirs en retard'] : [])
            ]);

            const severity = computeSeverity({
              attendance: Number(analytics?.attendance_percentage),
              predictedGrade: Number(analytics?.predicted_grade || analytics?.final_grade),
              overdueActivities: progress.overdueActivities
            });

            return {
              id: `${courseInsight.course.id}-${studentId}`,
              studentId,
              studentName: student.fullName,
              studentNumber: student.studentNumber,
              courseId: courseInsight.course.id,
              courseName: courseInsight.course.name,
              progress: progress.progress,
              attendance: Number(analytics?.attendance_percentage || 0) || 0,
              predictedGrade: Number(analytics?.predicted_grade || analytics?.final_grade || 0) || 0,
              overdueActivities: progress.overdueActivities,
              reasons,
              severity: severity.label,
              severityLevel: severity.level,
              severityScore: severity.score
            };
          })
          .filter(Boolean);
      })
      .sort((left, right) => right.severityScore - left.severityScore);

    const summary = {
      totalCourses: courseInsights.length,
      totalTrackedStudents: unique((enrollmentRows || []).map((row) => Number(row.student_entity_id))).length,
      atRiskStudents: studentsNeedingAttention.length,
      overdueActivities: courseInsights.reduce((sum, ci) => sum + Number(ci.overdueActivities || 0), 0),
      averageProgress: average(courseInsights.map((ci) => ci.averageProgress)),
      averageAttendance: average(courseInsights.map((ci) => ci.averageAttendance)),
      averagePredictedGrade: average(courseInsights.map((ci) => ci.averagePredictedGrade)),
      configuredCourses: courseInsights.filter((ci) => ci.hasCustomSettings).length
    };

    return {
      data: { summary, courses: courseInsights, studentsNeedingAttention },
      error: null
    };
  } catch (error) {
    console.error('getProfessorLearningInsights:', error);
    return { data: null, error };
  }
};

export const upsertProfessorCourseCompletionSettings = async ({
  profileId,
  courseId,
  settings
}) => {
  try {
    if (!profileId || !courseId) {
      return { data: null, error: new Error('Parametres insuffisants') };
    }

    await ensureProfessorCanManageCourse(profileId, courseId);

    const serializedSettings = serializeCourseCompletionSettings(settings);
    const { data: existingRow, error: existingError } = await supabase
      .from('course_completion_settings')
      .select('id, created_by')
      .eq('course_id', Number(courseId))
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    const { data, error } = await supabase
      .from('course_completion_settings')
      .upsert(
        {
          id: existingRow?.id,
          course_id: Number(courseId),
          ...serializedSettings,
          created_by: existingRow?.created_by || profileId,
          updated_by: profileId
        },
        { onConflict: 'course_id' }
      )
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    try {
      const { error: refreshError } = await supabase.rpc('refresh_course_learning_metrics', {
        p_course_id: Number(courseId)
      });

      if (refreshError) {
        throw refreshError;
      }
    } catch (refreshError) {
      console.warn('refresh_course_learning_metrics failed:', refreshError?.message || refreshError);
    }

    return {
      data: mergeCourseCompletionSettings(data),
      error: null
    };
  } catch (error) {
    console.error('upsertProfessorCourseCompletionSettings:', error);
    return { data: null, error };
  }
};

export const resetProfessorCourseCompletionSettings = async ({ profileId, courseId }) => {
  try {
    if (!profileId || !courseId) {
      return { data: null, error: new Error('Parametres insuffisants') };
    }

    await ensureProfessorCanManageCourse(profileId, courseId);

    const { error } = await supabase
      .from('course_completion_settings')
      .delete()
      .eq('course_id', Number(courseId));

    if (error) {
      throw error;
    }

    try {
      const { error: refreshError } = await supabase.rpc('refresh_course_learning_metrics', {
        p_course_id: Number(courseId)
      });

      if (refreshError) {
        throw refreshError;
      }
    } catch (refreshError) {
      console.warn('refresh_course_learning_metrics failed:', refreshError?.message || refreshError);
    }

    return {
      data: mergeCourseCompletionSettings(),
      error: null
    };
  } catch (error) {
    console.error('resetProfessorCourseCompletionSettings:', error);
    return { data: null, error };
  }
};

export default {
  DEFAULT_COMPLETION_SETTINGS,
  getProfessorLearningInsights,
  upsertProfessorCourseCompletionSettings,
  resetProfessorCourseCompletionSettings
};
