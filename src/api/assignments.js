import { supabase } from '../supabase';
import { createSignedUrl, removeFiles, uploadFile } from './storage';

const ASSIGNMENT_BUCKET = 'assignment-submissions';

const normalizeCriteria = (criteria) =>
  Array.isArray(criteria)
    ? criteria
        .map((item, index) => ({
          id: item?.id || `criterion-${index + 1}`,
          title: String(item?.title || item?.name || '').trim(),
          description: String(item?.description || '').trim(),
          max_points: Number(item?.max_points ?? item?.points ?? 0) || 0
        }))
        .filter((item) => item.title)
    : [];

const toIsoOrNull = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const sanitizeFileName = (fileName = 'fichier') =>
  String(fileName || 'fichier')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const getNowIso = () => new Date().toISOString();

const isAfterNow = (value) => {
  if (!value) {
    return false;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) && timestamp > Date.now();
};

const isPastNow = (value) => {
  if (!value) {
    return false;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) && timestamp < Date.now();
};

const isSubmissionLate = (assignment, submittedAt = getNowIso()) => {
  if (!assignment?.due_at) {
    return false;
  }

  const submittedTimestamp = new Date(submittedAt).getTime();
  const dueTimestamp = new Date(assignment.due_at).getTime();

  return Number.isFinite(submittedTimestamp) &&
    Number.isFinite(dueTimestamp) &&
    submittedTimestamp > dueTimestamp;
};

const canStillSubmit = (assignment, submittedAt = getNowIso()) => {
  if (!assignment) {
    return false;
  }

  if (assignment.status === 'draft' || assignment.status === 'archived') {
    return false;
  }

  if (assignment.status === 'closed') {
    return false;
  }

  if (!assignment.due_at) {
    return true;
  }

  const submittedTimestamp = new Date(submittedAt).getTime();
  const dueTimestamp = new Date(assignment.due_at).getTime();

  if (!Number.isFinite(submittedTimestamp) || !Number.isFinite(dueTimestamp)) {
    return true;
  }

  if (submittedTimestamp <= dueTimestamp) {
    return true;
  }

  if (!assignment.allow_late_submission) {
    return false;
  }

  if (!assignment.late_until) {
    return true;
  }

  const lateTimestamp = new Date(assignment.late_until).getTime();
  return Number.isFinite(lateTimestamp) && submittedTimestamp <= lateTimestamp;
};

const normalizeRubricRow = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description || '',
  criteria: normalizeCriteria(row.criteria),
  created_at: row.created_at,
  updated_at: row.updated_at
});

const resolveProfessorCourseAccess = async (courseId, professorProfileId) => {
  const { data, error } = await supabase
    .from('professor_courses')
    .select('course_id')
    .eq('course_id', Number(courseId))
    .eq('professor_id', professorProfileId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Acces non autorise a ce cours');
  }
};

const resolveStudentCourseAccess = async (courseId, studentProfileId) => {
  const { data, error } = await supabase
    .from('student_courses')
    .select('course_id')
    .eq('course_id', Number(courseId))
    .eq('student_id', studentProfileId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Acces non autorise a ce devoir');
  }
};

const getCourseMap = async (courseIds) => {
  const normalizedCourseIds = [...new Set((courseIds || []).map((value) => Number(value)).filter(Boolean))];
  if (!normalizedCourseIds.length) {
    return new Map();
  }

  const { data, error } = await supabase
    .from('courses')
    .select('id, code, name, credits, semester, level')
    .in('id', normalizedCourseIds);

  if (error) {
    throw error;
  }

  return new Map((data || []).map((course) => [Number(course.id), course]));
};

