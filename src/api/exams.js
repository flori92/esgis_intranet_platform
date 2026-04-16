/**
 * Service de gestion des examens
 * Centralise toutes les opérations liées aux examens
 */
import { supabase } from '../supabase';
import { normalizeExamQuestion } from '../utils/examQuestionUtils';

/**
 * Types pour les examens - remplacés par des commentaires JSDoc
 * @typedef {Object} Exam Examen tel que stocké dans la base de données
 * @typedef {Object} ExamInsert Structure pour l'insertion d'un nouvel examen
 * @typedef {Object} ExamUpdate Structure pour la mise à jour d'un examen existant
 * 
 * Types pour les résultats d'examen
 * @typedef {Object} ExamResult Résultat d'examen tel que stocké dans la base de données
 * @typedef {Object} ExamResultInsert Structure pour l'insertion d'un nouveau résultat d'examen
 */

/**
 * Récupère tous les examens avec pagination et filtres
 * @param {Object} options Options de filtrage et pagination
 * @param {number} [options.page=1] Numéro de page
 * @param {number} [options.pageSize=10] Nombre d'éléments par page
 * @param {number} [options.departmentId] Filtre par ID de département
 * @param {string} [options.professorId] Filtre par ID de professeur
 * @param {string} [options.status] Statut de l'examen (draft, published, completed, archived)
 * @param {string} [options.search] Recherche textuelle sur le titre
 * @returns {Promise<Object>} Résultat contenant les examens, le nombre total et une erreur éventuelle
 */
export const getExams = async (options = {}) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      departmentId,
      professorId,
      status,
      search
    } = options;

    // Construction de la requête avec les filtres
    let query = supabase
      .from('exams')
      .select('*, courses(id, name, code), profiles!professor_id(full_name, avatar_url)', { count: 'exact' });

    // Application des filtres
    if (departmentId) {
      query = query.eq('department_id', departmentId);
    }

    if (professorId) {
      query = query.eq('professor_id', professorId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Exécution de la requête avec pagination
    const { data, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des examens:', error);
      return { exams: [], count: 0, error };
    }

    return {
      exams: data,
      count: count || 0,
      error: null
    };
  } catch (err) {
    console.error('Exception lors de la récupération des examens:', err);
    return { exams: [], count: 0, error: err };
  }
};

/**
 * Récupère un examen par son ID
 * @param {number} examId ID de l'examen à récupérer
 * @returns {Promise<Object>} Résultat contenant l'examen enrichi et une erreur éventuelle
 */
export const getExamById = async (examId) => {
  try {
    const { data, error } = await supabase
      .from('exams')
      .select(`
        *,
        courses(id, name, code),
        profiles!professor_id(full_name),
        departments!department_id(name),
        parent_exam:exams!parent_exam_id(id, title),
        filieres!filiere_id(name),
        student_groups!student_group_id(academic_year, group_letter)
      `)
      .eq('id', examId)
      .single();

    if (error) {
      console.error(`Erreur lors de la récupération de l'examen ${examId}:`, error);
      return { exam: null, error };
    }

    const examData = data;

    return {
      exam: {
        ...examData,
        course_name: examData.courses?.name,
        course_code: examData.courses?.code,
        professor_name: examData.profiles?.full_name,
        department_name: examData.departments?.name,
        parent_exam_title: examData.parent_exam?.title
      },
      error: null
    };
  } catch (err) {
    console.error(`Exception lors de la récupération de l'examen ${examId}:`, err);
    return { exam: null, error: err };
  }
};

/**
 * Rejoint un examen via son jeton de partage
 * @param {string} token Jeton UUID de l'examen
 * @param {string} profileId ID de profil de l'étudiant
 * @returns {Promise<Object>} Résultat de l'opération
 */
export const joinExamByToken = async (token, profileId) => {
  try {
    const { data, error } = await supabase.rpc('join_exam_by_token', {
      p_share_token: token,
      p_profile_id: profileId
    });

    if (error) {
      console.error('Erreur joinExamByToken:', error);
      return { success: false, error };
    }

    return data; // Retourne l'objet JSONB construit par la fonction PL/pgSQL
  } catch (err) {
    console.error('Exception joinExamByToken:', err);
    return { success: false, error: err };
  }
};

/**
 * Crée un nouvel examen
 * @param {Object} examData Données de l'examen à créer
 * @returns {Promise<Object>} Résultat contenant l'examen créé et une erreur éventuelle
 */
export const createExam = async (examData) => {
  try {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('exams')
      .insert({
        ...examData,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création de l\'examen:', error);
      return { exam: null, error };
    }

    return { exam: data, error: null };
  } catch (err) {
    console.error('Exception lors de la création de l\'examen:', err);
    return { exam: null, error: err };
  }
};

/**
 * Met à jour un examen existant
 * @param {number} examId ID de l'examen à mettre à jour
 * @param {Object} updates Modifications à appliquer
 * @returns {Promise<Object>} Résultat contenant l'examen mis à jour et une erreur éventuelle
 */
export const updateExam = async (examId, updates) => {
  try {
    const { data, error } = await supabase
      .from('exams')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', examId)
      .select()
      .single();

    if (error) {
      console.error(`Erreur lors de la mise à jour de l'examen ${examId}:`, error);
      return { exam: null, error };
    }

    return { exam: data, error: null };
  } catch (err) {
    console.error(`Exception lors de la mise à jour de l'examen ${examId}:`, err);
    return { exam: null, error: err };
  }
};

/**
 * Change le statut d'un examen
 * @param {number} examId ID de l'examen
 * @param {string} status Nouveau statut (draft, published, completed, archived)
 * @returns {Promise<Object>} Résultat indiquant le succès de l'opération et une erreur éventuelle
 */
