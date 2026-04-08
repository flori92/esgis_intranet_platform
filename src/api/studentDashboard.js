import { supabase } from '../supabase';
import { getStudentPublishedGrades } from './grades';
import { getStudentCourseIds, getScheduleSessions } from './schedule';
import { getCMSBanners, getCMSNews, getCMSEvents, getCMSAnnouncements } from './cms';

const toIsoString = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const addMinutes = (value, minutes = 0) => {
  const start = new Date(value);
  return Number.isNaN(start.getTime()) ? null : new Date(start.getTime() + Number(minutes || 0) * 60000);
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
    professor_name: session.professors?.profiles?.full_name || 'Professeur inconnu',
    course_id: session.course_id,
    status: session.status || 'scheduled'
  };
};

export const getStudentDashboardData = async ({ profileId, studentId }) => {
  try {
    const numericStudentId = Number(studentId);
    if (!profileId || isNaN(numericStudentId)) {
      return { data: null, error: new Error('Étudiant non identifié') };
    }

    const safe = async (fn) => {
      try { return await fn(); } catch { return { data: null, error: null }; }
    };

    const results = await Promise.all([
      safe(() => getStudentCourseIds(profileId)),
      safe(() => getStudentPublishedGrades(numericStudentId)),
      safe(() => getCMSNews(6)),
      safe(() => getCMSEvents(6)),
      safe(() => getCMSBanners()),
      safe(() => getCMSAnnouncements(5)),
      safe(() => supabase.from('validation_queue').select('id, request_type, status, created_at').eq('requester_id', profileId).order('created_at', { ascending: false }).limit(3)),
      safe(() => supabase.from('student_exams').select('*, exams(*)').eq('student_id', profileId).eq('status', 'pending').order('created_at', { ascending: true }).limit(2)),
      safe(() => supabase.from('stage_offres').select('*, entreprises(nom)').eq('etat', 'active').order('created_at', { ascending: false }).limit(3)),
      safe(() => supabase.from('job_offers').select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(3))
    ]);

    const [
      courseIdsRes, gradesRes, newsRes, eventsRes, bannersRes, 
      annRes, reqRes, examsRes, stagesRes, jobsRes
    ] = results;

    const courseIds = courseIdsRes?.courseIds || [];
    let sessions = [];
    if (courseIds.length) {
      const scheduleResult = await safe(() => getScheduleSessions({ courseIds }));
      sessions = scheduleResult?.sessions || [];
    }

    const upcomingSchedule = (sessions || [])
      .filter((s) => s.date && new Date(s.date).getTime() >= Date.now())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(normalizeScheduleItem);

    return {
      data: {
        next_course: upcomingSchedule[0] ? { name: upcomingSchedule[0].course_name, time: upcomingSchedule[0].start_time } : null,
        recent_grades: (gradesRes?.data || []).slice(0, 5).map(g => ({
          id: g.id, course_name: g.cours?.name || g.cours?.code || 'Cours', value: g.note, max_value: g.max_value || 20, published_at: g.published_at || g.created_at
        })),
        schedule: upcomingSchedule.slice(0, 8),
        banners: bannersRes?.data || [],
        news: (newsRes?.data || []).map(n => ({ ...n, content: n.excerpt || n.content || '' })),
        events: eventsRes?.data || [],
        announcements: annRes?.data || [],
        requests: reqRes?.data || [],
        upcoming_exams: (examsRes?.data || []).map(e => ({
          id: e.exams?.id, title: e.exams?.title, start_time: e.exams?.exam_date
        })),
        career_opportunities: [
          ...(stagesRes?.data || []).map(s => ({ id: s.id, type: 'stage', title: s.titre, company: s.entreprises?.nom || 'Entreprise', date: s.created_at })),
          ...(jobsRes?.data || []).map(j => ({ id: j.id, type: 'job', title: j.title, company: j.company_name, date: j.created_at }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4)
      },
      error: null
    };
  } catch (error) {
    console.error('getStudentDashboardData:', error);
    return { data: null, error };
  }
};
