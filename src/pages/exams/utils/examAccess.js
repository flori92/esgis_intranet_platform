export const hasExamEarlyAccess = (exam = {}, profileId = null) => {
  const allowedProfileIds = exam?.settings?.early_access_profile_ids;

  if (!profileId || !Array.isArray(allowedProfileIds)) {
    return false;
  }

  return allowedProfileIds.map(String).includes(String(profileId));
};

export const isBeforeOfficialExamStart = (exam = {}, nowValue = new Date()) => {
  if (!exam?.date && !exam?.exam_date) {
    return false;
  }

  const examDate = new Date(exam.date || exam.exam_date);
  const now = nowValue instanceof Date ? nowValue : new Date(nowValue);

  return !Number.isNaN(examDate.getTime())
    && !Number.isNaN(now.getTime())
    && examDate > now;
};

export const getEffectiveExamTimerSettings = (exam = {}, profileId = null, nowValue = new Date()) => {
  const settings = exam?.settings || {};

  if (hasExamEarlyAccess(exam, profileId) && isBeforeOfficialExamStart(exam, nowValue)) {
    return {
      ...settings,
      timer_mode: 'individual'
    };
  }

  return settings;
};
