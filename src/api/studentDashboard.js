import { supabase } from '../supabase';
import { getStudentPublishedGrades } from './grades';
import { getStudentCourseIds, getScheduleSessions } from './schedule';

const toIsoString = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
};

const addMinutes = (value, minutes = 0) => {
  const start = new Date(value);
  if (Number.isNaN(start.getTime())) {
    return null;
  }

  return new Date(start.getTime() + Number(minutes || 0) * 60000);
};

const normalizeScheduleItem = (session) => {
  const start = new Date(session.date);
  const end = addMinutes(session.date, session.duration);

  return {
    id: session.id,
    course_name: session.courses?.name || 'Cours inconnu',
    start_time: toIsoString(start),
    end_time: toIsoString(end),
    day_of_week: start.getDay(),
    room: session.room || '',
    professor_name:
      session.professors?.profiles?.full_name ||
      session.professors?.full_name ||
      session.professors?.name ||
      'Professeur inconnu',
    course_id: session.course_id,
    status: session.status || 'scheduled'
  };
};

const normalizeGradeItem = (grade) => ({
  id: grade.id,
  course_name: grade.cours?.name || grade.cours?.code || 'Cours inconnu',
  value: Number(grade.note ?? 0),
  max_value: Number(grade.max_value ?? 20),
  published_at: grade.published_at || grade.date_evaluation || grade.created_at || null
});

const normalizeNewsItem = (item) => ({
  id: item.id,
  title: item.title,
  content: item.description || item.content || '',
  published_at: item.date || item.published_at || item.created_at || null,
  author: item.author || '',
  image_url: item.image_url || null
});

const normalizeEventItem = (item) => ({
  id: item.id,
  title: item.title,
  description: item.description || '',
  start_date: item.start_date,
  end_date: item.end_date || item.start_date,
  location: item.location || '',
  event_type: item.type || item.event_type || 'general'
});

export const getStudentDashboardData = async ({ profileId, studentId }) => {
  try {
    const numericStudentId = Number(studentId);
    if (!profileId || isNaN(numericStudentId)) {
      return { data: null, error: new Error('Étudiant non identifié ou ID invalide') };
    }

    const [
      { courseIds, error: courseIdsError },
      { data: grades, error: gradesError },
      { data: news, error: newsError },
      { data: events, error: eventsError },
      { data: requests, error: requestsError },
      { data: exams, error: examsError }
    ] = await Promise.all([
      getStudentCourseIds(profileId),
      getStudentPublishedGrades(numericStudentId),
      supabase
        .from('news')
        .select('id, title, description, date, image_url, created_at')
        .order('date', { ascending: false })
        .limit(3),
      supabase
        .from('events')
        .select('id, title, description, start_date, end_date, location, type')
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(5),
      supabase
        .from('validation_queue')
        .select('id, request_type, status, created_at')
        .eq('requester_id', profileId)
        .order('created_at', { ascending: false })
        .limit(3),
      supabase
        .from('student_exams')
        .select('*, exams(id, title, date, duration)')
        .eq('student_id', numericStudentId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(2)
    ]);

    if (courseIdsError) throw courseIdsError;
    if (gradesError) throw gradesError;
    if (newsError) throw newsError;
    if (eventsError) throw eventsError;
    if (requestsError) throw requestsError;
    if (examsError) throw examsError;

    const { sessions, error: sessionsError } = courseIds?.length
      ? await getScheduleSessions({ courseIds })
      : { sessions: [], error: null };

    if (sessionsError) throw sessionsError;

    const upcomingSchedule = (sessions || [])
      .filter((session) => session.date && new Date(session.date).getTime() >= Date.now())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(normalizeScheduleItem);

    const recentGrades = (grades || []).slice(0, 5).map(normalizeGradeItem);
    const nextCourse = upcomingSchedule[0]
      ? {
          name: upcomingSchedule[0].course_name,
          time: upcomingSchedule[0].start_time
        }
      : null;

    return {
      data: {
        next_course: nextCourse,
        recent_grades: recentGrades,
        schedule: upcomingSchedule.slice(0, 8),
        news: (news || []).map(normalizeNewsItem),
        events: (events || []).map(normalizeEventItem),
        requests: (requests || []),
        upcoming_exams: (exams || []).map(e => ({
          id: e.exams?.id,
          title: e.exams?.title,
          start_time: e.exams?.start_time,
          duration: e.exams?.duration
        }))
      },
      error: null
    };
  } catch (error) {
    console.error('getStudentDashboardData:', error);
    return { data: null, error };
  }
};
