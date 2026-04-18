export const COMPLETION_WEIGHT_KEYS = [
  'resource',
  'assignment',
  'practice_quiz',
  'interactive_resource',
  'forum'
];

export const DEFAULT_COMPLETION_SETTINGS = Object.freeze({
  resource_completion_mode: 'view',
  assignment_completion_mode: 'submission',
  forum_completion_mode: 'reply_or_post',
  forum_target_count: 1,
  quiz_completion_threshold: 50,
  interactive_completion_threshold: 70,
  attendance_alert_threshold: 60,
  assignment_overdue_alert_threshold: 1,
  passing_grade_threshold: 10,
  course_progress_weights: Object.freeze({
    resource: 20,
    assignment: 30,
    practice_quiz: 20,
    interactive_resource: 20,
    forum: 10
  })
});

const clampNumber = (value, minimum, maximum, fallback) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(maximum, Math.max(minimum, numericValue));
};

export const normalizeCourseProgressWeights = (weights = {}) => {
  const source = weights && typeof weights === 'object' ? weights : {};

  return COMPLETION_WEIGHT_KEYS.reduce((accumulator, key) => {
    accumulator[key] = clampNumber(
      source[key],
      0,
      100,
      DEFAULT_COMPLETION_SETTINGS.course_progress_weights[key]
    );
    return accumulator;
  }, {});
};

export const mergeCourseCompletionSettings = (settings = {}) => ({
  ...DEFAULT_COMPLETION_SETTINGS,
  ...settings,
  forum_target_count: clampNumber(
    settings?.forum_target_count,
    0,
    20,
    DEFAULT_COMPLETION_SETTINGS.forum_target_count
  ),
  quiz_completion_threshold: clampNumber(
    settings?.quiz_completion_threshold,
    1,
    100,
    DEFAULT_COMPLETION_SETTINGS.quiz_completion_threshold
  ),
  interactive_completion_threshold: clampNumber(
    settings?.interactive_completion_threshold,
    1,
    100,
    DEFAULT_COMPLETION_SETTINGS.interactive_completion_threshold
  ),
  attendance_alert_threshold: clampNumber(
    settings?.attendance_alert_threshold,
    0,
    100,
    DEFAULT_COMPLETION_SETTINGS.attendance_alert_threshold
  ),
  assignment_overdue_alert_threshold: clampNumber(
    settings?.assignment_overdue_alert_threshold,
    1,
    20,
    DEFAULT_COMPLETION_SETTINGS.assignment_overdue_alert_threshold
  ),
  passing_grade_threshold: clampNumber(
    settings?.passing_grade_threshold,
    0,
    20,
    DEFAULT_COMPLETION_SETTINGS.passing_grade_threshold
  ),
  course_progress_weights: normalizeCourseProgressWeights(settings?.course_progress_weights)
});

export const calculateWeightedCourseProgress = (items = [], settings = DEFAULT_COMPLETION_SETTINGS) => {
  const mergedSettings = mergeCourseCompletionSettings(settings);
  const grouped = new Map();

  (items || []).forEach((item) => {
    if (!item?.type) {
      return;
    }

    if (!grouped.has(item.type)) {
      grouped.set(item.type, []);
    }

    grouped.get(item.type).push(Number(item.progress) || 0);
  });

  let weightedTotal = 0;
  let weightTotal = 0;

  grouped.forEach((progresses, type) => {
    const weight = Number(mergedSettings.course_progress_weights?.[type] || 0);

    if (!weight) {
      return;
    }

    const averageProgress =
      progresses.reduce((sum, value) => sum + value, 0) / Math.max(progresses.length, 1);

    weightedTotal += averageProgress * weight;
    weightTotal += weight;
  });

  if (!weightTotal) {
    const flattened = (items || []).map((item) => Number(item?.progress) || 0);

    if (!flattened.length) {
      return 0;
    }

    return flattened.reduce((sum, value) => sum + value, 0) / flattened.length;
  }

  return weightedTotal / weightTotal;
};

export const serializeCourseCompletionSettings = (settings = {}) => {
  const merged = mergeCourseCompletionSettings(settings);

  return {
    resource_completion_mode: merged.resource_completion_mode,
    assignment_completion_mode: merged.assignment_completion_mode,
    forum_completion_mode: merged.forum_completion_mode,
    forum_target_count: merged.forum_target_count,
    quiz_completion_threshold: merged.quiz_completion_threshold,
    interactive_completion_threshold: merged.interactive_completion_threshold,
    attendance_alert_threshold: merged.attendance_alert_threshold,
    assignment_overdue_alert_threshold: merged.assignment_overdue_alert_threshold,
    passing_grade_threshold: merged.passing_grade_threshold,
    course_progress_weights: merged.course_progress_weights
  };
};
