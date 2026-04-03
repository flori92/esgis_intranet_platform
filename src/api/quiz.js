/**
 * Service de gestion des quiz et questions
 * Centralise toutes les opérations liées aux quiz
 */
import { supabase } from '../supabase';

/**
 * Types pour le module quiz - remplacés par des commentaires JSDoc
 * @typedef {Object} Question Question dans un quiz
 * @typedef {Object} QuestionOption Option d'une question
 * @typedef {Object} QuizResult Résultat d'un quiz
 * @typedef {Object} ActiveStudent Étudiant actif sur un quiz
 * @typedef {Object} CheatingAttempt Tentative de triche détectée
 */

/**
 * Récupère toutes les questions d'un examen
 * @param {number} examId ID de l'examen
 * @returns {Promise<Object>} Résultat contenant les questions avec leurs options et une erreur éventuelle
 */
export const getExamQuestions = async (examId) => {
  try {
    const { data, error } = await supabase
      .from('exam_questions')
      .select(`
        id,
        exam_id,
        question_number,
        question_text,
        question_type,
        points,
        options,
        correct_answer,
        rubric
      `)
      .eq('exam_id', examId)
      .order('question_number');

    if (error) {
      console.error(`Erreur lors de la récupération des questions de l'examen ${examId}:`, error);
      return { data: [], questions: [], error };
    }

    const formattedQuestions = (data || []).map((item) => {
      const rawOptions = Array.isArray(item.options) ? item.options : [];
      const optionTexts = rawOptions.map((option) => (typeof option === 'string' ? option : option?.text || ''));

      return {
        ...item,
        text: item.question_text,
        options: optionTexts,
        correctAnswer: item.correct_answer,
      };
    });

    return { data: formattedQuestions, questions: formattedQuestions, error: null };
  } catch (err) {
    console.error(`Exception lors de la récupération des questions de l'examen ${examId}:`, err);
    return { data: [], questions: [], error: err };
  }
};

/**
 * Crée une nouvelle question avec ses options
 * @param {Object} questionInputData - Données de la question
 * @param {Array<Object>} options - Options de la question
 * Chaque option doit contenir:
 * - text {string} - Texte de l'option
 * - is_correct {boolean} - Indique si l'option est correcte
 * - display_order {number} - Ordre d'affichage de l'option
 * @returns {Promise<Object>} Résultat contenant la question créée avec ses options et une erreur éventuelle
 */
export const createQuestion = async (questionInputData, options) => {
  try {
    const optionTexts = (options || []).map((option) => option.text);
    const correctOption = (options || []).find((option) => option.is_correct);
    const questionPayload = {
      exam_id: questionInputData.exam_id,
      question_number: questionInputData.question_number || questionInputData.display_order || 1,
      question_text: questionInputData.question_text || questionInputData.text || '',
      question_type: questionInputData.question_type || 'multiple_choice',
      points: questionInputData.points || 1,
      options: optionTexts,
      correct_answer: correctOption?.text || questionInputData.correct_answer || null,
      rubric: questionInputData.rubric || null,
    };

    const { data: questionResult, error: questionError } = await supabase
      .from('exam_questions')
      .insert(questionPayload)
      .select()
      .single();

    if (questionError || !questionResult) {
      console.error('Erreur lors de la création de la question:', questionError);
      return { question: null, error: questionError };
    }

    return {
      question: {
        ...questionResult,
        text: questionResult.question_text,
        options: optionTexts,
        correctAnswer: questionResult.correct_answer,
      },
      error: null
    };
  } catch (err) {
    console.error('Exception lors de la création de la question:', err);
    return { question: null, error: err };
  }
};

/**
 * Met à jour une question et ses options
 * @param {number} questionId - ID de la question à mettre à jour
 * @param {Object} updates - Modifications à appliquer à la question
 * @param {Array<Object>} [options] - Nouvelles options de la question (facultatif)
 * Chaque option peut contenir:
 * - id {number} - ID de l'option existante (si mise à jour)
 * - text {string} - Texte de l'option
 * - is_correct {boolean} - Indique si l'option est correcte
 * - display_order {number} - Ordre d'affichage de l'option
 * @returns {Promise<Object>} Résultat contenant la question mise à jour avec ses options et une erreur éventuelle
 */
