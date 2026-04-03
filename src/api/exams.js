/**
 * Service de gestion des examens
 * Centralise toutes les opérations liées aux examens
 */
import { supabase } from '../supabase';

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
      .select('*, profiles!professor_id(full_name, avatar_url)', { count: 'exact' });

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
        profiles!professor_id(full_name),
        departments!department_id(name)
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
        professor_name: examData.profiles?.full_name,
        department_name: examData.departments?.name,
      },
      error: null
    };
  } catch (err) {
    console.error(`Exception lors de la récupération de l'examen ${examId}:`, err);
    return { exam: null, error: err };
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
  const professor = getRelation(record.professors);
  const professorProfile = getRelation(professor?.profiles);
  const session = getRelation(record.exam_sessions);
  const center = getRelation(record.exam_centers);

  return {
    ...record,
    course,
    course_name: course?.name || null,
    course_code: course?.code || null,
    professor_name: professorProfile?.full_name || null,
    professor_email: professorProfile?.email || null,
    session_name: session?.name || null,
    session_semester: session?.semester || null,
    center_name: center?.name || null,
    center_location: center?.location || null
  };
};

export const getStudentExamLaunchData = async ({ examId, studentId }) => {
  try {
    const numericExamId = Number(examId);

    const [{ data: examData, error: examError }, { data: studentExam, error: studentExamError }] = await Promise.all([
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
          date,
          duration,
          type,
          room,
          total_points,
          passing_grade,
          status,
          courses:course_id(id, name, code),
          professors:professor_id(id, profile_id, profiles:profile_id(full_name, email)),
          exam_sessions:exam_session_id(id, name, academic_year, semester, status),
          exam_centers:exam_center_id(id, name, location, status)
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
        .eq('student_id', studentId)
        .maybeSingle()
    ]);

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

export const markStudentExamStarted = async ({ studentExamId, examId }) => {
  try {
    const now = new Date().toISOString();

    const { error: studentExamError } = await supabase
      .from('student_exams')
      .update({
        attempt_status: 'in_progress',
        arrival_time: now,
        updated_at: now
      })
      .eq('id', studentExamId);

    if (studentExamError) {
      return { success: false, error: studentExamError };
    }

    const { error: examError } = await supabase
      .from('exams')
      .update({
        status: 'in_progress',
        updated_at: now
      })
      .eq('id', examId)
      .in('status', ['published', 'in_progress']);

    if (examError) {
      console.error("Erreur lors du passage de l'examen en cours:", examError);
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Erreur markStudentExamStarted:', error);
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
  passingGrade
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

    const { error: quizResultError } = await supabase
      .from('quiz_results')
      .upsert({
        student_id: profileId,
        exam_id: numericExamId,
        score: normalizedScore,
        total_questions: Number(totalQuestions || 0),
        completion_time: Number(completionTime || 0),
        answers: answers || {},
        cheating_attempts: Number(cheatingAttempts || 0),
        completed_at: now,
        updated_at: now
      }, {
        onConflict: 'student_id,exam_id'
      });

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

export const getProfessorExamMonitoringData = async (examId) => {
  try {
    const numericExamId = Number(examId);

    const [
      { data: examData, error: examError },
      { data: studentExams, error: studentExamsError },
      { data: activeStudents, error: activeStudentsError },
      { data: cheatingAttempts, error: cheatingAttemptsError }
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
          date,
          duration,
          type,
          room,
          total_points,
          passing_grade,
          status,
          courses:course_id(id, name, code),
          professors:professor_id(id, profile_id, profiles:profile_id(full_name, email)),
          exam_sessions:exam_session_id(id, name, academic_year, semester, status),
          exam_centers:exam_center_id(id, name, location, status)
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
          students:student_id(
            id,
            profile_id,
            student_number,
            level,
            profiles:profile_id(full_name, email, avatar_url)
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
          profiles:student_id(full_name, email, avatar_url)
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
          timestamp,
          detected_at,
          profiles:student_id(full_name, email)
        `)
        .eq('exam_id', numericExamId)
        .order('timestamp', { ascending: false })
        .limit(50)
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

    const activeByProfileId = new Map(
      (activeStudents || []).map((row) => [row.student_id, row])
    );

    const incidentsByStudentExamId = new Map();
    (cheatingAttempts || []).forEach((incident) => {
      const key = incident.student_exam_id || incident.student_id;
      incidentsByStudentExamId.set(key, (incidentsByStudentExamId.get(key) || 0) + 1);
    });

    const participants = (studentExams || []).map((row) => {
      const student = getRelation(row.students);
      const profile = getRelation(student?.profiles);
      const activeEntry = activeByProfileId.get(student?.profile_id);

      return {
        ...row,
        student_name: profile?.full_name || 'Étudiant inconnu',
        student_email: profile?.email || '',
        student_avatar: profile?.avatar_url || null,
        student_profile_id: student?.profile_id || null,
        student_number: student?.student_number || '',
        level: student?.level || '',
        is_active: Boolean(activeEntry && !activeEntry.is_completed),
        active_last_ping: activeEntry?.last_ping || null,
        active_start_time: activeEntry?.start_time || null,
        detected_incidents: incidentsByStudentExamId.get(row.id) || 0
      };
    });

    const normalizedExam = normalizeExamRecord(examData);
    const summary = {
      assignedCount: participants.length,
      activeCount: participants.filter((participant) => participant.is_active).length,
      submittedCount: participants.filter((participant) => participant.attempt_status === 'submitted').length,
      gradedCount: participants.filter((participant) => participant.grade !== null && participant.grade !== undefined).length,
      incidentsCount: (cheatingAttempts || []).length
    };

    return {
      exam: normalizedExam,
      participants,
      activeStudents: activeStudents || [],
      incidents: cheatingAttempts || [],
      summary,
      error: null
    };
  } catch (error) {
    console.error('Erreur getProfessorExamMonitoringData:', error);
    return { exam: null, participants: [], activeStudents: [], incidents: [], summary: null, error };
  }
};