const getProfileMap = async (profileIds) => {
  const normalizedIds = [...new Set((profileIds || []).filter(Boolean))];
  if (!normalizedIds.length) {
    return new Map();
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url')
    .in('id', normalizedIds);

  if (error) {
    throw error;
  }

  return new Map((data || []).map((profile) => [profile.id, profile]));
};

const getStudentEntityMapByProfiles = async (profileIds) => {
  const normalizedIds = [...new Set((profileIds || []).filter(Boolean))];
  if (!normalizedIds.length) {
    return new Map();
  }

  const { data, error } = await supabase
    .from('students')
    .select('id, profile_id, student_number, level')
    .in('profile_id', normalizedIds);

  if (error) {
    throw error;
  }

  return new Map((data || []).map((student) => [student.profile_id, student]));
};

const buildAssignmentLabelStatus = (assignment, submission = null) => {
  if (assignment.status === 'draft') {
    return { label: 'Brouillon', color: 'default' };
  }

  if (submission?.grade !== null && submission?.grade !== undefined) {
    return { label: 'Note', color: 'success' };
  }

  if (submission?.submitted_at) {
    if (submission.status === 'late' || isSubmissionLate(assignment, submission.submitted_at)) {
      return { label: 'Rendu en retard', color: 'warning' };
    }

    return { label: 'Rendu', color: 'info' };
  }

  if (!canStillSubmit(assignment)) {
    return { label: 'Clos', color: 'error' };
  }

  if (isPastNow(assignment.due_at)) {
    return { label: 'En retard', color: 'warning' };
  }

  if (isAfterNow(assignment.available_from)) {
    return { label: 'A venir', color: 'default' };
  }

  return { label: 'A rendre', color: 'primary' };
};

const normalizeAssignmentRow = ({ row, courseMap, submission = null, rubricMap = new Map() }) => {
  const storedRubric = row?.rubric_id ? rubricMap.get(row.rubric_id) : null;
  const rubricCriteria = normalizeCriteria(row?.rubric_snapshot || storedRubric?.criteria || []);
  const assignment = {
    id: row.id,
    course_id: row.course_id,
    title: row.title,
    description: row.description || '',
    instructions: row.instructions || '',
    available_from: row.available_from,
    due_at: row.due_at,
    late_until: row.late_until,
    allow_late_submission: Boolean(row.allow_late_submission),
    submission_mode: row.submission_mode || 'text_file',
    max_points: Number(row.max_points || 20),
    status: row.status || 'draft',
    rubric_id: row.rubric_id || null,
    rubric: row.rubric_id
      ? normalizeRubricRow(storedRubric || { id: row.rubric_id, title: 'Rubric', criteria: rubricCriteria })
      : rubricCriteria.length
        ? {
            id: null,
            title: 'Bareme du devoir',
            description: '',
            criteria: rubricCriteria
          }
        : null,
    course: courseMap.get(Number(row.course_id)) || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    submission: submission
      ? {
          id: submission.id,
          submission_text: submission.submission_text || '',
          attachment_path: submission.attachment_path || null,
          attachment_name: submission.attachment_name || null,
          attachment_size: Number(submission.attachment_size || 0) || 0,
          submitted_at: submission.submitted_at || submission.updated_at || null,
          status: submission.status || 'submitted',
          grade: submission.grade === null || submission.grade === undefined ? null : Number(submission.grade),
          feedback: submission.feedback || '',
          graded_at: submission.graded_at || null,
          graded_by: submission.graded_by || null
        }
      : null
  };

  assignment.display_status = buildAssignmentLabelStatus(assignment, assignment.submission);
  return assignment;
};

export const getProfessorRubrics = async (professorProfileId) => {
  try {
    const { data, error } = await supabase
      .from('assignment_rubrics')
      .select('*')
      .eq('professor_profile_id', professorProfileId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    return { data: (data || []).map(normalizeRubricRow), error: null };
  } catch (error) {
    console.error('getProfessorRubrics:', error);
    return { data: [], error };
  }
};

export const createAssignmentRubric = async ({
  professorProfileId,
  title,
  description,
  criteria
}) => {
  try {
    const payload = {
      professor_profile_id: professorProfileId,
      title: String(title || '').trim(),
      description: String(description || '').trim() || null,
      criteria: normalizeCriteria(criteria)
    };

    if (!payload.title) {
      throw new Error('Le titre de la rubric est requis');
    }

    if (!payload.criteria.length) {
      throw new Error('Ajoutez au moins un critere a la rubric');
    }

    const { data, error } = await supabase
      .from('assignment_rubrics')
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { data: normalizeRubricRow(data), error: null };
  } catch (error) {
    console.error('createAssignmentRubric:', error);
    return { data: null, error };
  }
};

export const getProfessorAssignments = async (professorProfileId, { courseId = null } = {}) => {
  try {
    let query = supabase
      .from('course_assignments')
      .select(`
        id,
        course_id,
        title,
        description,
        instructions,
        rubric_id,
        rubric_snapshot,
        available_from,
        due_at,
        late_until,
        allow_late_submission,
        submission_mode,
        max_points,
        status,
        created_at,
        updated_at
      `)
      .eq('professor_profile_id', professorProfileId)
      .order('created_at', { ascending: false });

    if (courseId && courseId !== 'all') {
      query = query.eq('course_id', Number(courseId));
    }

    const { data: assignments, error } = await query;
    if (error) {
      throw error;
    }

    const assignmentIds = (assignments || []).map((assignment) => assignment.id);
    const courseMap = await getCourseMap((assignments || []).map((assignment) => assignment.course_id));
    const rubricIds = [...new Set((assignments || []).map((assignment) => assignment.rubric_id).filter(Boolean))];

    const [rubricMap, submissions] = await Promise.all([
      (async () => {
        if (!rubricIds.length) return new Map();
        const { data: rubrics, error: rubricError } = await supabase
          .from('assignment_rubrics')
          .select('*')
          .in('id', rubricIds);

        if (rubricError) {
          throw rubricError;
        }

        return new Map((rubrics || []).map((rubric) => [rubric.id, rubric]));
      })(),
      assignmentIds.length
        ? (async () => {
            const { data: submissionRows, error: submissionError } = await supabase
              .from('assignment_submissions')
              .select('id, assignment_id, status, grade, student_profile_id, submitted_at')
              .in('assignment_id', assignmentIds);

            if (submissionError) {
              throw submissionError;
            }

            return submissionRows || [];
          })()
        : []
    ]);

    const submissionsByAssignment = submissions.reduce((accumulator, submission) => {
      if (!accumulator.has(submission.assignment_id)) {
        accumulator.set(submission.assignment_id, []);
      }
      accumulator.get(submission.assignment_id).push(submission);
      return accumulator;
    }, new Map());

    const expectedCounts = assignmentIds.length
      ? await Promise.all(
          (assignments || []).map(async (assignment) => {
            const { count, error: countError } = await supabase
              .from('student_courses')
              .select('student_id', { count: 'exact', head: true })
              .eq('course_id', assignment.course_id);

            if (countError) {
              throw countError;
            }

            return [assignment.id, count || 0];
          })
        )
      : [];

    const expectedMap = new Map(expectedCounts);

    const normalizedAssignments = (assignments || []).map((row) => {
      const assignment = normalizeAssignmentRow({ row, courseMap, rubricMap });
      const assignmentSubmissions = submissionsByAssignment.get(row.id) || [];
      const gradedCount = assignmentSubmissions.filter(
        (submission) => submission.grade !== null && submission.grade !== undefined
      ).length;

      return {
        ...assignment,
        stats: {
          expected_count: expectedMap.get(row.id) || 0,
          submitted_count: assignmentSubmissions.length,
          graded_count: gradedCount,
          pending_count: Math.max((expectedMap.get(row.id) || 0) - assignmentSubmissions.length, 0)
        }
      };
    });

    return { data: normalizedAssignments, error: null };
  } catch (error) {
    console.error('getProfessorAssignments:', error);
    return { data: [], error };
  }
};

const buildAssignmentPayload = async ({
  courseId,
  professorProfileId,
  title,
  description,
  instructions,
  rubricId,
  rubricSnapshot,
  availableFrom,
  dueAt,
  lateUntil,
  allowLateSubmission,
  submissionMode,
  maxPoints,
  status
}) => {
  await resolveProfessorCourseAccess(courseId, professorProfileId);

  let finalRubricSnapshot = normalizeCriteria(rubricSnapshot);
  let finalRubricId = rubricId || null;

  if (finalRubricId) {
    const { data: rubric, error: rubricError } = await supabase
      .from('assignment_rubrics')
      .select('*')
      .eq('id', finalRubricId)
      .eq('professor_profile_id', professorProfileId)
      .maybeSingle();

    if (rubricError) {
      throw rubricError;
    }

    if (!rubric) {
      throw new Error('Rubric introuvable');
    }

    finalRubricSnapshot = normalizeCriteria(rubric.criteria);
  }

  return {
    course_id: Number(courseId),
    professor_profile_id: professorProfileId,
    title: String(title || '').trim(),
    description: String(description || '').trim() || null,
    instructions: String(instructions || '').trim() || null,
    rubric_id: finalRubricId,
    rubric_snapshot: finalRubricSnapshot,
    available_from: toIsoOrNull(availableFrom) || getNowIso(),
    due_at: toIsoOrNull(dueAt),
    late_until: toIsoOrNull(lateUntil),
    allow_late_submission: Boolean(allowLateSubmission),
    submission_mode: submissionMode || 'text_file',
    max_points: Number(maxPoints || 20),
    status: status || 'draft'
  };
};

export const createCourseAssignment = async (payload) => {
  try {
    const insertPayload = await buildAssignmentPayload(payload);

    if (!insertPayload.title) {
      throw new Error('Le titre du devoir est requis');
    }

    const { data, error } = await supabase
      .from('course_assignments')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('createCourseAssignment:', error);
    return { data: null, error };
  }
};

export const updateCourseAssignment = async (assignmentId, payload) => {
  try {
    const { data: existing, error: existingError } = await supabase
      .from('course_assignments')
      .select('id, course_id, professor_profile_id')
      .eq('id', assignmentId)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (!existing) {
      throw new Error('Devoir introuvable');
    }

    const updatePayload = await buildAssignmentPayload({
      ...payload,
      courseId: payload.courseId || existing.course_id,
      professorProfileId: payload.professorProfileId || existing.professor_profile_id
    });

    const { data, error } = await supabase
      .from('course_assignments')
      .update(updatePayload)
      .eq('id', assignmentId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('updateCourseAssignment:', error);
    return { data: null, error };
  }
};

export const deleteCourseAssignment = async (assignmentId, professorProfileId) => {
  try {
    const { data: assignment, error: assignmentError } = await supabase
      .from('course_assignments')
      .select('id, course_id')
      .eq('id', assignmentId)
      .eq('professor_profile_id', professorProfileId)
      .maybeSingle();

    if (assignmentError) {
      throw assignmentError;
    }

    if (!assignment) {
      throw new Error('Devoir introuvable');
    }

    const { data: submissions, error: submissionError } = await supabase
      .from('assignment_submissions')
      .select('attachment_path')
      .eq('assignment_id', assignmentId);

    if (submissionError) {
      throw submissionError;
    }

    const filesToRemove = (submissions || [])
      .map((submission) => submission.attachment_path)
      .filter(Boolean);

    if (filesToRemove.length) {
      await removeFiles(ASSIGNMENT_BUCKET, filesToRemove);
    }

    const { error } = await supabase
      .from('course_assignments')
      .delete()
      .eq('id', assignmentId);

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('deleteCourseAssignment:', error);
    return { error };
  }
};

export const getProfessorAssignmentDetails = async (assignmentId, professorProfileId) => {
  try {
    const { data: row, error } = await supabase
      .from('course_assignments')
      .select('*')
      .eq('id', assignmentId)
      .eq('professor_profile_id', professorProfileId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!row) {
      throw new Error('Devoir introuvable');
    }

    const courseMap = await getCourseMap([row.course_id]);
    const rubricMap = row.rubric_id
      ? await (async () => {
          const { data: rubrics, error: rubricError } = await supabase
            .from('assignment_rubrics')
            .select('*')
            .eq('id', row.rubric_id);

          if (rubricError) {
            throw rubricError;
          }

          return new Map((rubrics || []).map((rubric) => [rubric.id, rubric]));
        })()
      : new Map();

    const [enrollmentsResult, submissionsResult] = await Promise.all([
      supabase
        .from('student_courses')
        .select('student_id, student_entity_id, status')
        .eq('course_id', row.course_id)
        .order('student_id', { ascending: true }),
      supabase
        .from('assignment_submissions')
        .select(`
          id,
          assignment_id,
          student_profile_id,
          student_id,
          submission_text,
          attachment_path,
          attachment_name,
          attachment_size,
          status,
          submitted_at,
          updated_at,
          grade,
          feedback,
          rubric_feedback,
          graded_at,
          graded_by
        `)
        .eq('assignment_id', assignmentId)
    ]);

    if (enrollmentsResult.error) {
      throw enrollmentsResult.error;
    }

    if (submissionsResult.error) {
      throw submissionsResult.error;
    }

    const enrollments = enrollmentsResult.data || [];
    const submissions = submissionsResult.data || [];
    const profileIds = enrollments.map((enrollment) => enrollment.student_id).filter(Boolean);

    const [profileMap, studentEntityMap] = await Promise.all([
      getProfileMap(profileIds),
      getStudentEntityMapByProfiles(profileIds)
    ]);

    const submissionMap = new Map(
      submissions.map((submission) => [submission.student_profile_id, submission])
    );

    const assignment = normalizeAssignmentRow({ row, courseMap, rubricMap });
    const students = enrollments.map((enrollment) => {
      const profile = profileMap.get(enrollment.student_id);
      const studentEntity = studentEntityMap.get(enrollment.student_id);
      const submission = submissionMap.get(enrollment.student_id) || null;

      return {
        profile_id: enrollment.student_id,
        student_id: studentEntity?.id || enrollment.student_entity_id || null,
        full_name: profile?.full_name || 'Etudiant inconnu',
        email: profile?.email || '',
        student_number: studentEntity?.student_number || '',
        level: studentEntity?.level || '',
        enrollment_status: enrollment.status || '',
        submission: submission
          ? {
              id: submission.id,
              submission_text: submission.submission_text || '',
              attachment_path: submission.attachment_path || null,
              attachment_name: submission.attachment_name || null,
              attachment_size: Number(submission.attachment_size || 0) || 0,
              status: submission.status || 'submitted',
              submitted_at: submission.submitted_at || submission.updated_at || null,
              grade: submission.grade === null || submission.grade === undefined ? null : Number(submission.grade),
              feedback: submission.feedback || '',
              graded_at: submission.graded_at || null,
              graded_by: submission.graded_by || null
            }
          : null
      };
    });

    return { data: { assignment, students }, error: null };
  } catch (error) {
    console.error('getProfessorAssignmentDetails:', error);
    return { data: null, error };
  }
};

export const gradeAssignmentSubmission = async ({
  submissionId,
  professorProfileId,
  grade,
  feedback
}) => {
  try {
    const { data: submission, error: submissionError } = await supabase
      .from('assignment_submissions')
      .select('id, assignment_id')
      .eq('id', submissionId)
      .maybeSingle();

    if (submissionError) {
      throw submissionError;
    }

    if (!submission) {
      throw new Error('Soumission introuvable');
    }

    const { data: assignment, error: assignmentError } = await supabase
      .from('course_assignments')
      .select('id, course_id, max_points')
      .eq('id', submission.assignment_id)
      .maybeSingle();

    if (assignmentError) {
      throw assignmentError;
    }

    if (!assignment) {
      throw new Error('Devoir introuvable');
    }

    await resolveProfessorCourseAccess(assignment.course_id, professorProfileId);

    const numericGrade = grade === '' || grade === null || grade === undefined
      ? null
      : Number(grade);

    if (numericGrade !== null && (Number.isNaN(numericGrade) || numericGrade < 0 || numericGrade > Number(assignment.max_points || 20))) {
      throw new Error(`La note doit etre comprise entre 0 et ${assignment.max_points}`);
    }

    const { data, error } = await supabase
      .from('assignment_submissions')
      .update({
        grade: numericGrade,
        feedback: String(feedback || '').trim() || null,
        graded_at: getNowIso(),
        graded_by: professorProfileId,
        status: numericGrade === null ? 'returned' : 'graded'
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('gradeAssignmentSubmission:', error);
    return { data: null, error };
  }
};

export const getStudentAssignments = async ({ studentProfileId, studentId }) => {
  try {
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('student_courses')
      .select('course_id')
      .eq('student_id', studentProfileId);

    if (enrollmentError) {
      throw enrollmentError;
    }

    const courseIds = [...new Set((enrollments || []).map((item) => item.course_id).filter(Boolean))];
    if (!courseIds.length) {
      return { data: [], error: null };
    }

    const now = getNowIso();
    const { data: assignments, error } = await supabase
      .from('course_assignments')
      .select('*')
      .in('course_id', courseIds)
      .in('status', ['published', 'closed', 'archived'])
      .lte('available_from', now)
      .order('due_at', { ascending: true, nullsFirst: false });

    if (error) {
      throw error;
    }

    const assignmentIds = (assignments || []).map((assignment) => assignment.id);
    const courseMap = await getCourseMap(courseIds);
    const rubricIds = [...new Set((assignments || []).map((assignment) => assignment.rubric_id).filter(Boolean))];

    const [rubricMap, submissions] = await Promise.all([
      (async () => {
        if (!rubricIds.length) return new Map();
        const { data: rubrics, error: rubricError } = await supabase
          .from('assignment_rubrics')
          .select('*')
          .in('id', rubricIds);

        if (rubricError) {
          throw rubricError;
        }

        return new Map((rubrics || []).map((rubric) => [rubric.id, rubric]));
      })(),
      assignmentIds.length
        ? (async () => {
            const { data: submissionRows, error: submissionError } = await supabase
              .from('assignment_submissions')
              .select('*')
              .eq('student_profile_id', studentProfileId)
              .in('assignment_id', assignmentIds);

            if (submissionError) {
              throw submissionError;
            }

            return submissionRows || [];
          })()
        : []
    ]);

    const submissionMap = new Map(submissions.map((submission) => [submission.assignment_id, submission]));

    const normalized = (assignments || []).map((row) =>
      normalizeAssignmentRow({
        row,
        courseMap,
        rubricMap,
        submission: submissionMap.get(row.id) || null
      })
    );

    return { data: normalized, error: null };
  } catch (error) {
    console.error('getStudentAssignments:', error);
    return { data: [], error };
  }
};

export const submitAssignment = async ({
  assignmentId,
  studentProfileId,
  studentId,
  submissionText,
  file
}) => {
  try {
    const { data: assignment, error: assignmentError } = await supabase
      .from('course_assignments')
      .select('*')
      .eq('id', assignmentId)
      .maybeSingle();

    if (assignmentError) {
      throw assignmentError;
    }

    if (!assignment) {
      throw new Error('Devoir introuvable');
    }

    await resolveStudentCourseAccess(assignment.course_id, studentProfileId);

    const nowIso = getNowIso();
    if (!canStillSubmit(assignment, nowIso)) {
      throw new Error('La fenetre de remise est fermee pour ce devoir');
    }

    if (assignment.submission_mode === 'text' && !String(submissionText || '').trim()) {
      throw new Error('Une reponse texte est requise pour ce devoir');
    }

    if (assignment.submission_mode === 'file' && !file) {
      const { data: existingSubmission } = await supabase
        .from('assignment_submissions')
        .select('id')
        .eq('assignment_id', assignmentId)
        .eq('student_profile_id', studentProfileId)
        .maybeSingle();

      if (!existingSubmission) {
        throw new Error('Une piece jointe est requise pour ce devoir');
      }
    }

    if (assignment.submission_mode === 'text_file' && !String(submissionText || '').trim() && !file) {
      const { data: existingSubmission } = await supabase
        .from('assignment_submissions')
        .select('id, attachment_path, submission_text')
        .eq('assignment_id', assignmentId)
        .eq('student_profile_id', studentProfileId)
        .maybeSingle();

      if (!existingSubmission?.attachment_path && !String(existingSubmission?.submission_text || '').trim()) {
        throw new Error('Ajoutez un texte, un fichier, ou les deux');
      }
    }

    const { data: existingSubmission, error: existingError } = await supabase
      .from('assignment_submissions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('student_profile_id', studentProfileId)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    let attachmentPath = existingSubmission?.attachment_path || null;
    let attachmentName = existingSubmission?.attachment_name || null;
    let attachmentSize = existingSubmission?.attachment_size || null;
    let previousAttachmentToRemove = null;

    if (file) {
      const safeFileName = sanitizeFileName(file.name);
      const filePath = `${studentProfileId}/${assignmentId}/${Date.now()}-${safeFileName}`;

      const { error: uploadError } = await uploadFile(ASSIGNMENT_BUCKET, filePath, file, {
        upsert: false,
        contentType: file.type || 'application/octet-stream'
      });

      if (uploadError) {
        throw uploadError;
      }

      previousAttachmentToRemove = existingSubmission?.attachment_path || null;
      attachmentPath = filePath;
      attachmentName = file.name;
      attachmentSize = file.size || 0;
    }

    const late = isSubmissionLate(assignment, nowIso);

    const payload = {
      assignment_id: assignmentId,
      student_profile_id: studentProfileId,
      student_id: Number(studentId || 0) || null,
      submission_text: String(submissionText || '').trim() || null,
      attachment_path: attachmentPath,
      attachment_name: attachmentName,
      attachment_size: attachmentSize,
      status: late ? 'late' : 'submitted',
      submitted_at: nowIso,
      grade: null,
      feedback: null,
      graded_at: null,
      graded_by: null
    };

    const { data, error } = await supabase
      .from('assignment_submissions')
      .upsert(payload, {
        onConflict: 'assignment_id,student_profile_id'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (previousAttachmentToRemove && previousAttachmentToRemove !== attachmentPath) {
      await removeFiles(ASSIGNMENT_BUCKET, [previousAttachmentToRemove]);
    }

    return { data, error: null };
  } catch (error) {
    console.error('submitAssignment:', error);
    return { data: null, error };
  }
};

export const getAssignmentAttachmentUrl = async (filePath, expiresIn = 1800) => {
  try {
    if (!filePath) {
      throw new Error('Fichier introuvable');
    }

    const { signedUrl, error } = await createSignedUrl(ASSIGNMENT_BUCKET, filePath, expiresIn);
    if (error) {
      throw error;
    }

    return { signedUrl, error: null };
  } catch (error) {
    console.error('getAssignmentAttachmentUrl:', error);
    return { signedUrl: null, error };
  }
};
