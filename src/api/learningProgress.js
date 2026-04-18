import { supabase } from '../supabase';

const LEVEL_WEIGHTS = {
  beginner: 25,
  intermediate: 50,
  advanced: 75,
  expert: 100
};

const average = (values) => {
  const numericValues = (values || [])
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  if (!numericValues.length) {
    return 0;
  }

  return numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
};

const clampPercent = (value) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.max(0, Math.min(100, numericValue));
};

const getDateValue = (row) => {
  const source =
    row?.lastActivityAt ||
    row?.last_activity_at ||
    row?.completed_at ||
    row?.updated_at ||
    row?.updatedAt ||
    row?.triggered_at ||
    row?.acquired_at ||
    row?.created_at ||
    row?.last_accessed ||
    null;

  if (!source) {
    return 0;
  }

  const timestamp = new Date(source).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const mergeById = (...collections) => {
  const merged = new Map();

  collections
    .flat()
    .filter(Boolean)
    .forEach((item) => {
      if (!item?.id) {
        return;
      }

      merged.set(item.id, item);
    });

  return Array.from(merged.values());
};

const safeSelect = async (builderFactory) => {
  try {
    const { data, error } = await builderFactory();

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.warn('learningProgress query failed:', error?.message || error);
    return [];
  }
};

const fetchLearningPaths = async ({ profileId, studentId }) => {
  const queries = [];

  if (profileId) {
    queries.push(
      safeSelect(() => supabase.from('learning_paths').select('*').eq('user_id', profileId))
    );
  }

  if (studentId) {
    queries.push(
      safeSelect(() => supabase.from('learning_paths').select('*').eq('student_id', studentId))
    );
  }

  if (!queries.length) {
    return [];
  }

  const results = await Promise.all(queries);
  return mergeById(...results).sort((left, right) => getDateValue(right) - getDateValue(left));
};

const fetchStudentAlerts = async ({ profileId, studentId }) => {
  const queries = [];

  if (profileId) {
    queries.push(
      safeSelect(() => supabase.from('student_alerts').select('*').eq('user_id', profileId))
    );
  }

  if (studentId) {
    queries.push(
      safeSelect(() => supabase.from('student_alerts').select('*').eq('student_id', studentId))
    );
  }

  if (!queries.length) {
    return [];
  }

  const results = await Promise.all(queries);
  return mergeById(...results).sort((left, right) => getDateValue(right) - getDateValue(left));
};

const fetchStudentCourseIds = async ({ profileId, studentId }) => {
  const queries = [];

  if (profileId) {
    queries.push(
      safeSelect(() => supabase.from('student_courses').select('course_id').eq('student_id', profileId))
    );
  }

  if (studentId) {
    queries.push(
      safeSelect(() =>
        supabase.from('student_courses').select('course_id').eq('student_entity_id', studentId)
      )
    );
  }

  if (!queries.length) {
    return [];
  }

  const results = await Promise.all(queries);
  return [...new Set(results.flat().map((row) => Number(row?.course_id)).filter(Boolean))];
};

const fetchCoursesMap = async (courseIds) => {
  const normalizedIds = [...new Set((courseIds || []).map((value) => Number(value)).filter(Boolean))];

  if (!normalizedIds.length) {
    return new Map();
  }

  const rows = await safeSelect(() =>
    supabase.from('courses').select('id, code, name, credits, level, semester').in('id', normalizedIds)
  );

  return new Map(rows.map((course) => [Number(course.id), course]));
};

const normalizeLearningPaths = (paths, progressRows, coursesMap) => {
  const progressByPath = progressRows.reduce((accumulator, row) => {
    const pathId = row?.path_id;

    if (!pathId) {
      return accumulator;
    }

    if (!accumulator.has(pathId)) {
      accumulator.set(pathId, []);
    }

    accumulator.get(pathId).push(row);
    return accumulator;
  }, new Map());

  return (paths || []).map((path) => {
    const pathRows = progressByPath.get(path.id) || [];
    const derivedProgress = average(
      pathRows.map((row) =>
        row?.progress_percentage ??
        row?.completion_percentage ??
        (row?.completed_at ? 100 : row?.viewed ? 50 : 0)
      )
    );
    const explicitProgress = path?.progress ?? path?.completion_percentage;
    const progress = clampPercent(explicitProgress ?? derivedProgress);
    const completedResources = pathRows.filter(
      (row) => row?.completed_at || Number(row?.progress_percentage) === 100
    ).length;

    return {
      id: path.id,
      title: path.title || path.name || 'Parcours sans titre',
      description: path.description || '',
      status: path.status || (progress >= 100 ? 'completed' : 'active'),
      progress,
      estimatedHours: Number(path.estimated_hours || 0) || null,
      objectives: Array.isArray(path.objectives) ? path.objectives : [],
      totalResources: pathRows.length,
      completedResources,
      course: coursesMap.get(Number(path.course_id)) || null,
      updatedAt: path.updated_at || path.created_at || null
    };
  });
};

const normalizeCompetencies = (rows = []) =>
  rows
    .map((row) => {
      const competency = row?.competencies || {};
      const level =
        row?.level_achieved ||
        row?.proficiency_level ||
        row?.mastery_level ||
        competency?.level ||
        'beginner';

      return {
        id: row.id || competency.id || `${row.student_id || 'student'}-${row.competency_id}`,
        competencyId: competency.id || row.competency_id,
        name: competency.name || row.name || 'Competence',
        description: competency.description || row.description || '',
        category: competency.category || row.category || 'Autres',
        level,
        score: LEVEL_WEIGHTS[level] || 0,
        source: row.acquired_from || row.source || null,
        verified: Boolean(row.verified || row.verified_at || row.acquired_at),
        acquiredAt: row.acquired_at || row.created_at || null
      };
    })
    .sort((left, right) => {
      if (left.category === right.category) {
        return left.name.localeCompare(right.name);
      }

      return left.category.localeCompare(right.category);
    });

const normalizeAnalytics = (rows = [], coursesMap) =>
  rows
    .map((row) => ({
      id: row.id,
      course: coursesMap.get(Number(row.course_id)) || null,
      attendance: Number(row.attendance_percentage || 0) || 0,
      finalGrade: Number(row.final_grade || row.exam_grade || row.continuous_assessment_avg || 0) || 0,
      predictedGrade: Number(row.predicted_grade || 0) || 0,
      resourcesViewed: Number(row.resources_viewed || 0) || 0,
      resourcesDownloaded: Number(row.resources_downloaded || 0) || 0,
      quizAverage: Number(row.quiz_avg_score || 0) || 0,
      learningHours: Number(row.total_learning_hours || 0) || 0,
      riskFlag: Boolean(row.risk_flag),
      riskReasons: Array.isArray(row.risk_reasons) ? row.risk_reasons : [],
      updatedAt: row.updated_at || row.created_at || null
    }))
    .sort((left, right) => getDateValue(right) - getDateValue(left));

const ACTIVITY_LABELS = {
  resource: 'Ressource',
  assignment: 'Devoir',
  practice_quiz: 'Quiz',
  interactive_resource: 'Activite interactive',
  forum: 'Forum'
};

const normalizeCourseActivity = (rows = [], coursesMap) => {
  const grouped = new Map();

  (rows || []).forEach((row) => {
    const courseId = Number(row?.course_id);

    if (!courseId) {
      return;
    }

    if (!grouped.has(courseId)) {
      grouped.set(courseId, []);
    }

    const metadata = row?.metadata && typeof row.metadata === 'object' ? row.metadata : {};

    grouped.get(courseId).push({
      id: `${row.activity_type}:${row.activity_id}`,
      type: row.activity_type,
      typeLabel: ACTIVITY_LABELS[row.activity_type] || row.activity_type,
      title: row.activity_title || ACTIVITY_LABELS[row.activity_type] || 'Activite',
      status: row.status || 'not_started',
      progress: clampPercent(row.progress_percentage),
      metricValue: row.metric_value != null ? Number(row.metric_value) : null,
      lastActivityAt: row.last_activity_at || null,
      completedAt: row.completed_at || null,
      dueAt: metadata?.due_at || null,
      metadata
    });
  });

  return Array.from(grouped.entries())
    .map(([courseId, items]) => {
      const sortedItems = items.sort((left, right) => {
        if (left.status === 'overdue' && right.status !== 'overdue') {
          return -1;
        }

        if (right.status === 'overdue' && left.status !== 'overdue') {
          return 1;
        }

        return getDateValue(right) - getDateValue(left);
      });

      const totalActivities = sortedItems.length;
      const completedActivities = sortedItems.filter((item) => item.status === 'completed').length;
      const overdueActivities = sortedItems.filter((item) => item.status === 'overdue').length;
      const averageProgress = average(sortedItems.map((item) => item.progress));
      const lastActivityAt = sortedItems.reduce((latest, item) => {
        return getDateValue(item) > getDateValue({ last_activity_at: latest }) ? item.lastActivityAt : latest;
      }, null);

      return {
        id: `course-${courseId}`,
        courseId,
        course: coursesMap.get(courseId) || null,
        totalActivities,
        completedActivities,
        overdueActivities,
        averageProgress,
        lastActivityAt,
        items: sortedItems,
        breakdown: {
          resources: sortedItems.filter((item) => item.type === 'resource').length,
          assignments: sortedItems.filter((item) => item.type === 'assignment').length,
          quizzes: sortedItems.filter((item) => item.type === 'practice_quiz').length,
          interactive: sortedItems.filter((item) => item.type === 'interactive_resource').length,
          forums: sortedItems.filter((item) => item.type === 'forum').length
        }
      };
    })
    .sort((left, right) => {
      if (left.overdueActivities !== right.overdueActivities) {
        return right.overdueActivities - left.overdueActivities;
      }

      return getDateValue({ last_activity_at: right.lastActivityAt }) -
        getDateValue({ last_activity_at: left.lastActivityAt });
    });
};

const ALERT_TITLES = {
  low_attendance: 'Presence faible',
  grade_drop: 'Baisse des resultats',
  no_submission: 'Travail non remis',
  missing_exam: 'Examen manque',
  risk_failure: 'Risque d echec',
  plagiarism_detected: 'Suspicion de plagiat'
};

const normalizeAlerts = (rows = [], coursesMap) =>
  rows.map((row) => ({
    id: row.id,
    title: row.title || ALERT_TITLES[row.alert_type] || 'Alerte academique',
    description: row.description || row.action_taken || '',
    type: row.alert_type || 'academic',
    severity: row.severity || 'medium',
    resolved: Boolean(row.resolved),
    acknowledged: Boolean(row.acknowledged || row.is_read),
    course: coursesMap.get(Number(row.related_course_id)) || null,
    triggeredAt: row.triggered_at || row.created_at || null
  }));

export const getStudentLearningProgress = async ({ profileId, studentId }) => {
  const numericStudentId = Number(studentId);

  if (!profileId && !numericStudentId) {
    return {
      data: null,
      error: new Error('Etudiant non identifie')
    };
  }

  try {
    if (numericStudentId) {
      try {
        const { error: refreshError } = await supabase.rpc('refresh_student_learning_metrics', {
          p_student_id: numericStudentId,
          p_course_id: null
        });

        if (refreshError) {
          throw refreshError;
        }
      } catch (refreshError) {
        console.warn('learningProgress refresh failed:', refreshError?.message || refreshError);
      }
    }

    const [
      enrolledCourseIds,
      paths,
      competenciesRows,
      analyticsRows,
      alertRows,
      progressRows,
      activityRows
    ] = await Promise.all([
      fetchStudentCourseIds({ profileId, studentId: numericStudentId }),
      fetchLearningPaths({ profileId, studentId: numericStudentId }),
      numericStudentId
        ? safeSelect(() =>
            supabase
              .from('student_competencies')
              .select('*, competencies(*)')
              .eq('student_id', numericStudentId)
          )
        : [],
      numericStudentId
        ? safeSelect(() =>
            supabase
              .from('student_performance_analytics')
              .select('*')
              .eq('student_id', numericStudentId)
          )
        : [],
      fetchStudentAlerts({ profileId, studentId: numericStudentId }),
      numericStudentId
        ? safeSelect(() =>
            supabase
              .from('student_path_progress')
              .select('*')
              .eq('student_id', numericStudentId)
          )
        : [],
      numericStudentId
        ? safeSelect(() =>
            supabase
              .from('course_activity_progress')
              .select('*, courses(id, code, name, credits, level, semester)')
              .eq('student_id', numericStudentId)
          )
        : []
    ]);

    const fallbackCourseIds = [
      ...paths.map((path) => path?.course_id),
      ...analyticsRows.map((row) => row?.course_id),
      ...alertRows.map((row) => row?.related_course_id),
      ...activityRows.map((row) => row?.course_id)
    ]
      .map((value) => Number(value))
      .filter(Boolean);

    const scopedCourseIds = enrolledCourseIds.length
      ? enrolledCourseIds
      : [...new Set(fallbackCourseIds)];
    const scopedCourseIdSet = new Set(scopedCourseIds);

    const filteredAnalyticsRows = analyticsRows.filter(
      (row) => !scopedCourseIdSet.size || scopedCourseIdSet.has(Number(row?.course_id))
    );
    const filteredAlertRows = alertRows.filter(
      (row) =>
        !row?.related_course_id ||
        !scopedCourseIdSet.size ||
        scopedCourseIdSet.has(Number(row.related_course_id))
    );
    const filteredActivityRows = activityRows.filter(
      (row) => !scopedCourseIdSet.size || scopedCourseIdSet.has(Number(row?.course_id))
    );

    const coursesMap = await fetchCoursesMap([
      ...scopedCourseIds,
      ...paths.map((path) => path?.course_id),
      ...filteredAnalyticsRows.map((row) => row?.course_id),
      ...filteredAlertRows.map((row) => row?.related_course_id),
      ...filteredActivityRows.map((row) => row?.course_id)
    ]);

    const learningPaths = normalizeLearningPaths(paths, progressRows, coursesMap);
    const competencies = normalizeCompetencies(competenciesRows);
    const analytics = normalizeAnalytics(filteredAnalyticsRows, coursesMap);
    const alerts = normalizeAlerts(filteredAlertRows, coursesMap);
    const courseActivity = normalizeCourseActivity(filteredActivityRows, coursesMap);

    const overdueActivities = courseActivity
      .flatMap((course) =>
        course.items
          .filter((item) => item.status === 'overdue')
          .map((item) => ({
            ...item,
            course: course.course
          }))
      )
      .sort((left, right) => getDateValue(right) - getDateValue(left));

    const progressSignals = [];

    if (learningPaths.length) {
      progressSignals.push(average(learningPaths.map((path) => path.progress)));
    }

    if (courseActivity.length) {
      progressSignals.push(average(courseActivity.map((course) => course.averageProgress)));
    }

    const summary = {
      activePaths: learningPaths.filter((path) => path.status !== 'completed').length,
      averageProgress: progressSignals.length ? average(progressSignals) : 0,
      totalActivities: courseActivity.reduce((sum, course) => sum + course.totalActivities, 0),
      completedActivities: courseActivity.reduce((sum, course) => sum + course.completedActivities, 0),
      overdueActivities: overdueActivities.length,
      coursesInProgress: courseActivity.filter(
        (course) => course.averageProgress > 0 && course.averageProgress < 100
      ).length,
      competenciesCount: competencies.length,
      masteredCompetencies: competencies.filter((item) =>
        ['advanced', 'expert'].includes(item.level)
      ).length,
      activeAlerts: alerts.filter((alert) => !alert.resolved).length,
      atRiskCourses: analytics.filter((item) => item.riskFlag).length,
      averageAttendance: average(analytics.map((item) => item.attendance)),
      predictedAverage: average(
        analytics
          .map((item) => item.predictedGrade || item.finalGrade)
          .filter((value) => Number.isFinite(value))
      ),
      totalLearningHours: analytics.reduce(
        (sum, item) => sum + (Number(item.learningHours) || 0),
        0
      )
    };

    return {
      data: {
        summary,
        learningPaths,
        competencies,
        analytics,
        alerts,
        courseActivity,
        overdueActivities
      },
      error: null
    };
  } catch (error) {
    console.error('getStudentLearningProgress:', error);
    return { data: null, error };
  }
};

export default {
  getStudentLearningProgress
};
