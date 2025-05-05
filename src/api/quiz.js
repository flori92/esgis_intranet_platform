/**
 * Service de gestion des quiz et questions
 * Centralise toutes les opérations liées aux quiz
 */
import { supabase } from '../config/supabase';

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
      .from('questions')
      .select(`
        *,
        question_options(*)
      `)
      .eq('exam_id', examId)
      .order('display_order');

    if (error) {
      console.error(`Erreur lors de la récupération des questions de l'examen ${examId}:`, error);
      return { questions: [], error };
    }

    // Formater les données pour avoir les options comme sous-tableau
    const formattedQuestions = data.map((item) => {
      const { question_options, ...question } = item;
      return {
        ...question,
        options: question_options || []
      };
    });

    return { questions: formattedQuestions, error: null };
  } catch (err) {
    console.error(`Exception lors de la récupération des questions de l'examen ${examId}:`, err);
    return { questions: [], error: err };
  }
};

/**
 * Crée une nouvelle question avec ses options
 * @param {Object} questionInputData Données de la question
 * @param {Array<Object>} options Options de la question
 * @param {string} options[].text Texte de l'option
 * @param {boolean} options[].is_correct Indique si l'option est correcte
 * @param {number} options[].display_order Ordre d'affichage de l'option
 * @returns {Promise<Object>} Résultat contenant la question créée avec ses options et une erreur éventuelle
 */
