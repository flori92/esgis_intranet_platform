import { supabase } from '../supabase';
import { getStudentPublishedGrades } from './grades';
import { getStudentCourseIds, getScheduleSessions } from './schedule';
import { getCMSBanners, getCMSNews, getCMSEvents, getCMSAnnouncements } from './cms';

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

    const safe = async (fn) => {
      try { return await fn(); } catch { return { data: null, error: null }; }
    };

    const [
      courseIdsResult,
      gradesResult,
      cmsNewsResult,
      cmsEventsResult,
      cmsBannersResult,
      cmsAnnouncementsResult,
      requestsResult,
      examsResult
    ] = await Promise.all([
      safe(() => getStudentCourseIds(profileId)),
      safe(() => getStudentPublishedGrades(numericStudentId)),
      safe(() => getCMSNews(6)),
      safe(() => getCMSEvents(6)),
      safe(() => getCMSBanners()),
      safe(() => getCMSAnnouncements(5)),
      safe(() =>
        supabase
          .from('validation_queue')
          .select('id, request_type, status, created_at')
          .eq('requester_id', profileId)
          .order('created_at', { ascending: false })
          .limit(3)
      ),
      safe(() =>
        supabase
          .from('student_exams')
          .select('*, exams(*)')
          .eq('student_id', profileId)
          .eq('status', 'pending')
          .order('created_at', { ascending: true })
          .limit(2)
      )
    ]);

    const courseIds = courseIdsResult?.courseIds || [];
    const grades = gradesResult?.data || [];
    const cmsNews = cmsNewsResult?.data || [];
    const cmsEvents = cmsEventsResult?.data || [];
    const cmsBanners = cmsBannersResult?.data || [];
    const cmsAnnouncements = cmsAnnouncementsResult?.data || [];
    const requests = requestsResult?.data || [];
    const exams = examsResult?.data || [];

    let sessions = [];
    if (courseIds.length) {
      try {
        const scheduleResult = await getScheduleSessions({ courseIds });
        sessions = scheduleResult?.sessions || [];
      } catch {
        sessions = [];
      }
    }

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
        banners: cmsBanners || [],
        news: (cmsNews || []).map((item) => ({
          id: item.id,
          title: item.title,
          content: item.excerpt || item.content || '',
          excerpt: item.excerpt || '',
          image_url: item.image_url || null,
          category: item.category || 'general',
          is_featured: item.is_featured || false,
          published_at: item.published_at || item.created_at || null
        })),
        events: (cmsEvents || []).map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description || '',
          start_date: item.start_date,
          end_date: item.end_date || item.start_date,
          location: item.location || '',
          category: item.category || 'general',
          image_url: item.image_url || null
        })),
        announcements: cmsAnnouncements || [],
        requests: (requests || []),
        upcoming_exams: (exams || []).map(e => ({
          id: e.exams?.id,
          title: e.exams?.title,
          start_time: e.exams?.exam_date,
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