export const updateQuestion = async (questionId, updates, options) => {
  try {
    const optionTexts = Array.isArray(options) ? options.map((option) => option.text) : undefined;
    const correctOption = Array.isArray(options) ? options.find((option) => option.is_correct) : null;
    const payload = {
      ...updates,
    };

    if (optionTexts) {
      payload.options = optionTexts;
    }
    if (correctOption) {
      payload.correct_answer = correctOption.text;
    }

    const { data: updatedQuestion, error: questionError } = await supabase
      .from('exam_questions')
      .update(payload)
      .eq('id', questionId)
      .select()
      .single();

    if (questionError) {
      console.error(`Erreur lors de la mise à jour de la question ${questionId}:`, questionError);
      return { question: null, error: questionError };
    }

    return {
      question: {
        ...updatedQuestion,
        text: updatedQuestion.question_text,
        options: Array.isArray(updatedQuestion.options) ? updatedQuestion.options : [],
        correctAnswer: updatedQuestion.correct_answer,
      },
      error: null
    };
  } catch (err) {
    console.error(`Exception lors de la mise à jour de la question ${questionId}:`, err);
    return { question: null, error: err };
  }
};

/**
 * Supprime une question et ses options
 * @param {number} questionId ID de la question à supprimer
 * @returns {Promise<Object>} Résultat indiquant le succès de l'opération et une erreur éventuelle
 */
export const deleteQuestion = async (questionId) => {
  try {
    const { error: questionError } = await supabase
      .from('exam_questions')
      .delete()
      .eq('id', questionId);

    if (questionError) {
      console.error(`Erreur lors de la suppression de la question ${questionId}:`, questionError);
      return { success: false, error: questionError };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error(`Exception lors de la suppression de la question ${questionId}:`, err);
    return { success: false, error: err };
  }
};

/**
 * Enregistre le résultat d'un quiz
 * @param {Object} resultData Données du résultat à enregistrer
 * @returns {Promise<Object>} Résultat contenant le résultat enregistré et une erreur éventuelle
 */
export const saveQuizResult = async (resultData) => {
  try {
    const { data, error } = await supabase
      .from('quiz_results')
      .insert(resultData)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de l\'enregistrement du résultat du quiz:', error);
      return { data: null, result: null, error };
    }

    return { data, result: data, error: null };
  } catch (err) {
    console.error('Exception lors de l\'enregistrement du résultat du quiz:', err);
    return { data: null, result: null, error: err };
  }
};

/**
 * Enregistre une tentative de triche
 * @param {Object} cheatingData Données de la tentative de triche
 * @returns {Promise<Object>} Résultat indiquant le succès de l'opération et une erreur éventuelle
 */
