const toDateOrNull = (value) => {
  if (!value) {
    return null;
  }

  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const getExamTimerMode = (settings = {}) => {
  return settings?.timer_mode === 'room' ? 'room' : 'individual';
};

export const getExamEndTime = ({
  examDate,
  duration,
  arrivalTime,
  settings = {},
  fallbackStartTime = null
}) => {
  const durationMinutes = Number(duration || 0);
  if (durationMinutes <= 0) {
    return null;
  }

  const timerMode = getExamTimerMode(settings);
  const baseStartTime = timerMode === 'room'
    ? toDateOrNull(examDate)
    : toDateOrNull(arrivalTime) || toDateOrNull(fallbackStartTime);

  if (!baseStartTime) {
    return null;
  }

  return new Date(baseStartTime.getTime() + (durationMinutes * 60 * 1000));
};

export const getRemainingTimeParts = (endTime, nowValue = new Date()) => {
  const endDate = toDateOrNull(endTime);
  const nowDate = toDateOrNull(nowValue) || new Date();

  if (!endDate) {
    return {
      totalMs: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true
    };
  }

  const totalMs = Math.max(0, endDate.getTime() - nowDate.getTime());
  const totalSeconds = Math.floor(totalMs / 1000);

  return {
    totalMs,
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    isExpired: totalMs <= 0
  };
};

export const formatCountdown = ({ hours = 0, minutes = 0, seconds = 0 }) => {
  const paddedHours = String(hours).padStart(2, '0');
  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(seconds).padStart(2, '0');

  return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
};