export const createQuestion = async (questionInputData, options) => {
  try {
    // 1. Créer la question
    const questionData = {
      ...questionInputData,
      created_at: new Date().toISOString()
    };

    const { data: questionResult, error: questionError } = await supabase
      .from('questions')
      .insert(questionData)
      .select()
      .single();

    if (questionError || !questionResult) {
      console.error('Erreur lors de la création de la question:', questionError);
      return { question: null, error: questionError };
    }

    // 2. Créer les options pour cette question
    if (options.length > 0) {
      const optionsWithQuestionId = options.map(option => ({
        ...option,
        question_id: questionResult.id,
        created_at: new Date().toISOString()
      }));

      const { data: optionsData, error: optionsError } = await supabase
        .from('question_options')
        .insert(optionsWithQuestionId)
        .select();

      if (optionsError) {
        console.error('Erreur lors de la création des options:', optionsError);
        // Supprimer la question créée pour éviter les données orphelines
        await supabase.from('questions').delete().eq('id', questionResult.id);
        return { question: null, error: optionsError };
      }

      return {
        question: {
          ...questionResult,
          options: optionsData || []
        },
        error: null
      };
    }

    return {
      question: {
        ...questionResult,
        options: []
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
 * @param {number} questionId ID de la question à mettre à jour
 * @param {Object} updates Modifications à appliquer à la question
 * @param {Array<Object>} [options] Nouvelles options de la question (facultatif)
 * @param {number} [options[].id] ID de l'option existante (si mise à jour)
 * @param {string} options[].text Texte de l'option
 * @param {boolean} options[].is_correct Indique si l'option est correcte
 * @param {number} options[].display_order Ordre d'affichage de l'option
 * @returns {Promise<Object>} Résultat contenant la question mise à jour avec ses options et une erreur éventuelle
 */
export const updateQuestion = async (questionId, updates, options) => {
  try {
    // Démarrer une transaction pour assurer l'intégrité des données
    // Note: Supabase ne supporte pas les vraies transactions, donc nous devons gérer manuellement

    // 1. Mettre à jour la question
    const { data: updatedQuestion, error: questionError } = await supabase
      .from('questions')
      .update(updates)
      .eq('id', questionId)
      .select()
      .single();

    if (questionError) {
      console.error(`Erreur lors de la mise à jour de la question ${questionId}:`, questionError);
      return { question: null, error: questionError };
    }

    // 2. Si des options sont fournies, les mettre à jour
    if (options && options.length > 0) {
      // Récupérer les options existantes pour cette question
      const { data: existingOptions, error: fetchError } = await supabase
        .from('question_options')
        .select('*')
        .eq('question_id', questionId);

      if (fetchError) {
        console.error(`Erreur lors de la récupération des options existantes pour la question ${questionId}:`, fetchError);
        return { question: null, error: fetchError };
      }

      // Créer des maps pour un traitement plus facile
      const existingOptionsMap = {};
      existingOptions.forEach(opt => {
        existingOptionsMap[opt.id] = opt;
      });

      const newOptionsMap = {};
      const updateOptionsMap = {};

      // Séparer les options à créer et à mettre à jour
      options.forEach(opt => {
        if (opt.id && existingOptionsMap[opt.id]) {
          updateOptionsMap[opt.id] = {
            ...opt,
            question_id: questionId,
          };
        } else {
          // Nouvelle option (ou ID non existant)
          newOptionsMap[opt.display_order] = {
            ...opt,
            question_id: questionId,
            created_at: new Date().toISOString(),
            id: opt.id || undefined // Supprimer les ID invalides
          };
        }
      });

      // Identifier les options à supprimer (celles qui ne sont pas dans la liste de mise à jour)
      const optionsToDelete = existingOptions
        .filter(opt => !updateOptionsMap[opt.id] && !options.some(o => o.id === opt.id))
        .map(opt => opt.id);

      // 2.1 Créer les nouvelles options
      if (Object.keys(newOptionsMap).length > 0) {
        const newOptions = Object.values(newOptionsMap);
        const { error: createError } = await supabase
          .from('question_options')
          .insert(newOptions);

        if (createError) {
          console.error(`Erreur lors de la création des nouvelles options pour la question ${questionId}:`, createError);
          return { question: null, error: createError };
        }
      }

      // 2.2 Mettre à jour les options existantes
      for (const optId in updateOptionsMap) {
        const { error: updateError } = await supabase
          .from('question_options')
          .update(updateOptionsMap[optId])
          .eq('id', optId);

        if (updateError) {
          console.error(`Erreur lors de la mise à jour de l'option ${optId}:`, updateError);
          return { question: null, error: updateError };
        }
      }

      // 2.3 Supprimer les options qui ne sont plus nécessaires
      if (optionsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('question_options')
          .delete()
          .in('id', optionsToDelete);

        if (deleteError) {
          console.error(`Erreur lors de la suppression des options pour la question ${questionId}:`, deleteError);
          return { question: null, error: deleteError };
        }
      }
    }

    // 3. Récupérer la question mise à jour avec toutes ses options
    const { data: refreshedQuestion, error: refreshError } = await supabase
      .from('questions')
      .select(`
        *,
        question_options(*)
      `)
      .eq('id', questionId)
      .single();

    if (refreshError) {
      console.error(`Erreur lors de la récupération de la question mise à jour ${questionId}:`, refreshError);
      return { question: null, error: refreshError };
    }

    // Formater les données
    const { question_options, ...questionData } = refreshedQuestion;
    
    return {
      question: {
        ...questionData,
        options: question_options || []
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
    // 1. Supprimer les options de la question (les contraintes de clé étrangère peuvent s'en charger,
    // mais nous préférons être explicites)
    const { error: optionsError } = await supabase
      .from('question_options')
      .delete()
      .eq('question_id', questionId);

    if (optionsError) {
      console.error(`Erreur lors de la suppression des options de la question ${questionId}:`, optionsError);
      return { success: false, error: optionsError };
    }

    // 2. Supprimer la question
    const { error: questionError } = await supabase
      .from('questions')
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
      return { result: null, error };
    }

    return { result: data, error: null };
  } catch (err) {
    console.error('Exception lors de l\'enregistrement du résultat du quiz:', err);
    return { result: null, error: err };
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
      return { results: [], error };
    }
    
    // Formater les données
    const formattedResults = (data || []).map((item) => ({
      ...item,
      exam_title: item.exams?.title || 'Examen sans titre',
      exam_description: item.exams?.description || ''
    }));
    
    return { results: formattedResults, error: null };
  } catch (err) {
    console.error(`Exception lors de la récupération des résultats de quiz pour l'étudiant ${studentId}:`, err);
    return { results: [], error: err };
  }
};