export const updateExamStatus = async (examId, status) => {
  try {
    const { error } = await supabase
      .from('exams')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', examId);

    if (error) {
      console.error(`Erreur lors de la mise à jour du statut de l'examen ${examId}:`, error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error(`Exception lors de la mise à jour du statut de l'examen ${examId}:`, err);
    return { success: false, error: err };
  }
};

/**
 * Supprime un examen
 * Note: Cela ne fonctionnera que si aucun résultat n'est associé à cet examen
 * @param {number} examId ID de l'examen à supprimer
 * @returns {Promise<Object>} Résultat indiquant le succès de l'opération et une erreur éventuelle
 */
export const deleteExam = async (examId) => {
  try {
    // 1. Vérifier si des résultats sont associés à cet examen
    const { count, error: countError } = await supabase
      .from('exam_results')
      .select('*', { count: 'exact', head: true })
      .eq('exam_id', examId);

    if (countError) {
      console.error(`Erreur lors de la vérification des résultats de l'examen ${examId}:`, countError);
      return { success: false, error: countError };
    }

    if (count && count > 0) {
      const err = new Error(`Impossible de supprimer cet examen: ${count} résultats y sont associés`);
      console.error(err.message);
      return { success: false, error: err };
    }

    // 2. Supprimer l'examen
    const { error } = await supabase
      .from('exams')
      .delete()
      .eq('id', examId);

    if (error) {
      console.error(`Erreur lors de la suppression de l'examen ${examId}:`, error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error(`Exception lors de la suppression de l'examen ${examId}:`, err);
    return { success: false, error: err };
  }
};

/**
 * Enregistre un résultat d'examen
 * @param {Object} resultData Données du résultat à enregistrer
 * @returns {Promise<Object>} Résultat contenant le résultat enregistré et une erreur éventuelle
 */
export const saveExamResult = async (resultData) => {
  try {
    const { data, error } = await supabase
      .from('exam_results')
      .insert({
        ...resultData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de l\'enregistrement du résultat d\'examen:', error);
      return { result: null, error };
    }

    return { result: data, error: null };
  } catch (err) {
    console.error('Exception lors de l\'enregistrement du résultat d\'examen:', err);
    return { result: null, error: err };
  }
};

/**
 * Récupère les résultats d'un examen
 * @param {number} examId ID de l'examen
 * @returns {Promise<Object>} Résultat contenant les résultats et une erreur éventuelle
 */
export const getExamResults = async (examId) => {
  try {
    const { data, error } = await supabase
      .from('exam_results')
      .select(`
        *,
        profiles!student_id(full_name, email, avatar_url)
      `)
      .eq('exam_id', examId)
      .order('score', { ascending: false });

    if (error) {
      console.error(`Erreur lors de la récupération des résultats de l'examen ${examId}:`, error);
      return { results: [], error };
    }

    return { results: data, error: null };
  } catch (err) {
    console.error(`Exception lors de la récupération des résultats de l'examen ${examId}:`, err);
    return { results: [], error: err };
  }
};

/**
 * Récupère les résultats d'examens d'un étudiant
 * @param {string} studentId ID de l'étudiant
 * @returns {Promise<Object>} Résultat contenant les résultats enrichis et une erreur éventuelle
 */
export const getStudentExamResults = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('exam_results')
      .select(`
        *,
        exams!exam_id(title, total_points)
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Erreur lors de la récupération des résultats de l'étudiant ${studentId}:`, error);
      return { results: [], error };
    }

    const results = data;

    return {
      results: results.map(result => ({
        ...result,
        exam_title: result.exams?.title,
      })),
      error: null
    };
  } catch (err) {
    console.error(`Exception lors de la récupération des résultats de l'étudiant ${studentId}:`, err);
    return { results: [], error: err };
  }
};

const getRelation = (value) => (Array.isArray(value) ? value[0] : value);

const normalizeExamRecord = (record) => {
  if (!record) {
    return null;
  }

  const course = getRelation(record.courses);
  // exams.professor_id → profiles(id) directement
  const professorProfile = getRelation(record.profiles);
  const session = getRelation(record.exam_sessions);
  const center = getRelation(record.exam_centers);
  const parentExam = getRelation(record.parent_exam);

  return {
    ...record,
    // Alias rétro-compat : le reste du code lit .date et .type
    date: record.exam_date || record.date || null,
    type: record.exam_type || record.type || null,
    access_code_required: Boolean(record.access_code_required),
    allow_direct_join: Boolean(record.allow_direct_join),
    max_cheating_alerts: Number(record.max_cheating_alerts || 3),
    course,
    course_name: course?.name || null,
    course_code: course?.code || null,
    professor_name: professorProfile?.full_name || null,
    professor_email: professorProfile?.email || null,
    session_name: session?.name || null,
    session_semester: session?.semester || null,
    center_name: center?.name || null,
    center_location: center?.location || null,
    parent_exam_title: parentExam?.title || null
  };
};

const normalizeStudentRecord = (record) => {
  if (!record) {
    return null;
  }

  const profile = getRelation(record.profiles);
  const department = getRelation(profile?.departments);

  return {
    id: record.id,
    profile_id: record.profile_id || null,
    name: profile?.full_name || 'Etudiant inconnu',
    email: profile?.email || '',
    profile_image: profile?.avatar_url || null,
    full_name: profile?.full_name || 'Etudiant inconnu',
    department_id: profile?.department_id ?? null,
    department_name: department?.name || 'N/A',
    student_number: record.student_number || '',
    level: record.level || '',
    academic_year: record.entry_year ? `${record.entry_year}-${Number(record.entry_year) + 1}` : '',
    status: record.status || null
  };
};

const resolveStudentId = async (profileId) => {
  if (!profileId) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('students')
      .select('id')
      .eq('profile_id', profileId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data?.id || profileId;
  } catch (error) {
    console.error('Erreur resolveStudentId:', error);
    return profileId;
  }
};

const isStudentIdTypeMismatchError = (error) => {
  const message = error?.message || '';

  return error?.code === '22P02' || /invalid input syntax for type (uuid|integer)/i.test(message);
};

const getStudentExamLookupCandidates = async (profileId) => {
  const studentId = await resolveStudentId(profileId);

  return [...new Set([profileId, studentId].filter(Boolean).map((value) => String(value)))];
};

const queryStudentExamsByCandidates = async ({ candidates, buildQuery, expectSingle = false }) => {
  const rows = [];
  const seenIds = new Set();
  let lastTypeMismatchError = null;

  for (const candidate of candidates) {
    const { data, error } = await buildQuery(candidate);

    if (error) {
      if (isStudentIdTypeMismatchError(error)) {
        lastTypeMismatchError = error;
        continue;
      }

      return { data: expectSingle ? null : [], error };
    }

    if (expectSingle) {
      if (data) {
        return { data, error: null };
      }

      continue;
    }

    for (const row of data || []) {
      if (seenIds.has(row.id)) {
        continue;
      }

      seenIds.add(row.id);
      rows.push(row);
    }
  }

  if (expectSingle) {
    return { data: null, error: null, fallbackError: lastTypeMismatchError };
  }

  return { data: rows, error: null, fallbackError: lastTypeMismatchError };
};

const isQuizResultsOnConflictSchemaError = (error) => {
  const message = `${error?.message || ''} ${error?.details || ''}`;

  return error?.code === '42P10' || /no unique|no unique or exclusion constraint|on conflict/i.test(message);
};

const persistQuizResult = async (payload) => {
  const { error: upsertError } = await supabase
    .from('quiz_results')
    .upsert(payload, {
      onConflict: 'student_id,exam_id'
    });

  if (!upsertError) {
    return { error: null };
  }

  if (!isQuizResultsOnConflictSchemaError(upsertError)) {
    return { error: upsertError };
  }

  const { data: existingResult, error: existingError } = await supabase
    .from('quiz_results')
    .select('id')
    .eq('student_id', payload.student_id)
    .eq('exam_id', payload.exam_id)
    .order('updated_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    return { error: existingError };
  }

  if (existingResult?.id) {
    const { error: updateError } = await supabase
      .from('quiz_results')
      .update(payload)
      .eq('id', existingResult.id);

    return { error: updateError || null };
  }

  const { error: insertError } = await supabase
    .from('quiz_results')
    .insert(payload);

  return { error: insertError || null };
};

export const getStudentExamLaunchData = async ({ examId, profileId }) => {
  try {
    const numericExamId = Number(examId);
    const [studentCandidates, { data: examData, error: examError }] = await Promise.all([
      getStudentExamLookupCandidates(profileId),
      supabase
        .from('exams')
        .select(`
          id,
          title,
          description,
          course_id,
          professor_id,
          exam_session_id,
          exam_center_id,
          exam_date,
          duration,
          exam_type,
          category,
          share_token,
          access_code_required,
          allow_direct_join,
          max_cheating_alerts,
          room,
          total_points,
          passing_grade,
          status,
          parent_exam:exams!parent_exam_id(id, title),
          courses(id, name, code),
          profiles!professor_id(id, full_name, email),
          exam_sessions!exam_session_id(id, name, academic_year, semester, status),
          exam_centers!exam_center_id(id, name, location, status)
        `)
        .eq('id', numericExamId)
        .single()
    ]);

    const { data: studentExam, error: studentExamError } = await queryStudentExamsByCandidates({
      candidates: studentCandidates,
      expectSingle: true,
      buildQuery: (candidate) => supabase
        .from('student_exams')
        .select(`
          id,
          exam_id,
          student_id,
          seat_number,
          attendance,
          attempt_status,
          status,
          grade,
          comments,
          answers,
          arrival_time,
          departure_time,
          access_verified_at,
          access_verification_failures,
          access_locked_until,
          start_count,
          submission_reason,
          created_at,
          updated_at
        `)
        .eq('exam_id', numericExamId)
        .eq('student_id', candidate)
        .maybeSingle()
    });

    if (examError) {
      return { exam: null, studentExam: null, error: examError };
    }

    if (studentExamError) {
      return { exam: null, studentExam: null, error: studentExamError };
    }

    if (!studentExam) {
      return {
        exam: normalizeExamRecord(examData),
        studentExam: null,
        error: new Error("Vous n'êtes pas inscrit à cet examen")
      };
    }

    return {
      exam: normalizeExamRecord(examData),
      studentExam,
      error: null
    };
  } catch (error) {
    console.error('Erreur getStudentExamLaunchData:', error);
    return { exam: null, studentExam: null, error };
  }
};

export const getStudentExamsListData = async (profileId) => {
  try {
    const studentCandidates = await getStudentExamLookupCandidates(profileId);
    const { data, error } = await queryStudentExamsByCandidates({
      candidates: studentCandidates,
      buildQuery: (candidate) => supabase
        .from('student_exams')
        .select(`
          id,
          exam_id,
          student_id,
          seat_number,
          attendance,
          attempt_status,
          status,
          grade,
          comments,
          created_at,
          updated_at,
          exams(
            id,
            title,
            description,
            course_id,
            professor_id,
            exam_session_id,
            exam_center_id,
            exam_date,
            duration,
            exam_type,
            category,
            share_token,
            access_code_required,
            allow_direct_join,
            max_cheating_alerts,
            room,
            total_points,
            passing_grade,
            status,
            parent_exam:exams!parent_exam_id(id, title),
            courses(id, name, code),
            profiles!professor_id(id, full_name, email),
            exam_sessions!exam_session_id(id, name, academic_year, semester, status),
            exam_centers!exam_center_id(id, name, location, status)
          )
        `)
        .eq('student_id', candidate)
        .order('created_at', { ascending: false })
    });

    if (error) {
      throw error;
    }

    const exams = (data || [])
      .map((row) => {
        const exam = normalizeExamRecord(getRelation(row.exams));

        if (!exam) {
          return null;
        }

        return {
          id: row.id,
          exam_id: row.exam_id,
          student_id: row.student_id,
          seat_number: row.seat_number,
          attendance_status: row.attendance || null,
          attempt_status: row.attempt_status || 'not_started',
          result_status: row.status || 'pending',
          grade: row.grade ?? null,
          comments: row.comments || null,
          created_at: row.created_at,
          updated_at: row.updated_at,
          ...exam
        };
      })
      .filter(Boolean)
      .sort((left, right) => new Date(left.date || 0).getTime() - new Date(right.date || 0).getTime());

    return { data: exams, error: null };
  } catch (error) {
    console.error('Erreur getStudentExamsListData:', error);
    return { data: null, error };
  }
};

export const markStudentExamStarted = async ({ studentExamId, examId, profileId }) => {
  try {
    const resolvedProfileId = profileId || (await supabase.auth.getUser()).data.user?.id || null;
    const { data, error } = await supabase.rpc('start_exam_attempt', {
      p_exam_id: Number(examId),
      p_student_exam_id: Number(studentExamId),
      p_profile_id: resolvedProfileId
    });

    if (error) {
      return { success: false, error };
    }

    if (!data?.success) {
      return { success: false, error: new Error(data?.message || "Impossible de démarrer l'examen.") };
    }

    return { success: true, error: null, data };
  } catch (error) {
    console.error('Erreur markStudentExamStarted:', error);
    return { success: false, error };
  }
};

export const verifyExamAccessCode = async ({ studentExamId, examId, profileId, code }) => {
  try {
    const { data, error } = await supabase.rpc('verify_exam_access_code', {
      p_exam_id: Number(examId),
      p_student_exam_id: Number(studentExamId),
      p_profile_id: profileId,
      p_code: code
    });

    if (error) {
      return { success: false, error };
    }

    if (!data?.success) {
      return { success: false, error: new Error(data?.message || "Code d'accès invalide."), data };
    }

    return { success: true, error: null, data };
  } catch (error) {
    console.error('Erreur verifyExamAccessCode:', error);
    return { success: false, error };
  }
};

/**
 * Synchronise les réponses de l'étudiant en cours d'examen
 * @param {Object} params
 * @param {number} params.studentExamId
 * @param {Object} params.answers
 * @returns {Promise<{ success: boolean, error: Error|null }>}
 */
export const syncExamAnswers = async ({ studentExamId, answers }) => {
  try {
    const { error } = await supabase
      .from('student_exams')
      .update({
        answers,
        updated_at: new Date().toISOString()
      })
      .eq('id', studentExamId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('syncExamAnswers:', error);
    return { success: false, error };
  }
};

export const finalizeStudentExamSubmission = async ({
  studentExamId,
  examId,
  profileId,
  answers,
  score,
  totalQuestions,
  completionTime,
  cheatingAttempts,
  hasManualQuestions,
  passingGrade,
  submissionReason = 'manual'
}) => {
  try {
    const now = new Date().toISOString();
    const numericExamId = Number(examId);
    const normalizedScore = Number(score || 0);
    const studentStatus = hasManualQuestions
      ? 'pending'
      : normalizedScore >= Number(passingGrade || 0)
        ? 'passed'
        : 'failed';

    const quizResultPayload = {
      student_id: profileId,
      exam_id: numericExamId,
      score: normalizedScore,
      total_questions: Number(totalQuestions || 0),
      completion_time: Number(completionTime || 0),
      answers: answers || {},
      cheating_attempts: Number(cheatingAttempts || 0),
      completed_at: now,
      updated_at: now
    };
    const { error: quizResultError } = await persistQuizResult(quizResultPayload);

    if (quizResultError) {
      return { success: false, error: quizResultError };
    }

    const { error: studentExamError } = await supabase
      .from('student_exams')
      .update({
        attempt_status: 'submitted',
        status: studentStatus,
        answers: answers || {},
        departure_time: now,
        grade: hasManualQuestions ? null : normalizedScore,
        submission_reason: submissionReason,
        updated_at: now
      })
      .eq('id', studentExamId);

    if (studentExamError) {
      return { success: false, error: studentExamError };
    }

    const { error: activeStudentError } = await supabase
      .from('active_students')
      .update({
        is_completed: true,
        last_ping: now,
        updated_at: now
      })
      .eq('student_id', profileId)
      .eq('exam_id', numericExamId);

    if (activeStudentError) {
      console.error('Erreur clôture active_students:', activeStudentError);
    }

    const { count: remainingActiveCount, error: activeCountError } = await supabase
      .from('active_students')
      .select('*', { count: 'exact', head: true })
      .eq('exam_id', numericExamId)
      .eq('is_completed', false);

    if (!activeCountError && (remainingActiveCount || 0) === 0) {
      const { error: examError } = await supabase
        .from('exams')
        .update({
          status: 'grading',
          updated_at: now
        })
        .eq('id', numericExamId)
        .in('status', ['published', 'in_progress', 'grading']);

      if (examError) {
        console.error('Erreur passage examen en notation:', examError);
      }
    }

    return { success: true, error: null, status: studentStatus };
  } catch (error) {
    console.error('Erreur finalizeStudentExamSubmission:', error);
    return { success: false, error };
  }
};

const MONITORING_ACTIVE_THRESHOLD_MS = 90 * 1000;

const parseSerializedAnswers = (value) => {
  if (!value) {
    return {};
  }

  if (typeof value === 'object') {
    return value;
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (_error) {
      return {};
    }
  }

  return {};
};

const hasMeaningfulAnswer = (value) => {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return true;
  }

  if (Array.isArray(value)) {
    return value.some((item) => hasMeaningfulAnswer(item));
  }

  if (typeof value === 'object') {
    return Object.values(value).some((item) => hasMeaningfulAnswer(item));
  }

  return false;
};

const countAnsweredQuestions = (answers) => {
  const normalizedAnswers = parseSerializedAnswers(answers);

  return Object.values(normalizedAnswers).reduce(
    (count, answer) => count + (hasMeaningfulAnswer(answer) ? 1 : 0),
    0
  );
};

const getMonitoringRiskMeta = ({ incidentCount = 0, isStale = false, attemptStatus = 'not_started' }) => {
  let riskScore = Number(incidentCount || 0) * 35;

  if (isStale && attemptStatus === 'in_progress') {
    riskScore += 20;
  }

  if (attemptStatus === 'submitted') {
    riskScore = Math.max(riskScore - 10, 0);
  }

  riskScore = Math.min(riskScore, 100);

  if (incidentCount >= 3 || riskScore >= 70) {
    return { riskScore, riskLevel: 'critical' };
  }

  if (incidentCount >= 2 || riskScore >= 40) {
    return { riskScore, riskLevel: 'high' };
  }

  if (incidentCount >= 1 || isStale || riskScore >= 15) {
    return { riskScore, riskLevel: 'medium' };
  }

  return { riskScore, riskLevel: 'low' };
};

const getIncidentDateValue = (incident) => incident?.timestamp || incident?.detected_at || null;

export const getProfessorExamMonitoringData = async (examId) => {
  try {
    const numericExamId = Number(examId);

    const [
      { data: examData, error: examError },
      { data: studentExams, error: studentExamsError },
      { data: activeStudents, error: activeStudentsError },
      { data: cheatingAttempts, error: cheatingAttemptsError },
      { count: questionCount, error: questionCountError }
    ] = await Promise.all([
      supabase
        .from('exams')
        .select(`
          id,
          title,
          description,
          course_id,
          professor_id,
          exam_session_id,
          exam_center_id,
          exam_date,
          duration,
          exam_type,
          category,
          share_token,
          room,
          total_points,
          passing_grade,
          status,
          parent_exam:exams!parent_exam_id(id, title),
          courses(id, name, code),
          profiles!professor_id(id, full_name, email),
          exam_sessions!exam_session_id(id, name, academic_year, semester, status),
          exam_centers!exam_center_id(id, name, location, status)
        `)
        .eq('id', numericExamId)
        .single(),
      supabase
        .from('student_exams')
        .select(`
          id,
          exam_id,
          student_id,
          seat_number,
          attendance,
          attempt_status,
          status,
          grade,
          comments,
          arrival_time,
          departure_time,
          answers,
          created_at,
          updated_at,
          students(
            id,
            profile_id,
            student_number,
            level,
            profiles(full_name, email, avatar_url)
          )
        `)
        .eq('exam_id', numericExamId)
        .order('created_at', { ascending: true }),
      supabase
        .from('active_students')
        .select(`
          id,
          student_id,
          exam_id,
          start_time,
          last_ping,
          is_completed,
          cheating_attempts,
          student:profiles!student_id(full_name, email, avatar_url)
        `)
        .eq('exam_id', numericExamId),
      supabase
        .from('cheating_attempts')
        .select(`
          id,
          student_id,
          exam_id,
          student_exam_id,
          details,
          attempt_count,
          detected_at,
          created_at,
          student:profiles!student_id(full_name, email)
        `)
        .eq('exam_id', numericExamId)
        .order('detected_at', { ascending: false })
        .limit(50),
      supabase
        .from('exam_questions')
        .select('*', { count: 'exact', head: true })
        .eq('exam_id', numericExamId)
    ]);

    if (examError) {
      return { exam: null, participants: [], activeStudents: [], incidents: [], summary: null, error: examError };
    }

    if (studentExamsError) {
      return { exam: null, participants: [], activeStudents: [], incidents: [], summary: null, error: studentExamsError };
    }

    if (activeStudentsError) {
      return { exam: null, participants: [], activeStudents: [], incidents: [], summary: null, error: activeStudentsError };
    }

    if (cheatingAttemptsError) {
      return { exam: null, participants: [], activeStudents: [], incidents: [], summary: null, error: cheatingAttemptsError };
    }

    if (questionCountError) {
      console.error('Erreur comptage des questions pour le monitoring:', questionCountError);
    }

    const incidentsByStudentExamId = new Map();
    const incidentsByProfileId = new Map();
    const latestIncidentByStudentExamId = new Map();
    const latestIncidentByProfileId = new Map();

    const normalizedIncidents = (cheatingAttempts || []).map((incident) => {
      const profile = getRelation(incident.student);
      const occurredAt = getIncidentDateValue(incident);

      if (incident.student_exam_id) {
        incidentsByStudentExamId.set(
          incident.student_exam_id,
          (incidentsByStudentExamId.get(incident.student_exam_id) || 0) + 1
        );

        const currentLatest = latestIncidentByStudentExamId.get(incident.student_exam_id);
        if (!currentLatest || new Date(occurredAt || 0).getTime() >= new Date(currentLatest.occurred_at || 0).getTime()) {
          latestIncidentByStudentExamId.set(incident.student_exam_id, {
            occurred_at: occurredAt,
            details: incident.details || null
          });
        }
      }

      if (incident.student_id) {
        incidentsByProfileId.set(
          incident.student_id,
          (incidentsByProfileId.get(incident.student_id) || 0) + 1
        );

        const currentLatest = latestIncidentByProfileId.get(incident.student_id);
        if (!currentLatest || new Date(occurredAt || 0).getTime() >= new Date(currentLatest.occurred_at || 0).getTime()) {
          latestIncidentByProfileId.set(incident.student_id, {
            occurred_at: occurredAt,
            details: incident.details || null
          });
        }
      }

      return {
        ...incident,
        student_name: profile?.full_name || 'Etudiant',
        student_email: profile?.email || '',
        occurred_at: occurredAt
      };
    });

    const normalizedActiveStudents = (activeStudents || []).map((row) => {
      const profile = getRelation(row.student);
      const lastPingAgeMs = row.last_ping ? Date.now() - new Date(row.last_ping).getTime() : Number.POSITIVE_INFINITY;
      const isOnline = Boolean(!row.is_completed && lastPingAgeMs <= MONITORING_ACTIVE_THRESHOLD_MS);

      return {
        ...row,
        student_name: profile?.full_name || 'Etudiant',
        student_email: profile?.email || '',
        student_avatar: profile?.avatar_url || null,
        is_online: isOnline,
        is_stale: Boolean(!row.is_completed && !isOnline)
      };
    });

    const activeByProfileId = new Map(
      normalizedActiveStudents.map((row) => [row.student_id, row])
    );

    const totalQuestionCount = Number(questionCount || 0);
    const participants = (studentExams || []).map((row) => {
      const student = getRelation(row.students);
      const profile = getRelation(student?.profiles);
      const activeEntry = activeByProfileId.get(student?.profile_id);
      const incidentCount = incidentsByStudentExamId.get(row.id) || incidentsByProfileId.get(student?.profile_id) || 0;
      const latestIncident =
        latestIncidentByStudentExamId.get(row.id) ||
        latestIncidentByProfileId.get(student?.profile_id) ||
        null;
      const answeredCount = countAnsweredQuestions(row.answers);
      const normalizedAnsweredCount = row.attempt_status === 'submitted'
        ? totalQuestionCount || answeredCount
        : answeredCount;
      const progressPercentage = totalQuestionCount > 0
        ? Math.min(100, Math.round((normalizedAnsweredCount / totalQuestionCount) * 100))
        : row.attempt_status === 'submitted'
          ? 100
          : 0;
      const { riskScore, riskLevel } = getMonitoringRiskMeta({
        incidentCount,
        isStale: activeEntry?.is_stale,
        attemptStatus: row.attempt_status
      });

      return {
        ...row,
        student_name: profile?.full_name || 'Etudiant inconnu',
        student_email: profile?.email || '',
        student_avatar: profile?.avatar_url || null,
        student_profile_id: student?.profile_id || null,
        student_number: student?.student_number || '',
        level: student?.level || '',
        is_active: Boolean(activeEntry && !activeEntry.is_completed),
        is_online: Boolean(activeEntry?.is_online),
        is_stale: Boolean(activeEntry?.is_stale),
        active_last_ping: activeEntry?.last_ping || null,
        active_start_time: activeEntry?.start_time || null,
        detected_incidents: incidentCount,
        answered_count: normalizedAnsweredCount,
        question_count: totalQuestionCount,
        progress_percentage: progressPercentage,
        latest_incident_at: latestIncident?.occurred_at || null,
        latest_incident_details: latestIncident?.details || null,
        submitted_at: row.departure_time || null,
        risk_score: riskScore,
        risk_level: riskLevel
      };
    });

    const normalizedExam = {
      ...normalizeExamRecord(examData),
      question_count: totalQuestionCount
    };
    const gradedParticipants = participants.filter((participant) => participant.grade !== null && participant.grade !== undefined);
    const summary = {
      assignedCount: participants.length,
      activeCount: participants.filter((participant) => participant.is_online).length,
      composingCount: participants.filter((participant) => participant.attempt_status === 'in_progress').length,
      submittedCount: participants.filter((participant) => participant.attempt_status === 'submitted').length,
      notStartedCount: participants.filter((participant) => (participant.attempt_status || 'not_started') === 'not_started').length,
      gradedCount: participants.filter((participant) => participant.grade !== null && participant.grade !== undefined).length,
      staleCount: participants.filter((participant) => participant.is_stale).length,
      absentCount: participants.filter((participant) => participant.attendance === 'absent' || participant.status === 'absent').length,
      suspiciousCount: participants.filter((participant) => ['high', 'critical'].includes(participant.risk_level)).length,
      incidentsCount: normalizedIncidents.length,
      averageGrade: gradedParticipants.length
        ? Number((gradedParticipants.reduce((total, participant) => total + Number(participant.grade || 0), 0) / gradedParticipants.length).toFixed(2))
        : null,
      questionCount: totalQuestionCount
    };

    return {
      exam: normalizedExam,
      participants,
      activeStudents: normalizedActiveStudents,
      incidents: normalizedIncidents,
      summary,
      error: null
    };
  } catch (error) {
    console.error('Erreur getProfessorExamMonitoringData:', error);
    return { exam: null, participants: [], activeStudents: [], incidents: [], summary: null, error };
  }
};

export const getExamGradingData = async (examId) => {
  try {
    const [
      { data: examData, error: examError },
      { data: questionRows, error: questionsError },
      { data: studentExamRows, error: studentExamsError }
    ] = await Promise.all([
      getExamWithDetails(examId),
      getExamQuestions(examId),
      getStudentExamsByExamId(examId)
    ]);

    if (examError) {
      throw examError;
    }

    if (questionsError) {
      throw questionsError;
    }

    if (studentExamsError) {
      throw studentExamsError;
    }

    const studentIds = [...new Set((studentExamRows || []).map((item) => item.student_id).filter(Boolean))];
    const { data: studentRows, error: studentsError } = await getStudentsByIds(studentIds);

    if (studentsError) {
      throw studentsError;
    }

    return {
      exam: examData ? {
        id: examData.id,
        title: examData.title,
        course_id: examData.course_id,
        course_name: getRelation(examData.courses)?.name || 'Cours inconnu',
        course_code: getRelation(examData.courses)?.code || '',
        professor_id: examData.professor_id,
        date: examData.exam_date,
        duration: examData.duration,
        type: examData.exam_type,
        room: examData.room,
        total_points: examData.total_points,
        passing_grade: examData.passing_grade,
        status: examData.status,
        description: examData.description || ''
      } : null,
      questions: (questionRows || []).map((question) => normalizeExamQuestion(question)),
      studentExams: studentExamRows || [],
      students: (studentRows || []).map((student) => normalizeStudentRecord(student)),
      error: null
    };
  } catch (error) {
    console.error('Erreur getExamGradingData:', error);
    return { exam: null, questions: [], studentExams: [], students: [], error };
  }
};

export const getStudentExamResultDetails = async ({ examId, studentId, profileId }) => {
  try {
    const numericExamId = Number(examId);

    const [
      { data: examData, error: examError },
      { data: studentExam, error: studentExamError },
      { data: quizResult, error: quizResultError },
      { data: questionRows, error: questionsError }
    ] = await Promise.all([
      supabase
        .from('exams')
        .select(`
          id,
          title,
          description,
          course_id,
          professor_id,
          exam_session_id,
          exam_center_id,
          exam_date,
          duration,
          exam_type,
          category,
          share_token,
          room,
          total_points,
          passing_grade,
          status,
          parent_exam:exams!parent_exam_id(id, title),
          courses(id, name, code),
          profiles!professor_id(id, full_name, email),
          exam_sessions!exam_session_id(id, name, academic_year, semester, status),
          exam_centers!exam_center_id(id, name, location, status)
        `)
        .eq('id', numericExamId)
        .single(),
      supabase
        .from('student_exams')
        .select(`
          id,
          exam_id,
          student_id,
          seat_number,
          attendance,
          attempt_status,
          status,
          grade,
          comments,
          answers,
          arrival_time,
          departure_time,
          created_at,
          updated_at
        `)
        .eq('exam_id', numericExamId)
        .eq('student_id', profileId)
        .maybeSingle(),
      supabase
        .from('quiz_results')
        .select(`
          id,
          student_id,
          exam_id,
          score,
          total_questions,
          completion_time,
          answers,
          cheating_attempts,
          completed_at,
          created_at,
          updated_at
        `)
        .eq('exam_id', numericExamId)
        .eq('student_id', profileId)
        .maybeSingle(),
      supabase
        .from('exam_questions')
        .select('*')
        .eq('exam_id', numericExamId)
        .order('question_number', { ascending: true })
    ]);

    if (examError) {
      return { exam: null, studentExam: null, quizResult: null, questions: [], grades: [], error: examError };
    }

    if (studentExamError) {
      return { exam: null, studentExam: null, quizResult: null, questions: [], grades: [], error: studentExamError };
    }

    if (quizResultError) {
      return { exam: null, studentExam: null, quizResult: null, questions: [], grades: [], error: quizResultError };
    }

    if (questionsError) {
      return { exam: null, studentExam: null, quizResult: null, questions: [], grades: [], error: questionsError };
    }

    let grades = [];

    if (studentExam?.id) {
      const { data: gradeRows, error: gradesError } = await supabase
        .from('exam_grades')
        .select('id, student_exam_id, question_id, points_earned, feedback')
        .eq('student_exam_id', studentExam.id);

      if (gradesError) {
        return { exam: null, studentExam: null, quizResult: null, questions: [], grades: [], error: gradesError };
      }

      grades = gradeRows || [];
    }

    return {
      exam: normalizeExamRecord(examData),
      studentExam,
      quizResult,
      questions: (questionRows || []).map((question) => normalizeExamQuestion(question)),
      grades,
      error: null
    };
  } catch (error) {
    console.error('Erreur getStudentExamResultDetails:', error);
    return { exam: null, studentExam: null, quizResult: null, questions: [], grades: [], error };
  }
};

/**
 * Récupère la liste des cours (id, name, code).
 * @returns {Promise<{ data: Array|null, error: Error|null }>}
 */
export const getCoursesList = async () => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('id, name, code')
      .order('name');

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Erreur getCoursesList:', error);
    return { data: null, error };
  }
};