export const recordCheatingAttempt = async (cheatingData) => {
  try {
    const { error } = await supabase
      .from('cheating_attempts')
      .insert(cheatingData);

    if (error) {
      console.error('Erreur lors de l\'enregistrement de la tentative de triche:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Exception lors de l\'enregistrement de la tentative de triche:', err);
    return { success: false, error: err };
  }
};

/**
 * Version compatible avec l'interface précédente pour enregistrer une tentative de triche
 * @param {string} studentId ID de l'étudiant
 * @param {number} examId ID de l'examen
 * @param {string} details Détails de la tentative de triche
 * @returns {Promise<Object>} Résultat indiquant le succès de l'opération et une erreur éventuelle
 */
export const recordCheatingAttemptLegacy = async (studentId, examId, details) => {
  return recordCheatingAttempt({
    student_id: studentId,
    exam_id: examId,
    details,
    detected_at: new Date().toISOString()
  });
};

/**
 * Enregistre un étudiant actif
 * @param {Object} activeStudentData Données de l'étudiant actif
 * @returns {Promise<Object>} Résultat indiquant le succès de l'opération et une erreur éventuelle
 */
export const recordActiveStudent = async (activeStudentData) => {
  try {
    // Vérifier si cet étudiant est déjà enregistré pour cet examen
    const { data: existingData, error: checkError } = await supabase
      .from('active_students')
      .select('id')
      .eq('student_id', activeStudentData.student_id)
      .eq('exam_id', activeStudentData.exam_id)
      .maybeSingle();

    if (checkError) {
      console.error('Erreur lors de la vérification de l\'étudiant actif:', checkError);
      return { success: false, error: checkError };
    }

    if (existingData) {
      // Mettre à jour l'enregistrement existant
      const { error: updateError } = await supabase
        .from('active_students')
        .update({
          last_ping: new Date().toISOString(),
          is_completed: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingData.id);

      if (updateError) {
        console.error('Erreur lors de la mise à jour de l\'étudiant actif:', updateError);
        return { success: false, error: updateError };
      }
    } else {
      // Créer un nouvel enregistrement
      const { error: insertError } = await supabase
        .from('active_students')
        .insert({
          ...activeStudentData,
          is_completed: false
        });

      if (insertError) {
        console.error('Erreur lors de l\'insertion de l\'étudiant actif:', insertError);
        return { success: false, error: insertError };
      }
    }
    
    return { success: true, error: null };
  } catch (err) {
    console.error('Exception lors de l\'enregistrement de l\'étudiant actif:', err);
    return { success: false, error: err };
  }
};

/**
 * Version compatible avec l'interface précédente pour enregistrer un étudiant actif
 * @param {string} studentId ID de l'étudiant
 * @param {number} examId ID de l'examen
 * @returns {Promise<Object>} Résultat indiquant le succès de l'opération et une erreur éventuelle
 */
export const recordActiveStudentLegacy = async (studentId, examId) => {
  return recordActiveStudent({
    student_id: studentId,
    exam_id: examId,
    start_time: new Date().toISOString(),
    last_ping: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
};

/**
 * Met à jour le statut d'un étudiant actif
 * @param {string} studentId ID de l'étudiant
 * @param {number} examId ID de l'examen
 * @param {boolean} isActive Indique si l'étudiant est toujours actif
 * @returns {Promise<Object>} Résultat indiquant le succès de l'opération et une erreur éventuelle
 */
export const updateActiveStudent = async (studentId, examId, isActive) => {
  try {
    const { error } = await supabase
      .from('active_students')
      .update({
        is_completed: !isActive,
        last_ping: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('student_id', studentId)
      .eq('exam_id', examId);
      
    if (error) {
      console.error('Erreur lors de la mise à jour du statut de l\'étudiant actif:', error);
      return { success: false, error };
    }
    
    return { success: true, error: null };
  } catch (err) {
    console.error('Exception lors de la mise à jour du statut de l\'étudiant actif:', err);
    return { success: false, error: err };
  }
};

/**
 * Récupère les étudiants actifs pour un examen
 * @param {number} examId ID de l'examen
 * @returns {Promise<Object>} Résultat contenant les étudiants actifs avec leur nom et une erreur éventuelle
 */
export const getActiveStudents = async (examId) => {
  try {
    // Définir le seuil de temps pour considérer un étudiant comme "actif"
    const activeThreshold = new Date();
    activeThreshold.setMinutes(activeThreshold.getMinutes() - 2); // 2 minutes
    
    const { data, error } = await supabase
      .from('active_students')
      .select(`
        *,
        profiles!student_id(full_name, avatar_url)
      `)
      .eq('exam_id', examId)
      .eq('is_completed', false)
      .gte('last_ping', activeThreshold.toISOString());
      
    if (error) {
      console.error(`Erreur lors de la récupération des étudiants actifs pour l'examen ${examId}:`, error);
      return { students: [], error };
    }
    
    // Formater les données
    const activeStudents = (data || []).map((item) => ({
      ...item,
      student_name: item.profiles?.full_name
    }));
    
    return { students: activeStudents, error: null };
  } catch (err) {
    console.error(`Exception lors de la récupération des étudiants actifs pour l'examen ${examId}:`, err);
    return { students: [], error: err };
  }
};

/**
 * Récupère les résultats de quiz d'un étudiant
 * @param {string} studentId ID de l'étudiant
 * @returns {Promise<Object>} Résultat contenant les quiz passés par l'étudiant et une erreur éventuelle
 */
export const getStudentQuizResults = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('quiz_results')
      .select(`
        *,
        exams(title, description)
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error(`Erreur lors de la récupération des résultats de quiz pour l'étudiant ${studentId}:`, error);
      return { data: [], results: [], error };
    }
    
    // Formater les données
    const formattedResults = (data || []).map((item) => ({
      ...item,
      exam_title: item.exams?.title || 'Examen sans titre',
      exam_description: item.exams?.description || ''
    }));
    
    return { data: formattedResults, results: formattedResults, error: null };
  } catch (err) {
    console.error(`Exception lors de la récupération des résultats de quiz pour l'étudiant ${studentId}:`, err);
    return { data: [], results: [], error: err };
  }
};
