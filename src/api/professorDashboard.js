import { supabase } from '../supabase';
import { getProfessorCourses } from './grades';
import { getScheduleSessions } from './schedule';
import { getCMSBanners, getCMSNews, getCMSEvents } from './cms';

const normalizeProfessorEntityId = async ({ profileId, professorId }) => {
  const numericProfessorId = Number(professorId);

  if (Number.isInteger(numericProfessorId) && numericProfessorId > 0) {
    return { professorEntityId: numericProfessorId, error: null };
  }

  if (!profileId) {
    return { professorEntityId: null, error: null };
  }

  const { data, error } = await supabase
    .from('professors')
    .select('id')
    .eq('profile_id', profileId)
    .maybeSingle();

  if (error) {
    return { professorEntityId: null, error };
  }

  return { professorEntityId: data?.id ?? null, error: null };
};

const inferEventType = (event = {}) => {
  const haystack = `${event.title || ''} ${event.description || ''}`.toLowerCase();

  if (/(reunion|réunion)/.test(haystack)) {
    return 'reunion';
  }

  if (/(formation|atelier|seminaire|séminaire|conference|conférence)/.test(haystack)) {
    return 'formation';
  }

  if (/(administratif|administration|examen|jury|surveillance)/.test(haystack)) {
    return 'administratif';
  }

  return 'autre';
};

const normalizeCourseItem = (course, statsByCourse = {}) => ({
  id: course.id,
  title: course.name || course.code || 'Cours sans titre',
  department: course.niveaux?.filieres?.name || 'Departement non renseigne',
  level: course.niveaux?.name || (course.semester ? `S${course.semester}` : 'Niveau non renseigne'),
  students: statsByCourse.students || 0,
  sessions: statsByCourse.sessions || 0
});

const normalizeExamItem = (exam) => ({
  id: exam.id,
  title: exam.title || 'Examen sans titre',
  course: exam.courses?.name || exam.courses?.code || 'Cours inconnu',
  date: exam.date || exam.created_at || null,
  status: exam.status || 'draft'
});

const normalizePendingGradeItem = (exam, pendingCount = 0) => ({
  id: `pending-${exam.id}`,
  examId: exam.id,
  examTitle: exam.title || 'Examen sans titre',
  course: exam.courses?.name || exam.courses?.code || 'Cours inconnu',
  date: exam.date || exam.created_at || null,
  pendingCount
});

const normalizeNewsItem = (item) => ({
  id: item.id,
  title: item.title || 'Actualite',
  content: item.description || '',
  date: item.date || item.created_at || null,
  category: 'information'
});

const normalizeEventItem = (item) => ({
  id: item.id,
  title: item.title || 'Evenement',
  date: item.start_date || item.created_at || null,
  location: item.location || 'Lieu non precise',
  type: inferEventType(item)
});

export const getProfessorDashboardData = async ({ profileId, professorId }) => {
  try {
    if (!profileId) {
      return { data: null, error: new Error('Professeur non identifie') };
    }

    const [
      { data: assignedCourses, error: coursesError },
      { professorEntityId, error: professorEntityError },
      { data: newsRows, error: newsError },
      { data: eventRows, error: eventsError }
    ] = await Promise.all([
      getProfessorCourses(profileId),
      normalizeProfessorEntityId({ profileId, professorId }),
      getCMSNews(5),
      getCMSEvents(10)
    ]);

    if (coursesError) throw coursesError;
    if (professorEntityError) throw professorEntityError;
    if (newsError) throw newsError;
    if (eventsError) throw eventsError;

    const courseIds = (assignedCourses || []).map((course) => course.id).filter(Boolean);

    const [
      { sessions, error: sessionsError },
      { data: enrollments, error: enrollmentsError },
      examsResult
    ] = await Promise.all([
      getScheduleSessions({ professorId: profileId }),
      courseIds.length
        ? supabase
            .from('student_courses')
            .select('course_id, student_id')
            .in('course_id', courseIds)
        : Promise.resolve({ data: [], error: null }),
      professorEntityId
        ? supabase
            .from('exams')
            .select('id, title, course_id, date, status, created_at, courses(name, code)')
            .eq('professor_id', profileId) // Use profileId (UUID) instead of professorEntityId (INTEGER)
            .order('date', { ascending: true })
        : courseIds.length
          ? supabase
              .from('exams')
              .select('id, title, course_id, date, status, created_at, courses(name, code)')
              .in('course_id', courseIds)
              .order('date', { ascending: true })
          : Promise.resolve({ data: [], error: null })
    ]);

    if (sessionsError) throw sessionsError;
    if (enrollmentsError) throw enrollmentsError;
    if (examsResult.error) throw examsResult.error;

    const studentCountsByCourse = new Map();
    (enrollments || []).forEach((row) => {
      studentCountsByCourse.set(row.course_id, (studentCountsByCourse.get(row.course_id) || 0) + 1);
    });

    const sessionCountsByCourse = new Map();
    (sessions || []).forEach((session) => {
      sessionCountsByCourse.set(
        session.course_id,
        (sessionCountsByCourse.get(session.course_id) || 0) + 1
      );
    });

    const normalizedCourses = (assignedCourses || []).map((course) =>
      normalizeCourseItem(course, {
        students: studentCountsByCourse.get(course.id) || 0,
        sessions: sessionCountsByCourse.get(course.id) || 0
      })
    );

    const examRows = examsResult.data || [];
    const normalizedExams = examRows.map(normalizeExamItem);
    const examIds = examRows.map((exam) => exam.id);

    const { data: studentExamRows, error: studentExamsError } = examIds.length
      ? await supabase
          .from('student_exams')
          .select('exam_id, grade, status')
          .in('exam_id', examIds)
      : { data: [], error: null };

    if (studentExamsError) {
      throw studentExamsError;
    }

    const pendingByExam = new Map();

    (studentExamRows || []).forEach((row) => {
      if (row.status === 'absent') {
        return;
      }

      const hasGrade = row.grade !== null && row.grade !== undefined;
      const isPending = !hasGrade || row.status === 'pending';

      if (isPending) {
        pendingByExam.set(row.exam_id, (pendingByExam.get(row.exam_id) || 0) + 1);
      }
    });

    const pendingGrades = examRows
      .map((exam) => normalizePendingGradeItem(exam, pendingByExam.get(exam.id) || 0))
      .filter((exam) => exam.pendingCount > 0);

    return {
      data: {
        stats: {
          totalStudents: normalizedCourses.reduce((total, course) => total + Number(course.students || 0), 0),
          totalCourses: normalizedCourses.length,
          totalExams: normalizedExams.length,
          pendingGrades: pendingGrades.reduce((total, exam) => total + Number(exam.pendingCount || 0), 0)
        },
        courses: normalizedCourses,
        exams: normalizedExams,
        pendingGrades,
        news: (newsRows || []).map(normalizeNewsItem),
        events: (eventRows || []).map(normalizeEventItem)
      },
      error: null
    };
  } catch (error) {
    console.error('getProfessorDashboardData:', error);
    return { data: null, error };
  }
};