/**
 * Récupère la liste des sessions d'examen.
 * @returns {Promise<{ data: Array|null, error: Error|null }>}
 */
export const getExamSessions = async () => {
  try {
    const { data, error } = await supabase
      .from('exam_sessions')
      .select('*')
      .order('academic_year', { ascending: false })
      .order('semester', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Erreur getExamSessions:', error);
    return { data: null, error };
  }
};

/**
 * Récupère la liste des centres d'examen.
 * @returns {Promise<{ data: Array|null, error: Error|null }>}
 */
export const getExamCenters = async () => {
  try {
    const { data, error } = await supabase
      .from('exam_centers')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Erreur getExamCenters:', error);
    return { data: null, error };
  }
};

/**
 * Récupère un examen brut (sans jointures) par son ID.
 * @param {number} examId
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export const getExamRaw = async (examId) => {
  try {
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erreur getExamRaw:', error);
    return { data: null, error };
  }
};

export const getExamAccessSettings = async (examId) => {
  try {
    const { data, error } = await supabase
      .from('exam_access_settings')
      .select('*')
      .eq('exam_id', examId)
      .maybeSingle();

    if (error) throw error;
    return { data: data || null, error: null };
  } catch (error) {
    console.error('Erreur getExamAccessSettings:', error);
    return { data: null, error };
  }
};

export const upsertExamAccessSettings = async (settings) => {
  try {
    const { data, error } = await supabase
      .from('exam_access_settings')
      .upsert({
        ...settings,
        updated_at: new Date().toISOString()
      }, { onConflict: 'exam_id' })
      .select()
      .maybeSingle();

    if (error) throw error;
    return { data: data || null, error: null };
  } catch (error) {
    console.error('Erreur upsertExamAccessSettings:', error);
    return { data: null, error };
  }
};

/**
 * Récupère les questions d'un examen.
 * @param {number} examId
 * @param {{ orderBy?: string }} [options]
 * @returns {Promise<{ data: Array|null, error: Error|null }>}
 */
export const getExamQuestions = async (examId, options = {}) => {
  try {
    const { data, error } = await supabase
      .from('exam_questions')
      .select('*')
      .eq('exam_id', examId)
      .order(options.orderBy || 'question_number', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Erreur getExamQuestions:', error);
    return { data: null, error };
  }
};

/**
 * Récupère les student_exams d'un examen.
 * @param {number} examId
 * @returns {Promise<{ data: Array|null, error: Error|null }>}
 */
export const getStudentExamsByExamId = async (examId) => {
  try {
    const { data, error } = await supabase
      .from('student_exams')
      .select('*')
      .eq('exam_id', examId);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Erreur getStudentExamsByExamId:', error);
    return { data: null, error };
  }
};

/**
 * Supprime les questions d'un examen.
 * @param {number} examId
 * @returns {Promise<{ error: Error|null }>}
 */
export const deleteExamQuestions = async (examId) => {
  try {
    const { error } = await supabase
      .from('exam_questions')
      .delete()
      .eq('exam_id', examId);

    return { error: error || null };
  } catch (error) {
    console.error('Erreur deleteExamQuestions:', error);
    return { error };
  }
};

/**
 * Insère des questions d'examen.
 * @param {Array<Object>} questions
 * @returns {Promise<{ error: Error|null }>}
 */
export const insertExamQuestions = async (questions) => {
  try {
    const { error } = await supabase
      .from('exam_questions')
      .insert(questions);

    return { error: error || null };
  } catch (error) {
    console.error('Erreur insertExamQuestions:', error);
    return { error };
  }
};

/**
 * Supprime les assignations d'étudiants à un examen.
 * @param {number} examId
 * @returns {Promise<{ error: Error|null }>}
 */
export const deleteStudentExams = async (examId) => {
  try {
    const { error } = await supabase
      .from('student_exams')
      .delete()
      .eq('exam_id', examId);

    return { error: error || null };
  } catch (error) {
    console.error('Erreur deleteStudentExams:', error);
    return { error };
  }
};

/**
 * Insère des assignations d'étudiants à un examen.
 * @param {Array<Object>} studentExams
 * @returns {Promise<{ error: Error|null }>}
 */
export const insertStudentExams = async (studentExams) => {
  try {
    const { error } = await supabase
      .from('student_exams')
      .insert(studentExams);

    return { error: error || null };
  } catch (error) {
    console.error('Erreur insertStudentExams:', error);
    return { error };
  }
};

/**
 * Crée un examen (insert + select).
 * @param {Object} examData
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export const insertExam = async (examData) => {
  try {
    const { data, error } = await supabase
      .from('exams')
      .insert(examData)
      .select();

    if (error) throw error;
    return { data: data?.[0] || null, error: null };
  } catch (error) {
    console.error('Erreur insertExam:', error);
    return { data: null, error };
  }
};

/**
 * Met à jour un examen (sans select).
 * @param {number} examId
 * @param {Object} updates
 * @returns {Promise<{ error: Error|null }>}
 */
export const updateExamDirect = async (examId, updates) => {
  try {
    const { error } = await supabase
      .from('exams')
      .update(updates)
      .eq('id', examId);

    return { error: error || null };
  } catch (error) {
    console.error('Erreur updateExamDirect:', error);
    return { error };
  }
};

/**
 * Supprime un examen par son ID (sans vérification de résultats).
 * @param {number} examId
 * @returns {Promise<{ error: Error|null }>}
 */
export const deleteExamDirect = async (examId) => {
  try {
    const { error } = await supabase
      .from('exams')
      .delete()
      .eq('id', examId);

    return { error: error || null };
  } catch (error) {
    console.error('Erreur deleteExamDirect:', error);
    return { error };
  }
};

/**
 * Récupère un examen avec ses jointures (cours, professeur) pour la notation.
 * @param {number} examId
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export const getExamWithDetails = async (examId) => {
  try {
    const { data, error } = await supabase
      .from('exams')
      .select(`
        id,
        title,
        course_id,
        courses(name, code),
        professor_id,
        professor:profiles!professor_id(full_name),
        exam_date,
        duration,
        exam_type,
        room,
        total_points,
        passing_grade,
        status,
        description
      `)
      .eq('id', examId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erreur getExamWithDetails:', error);
    return { data: null, error };
  }
};

/**
 * Récupère des étudiants par leurs IDs avec leurs profils.
 * @param {number[]} studentIds
 * @returns {Promise<{ data: Array|null, error: Error|null }>}
 */
export const getStudentsByIds = async (studentIds) => {
  try {
    if (!studentIds || studentIds.length === 0) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from('students')
      .select('id, profile_id, profiles(full_name, email, avatar_url)')
      .in('id', studentIds);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Erreur getStudentsByIds:', error);
    return { data: null, error };
  }
};

/**
 * Récupère les notes d'un student_exam.
 * @param {number} studentExamId
 * @returns {Promise<{ data: Array|null, error: Error|null }>}
 */
export const getExamGradesByStudentExam = async (studentExamId) => {
  try {
    const { data, error } = await supabase
      .from('exam_grades')
      .select('id, question_id, points_earned, feedback')
      .eq('student_exam_id', studentExamId);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Erreur getExamGradesByStudentExam:', error);
    return { data: null, error };
  }
};

/**
 * Met à jour un student_exam.
 * @param {number} studentExamId
 * @param {Object} updates
 * @returns {Promise<{ error: Error|null }>}
 */
export const updateStudentExam = async (studentExamId, updates) => {
  try {
    const { error } = await supabase
      .from('student_exams')
      .update(updates)
      .eq('id', studentExamId);

    return { error: error || null };
  } catch (error) {
    console.error('Erreur updateStudentExam:', error);
    return { error };
  }
};

/**
 * Upsert d'une note d'examen (exam_grades).
 * @param {Object} gradeData
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export const upsertExamGrade = async (gradeData) => {
  try {
    const { data, error } = await supabase
      .from('exam_grades')
      .upsert(gradeData, {
        onConflict: 'student_exam_id,question_id'
      })
      .select('id')
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erreur upsertExamGrade:', error);
    return { data: null, error };
  }
};

/**
 * Récupère les étudiants inscrits à un cours (via student_courses).
 * @param {number} courseId
 * @returns {Promise<{ data: Array|null, error: Error|null }>}
 */
export const getCourseStudentsForExam = async (courseId) => {
  try {
    const { data, error } = await supabase
      .from('student_courses')
      .select(`
        student_id,
        academic_year,
        status,
        student:profiles!student_id(
          id,
          full_name,
          email,
          department_id,
          departments(name),
          students(
            id,
            student_number,
            level,
            entry_year,
            status
          )
        )
      `)
      .eq('course_id', courseId)
      .eq('status', 'enrolled');

    if (error) throw error;
    
    const formattedData = (data || []).map((row) => {
      const p = row.profiles || {};
      const s = p.students || {};
      return {
        student_id: row.student_id,
        academic_year: row.academic_year,
        status: row.status,
        students: {
          id: s.id,
          profile_id: p.id,
          student_number: s.student_number,
          level: s.level,
          entry_year: s.entry_year,
          status: s.status,
          profiles: {
            full_name: p.full_name,
            email: p.email,
            department_id: p.department_id,
            departments: p.departments
          }
        }
      };
    });

    return { data: formattedData, error: null };
  } catch (error) {
    console.error('Erreur getCourseStudentsForExam:', error);
    return { data: null, error };
  }
};

/**
 * Récupère tous les étudiants actifs avec leurs profils.
 * @returns {Promise<{ data: Array|null, error: Error|null }>}
 */
export const getAllActiveStudents = async () => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        profile_id,
        profiles(full_name, email, department_id, departments(name)),
        student_number,
        level,
        entry_year,
        status
      `)
      .eq('status', 'active');

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Erreur getAllActiveStudents:', error);
    return { data: null, error };
  }
};

/**
 * Compte les student_exams pour un examen.
 * @param {number} examId
 * @returns {Promise<{ count: number, error: Error|null }>}
 */
export const getStudentExamsCount = async (examId) => {
  try {
    const { count, error } = await supabase
      .from('student_exams')
      .select('*', { count: 'exact', head: true })
      .eq('exam_id', examId);

    if (error) throw error;
    return { count: count || 0, error: null };
  } catch (error) {
    console.error('Erreur getStudentExamsCount:', error);
    return { count: 0, error };
  }
};

/**
 * Récupère les examens d'un professeur avec colonnes spécifiques.
 * @param {number} professorId
 * @returns {Promise<{ data: Array|null, error: Error|null }>}
 */
export const getProfessorExams = async (professorId) => {
  try {
    const { data, error } = await supabase
      .from('exams')
      .select('id, title, description, course_id, department_id, professor_id, exam_session_id, exam_center_id, exam_date, duration, exam_type, room, total_points, passing_grade, status, created_at, updated_at')
      .eq('professor_id', professorId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Erreur getProfessorExams:', error);
    return { data: null, error };
  }
};

/**
 * Crée un canal Supabase Realtime.
 * @param {string} channelName
 * @param {Array<{ event: string, schema: string, table: string, filter?: string, callback: Function }>} subscriptions
 * @returns {Object} Le canal Supabase
 */
export const createRealtimeChannel = (channelName, subscriptions) => {
  let channel = supabase.channel(channelName);

  for (const sub of subscriptions) {
    const config = {
      event: sub.event,
      schema: sub.schema,
      table: sub.table
    };

    if (sub.filter) {
      config.filter = sub.filter;
    }

    // @ts-ignore - Les types dynamiques du paramètre event sont difficiles à inférer pour la surcharge
    channel = channel.on('postgres_changes', config, sub.callback);
  }

  channel.subscribe();
  return channel;
};

/**
 * Met à jour le ping d'activité d'un étudiant en examen
 * @param {string} profileId 
 * @param {number} examId 
 * @param {boolean} isCompleted 
 */
export const updateActiveStudent = async (profileId, examId, isCompleted = false) => {
  try {
    const { error } = await supabase
      .from('active_students')
      .upsert({
        student_id: profileId,
        exam_id: examId,
        last_ping: new Date().toISOString(),
        is_completed: isCompleted
      }, { onConflict: 'student_id,exam_id' });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('updateActiveStudent:', error);
    return { success: false, error };
  }
};

/**
 * Supprime un canal Supabase Realtime.
 * @param {Object} channel
 */
export const removeRealtimeChannel = (channel) => {
  if (channel) {
    supabase.removeChannel(channel);
  }
};

/**
 * Récupère tous les groupes d'étudiants
 * @returns {Promise<Object>}
 */
export const getStudentGroups = async () => {
  try {
    const { data, error } = await supabase
      .from('student_groups')
      .select('*, courses(name, code)')
      .order('academic_year', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err) {
    console.error('Exception getStudentGroups:', err);
    return { data: [], error: err };
  }
};
