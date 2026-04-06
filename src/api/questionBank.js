/**
 * API Banque de Questions — ESGIS Campus §4.7
 */
import { supabase } from '../supabase';

const normalizeQuestion = (row = {}) => ({
  id: row.id,
  professeur_id: row.professeur_id || null,
  professeur_name: row.professeur?.full_name || row.professeur_name || '',
  text: row.question_text || '',
  question_text: row.question_text || '',
  type: row.question_type || '',
  question_type: row.question_type || '',
  difficulty: row.difficulty || 'medium',
  matiere: row.matiere || '',
  theme: row.theme || '',
  options: Array.isArray(row.options) ? row.options : [],
  correct_answer: row.correct_answers ?? row.correct_answer ?? null,
  points: Number(row.points || 1),
  explanation: row.explanation || '',
  tolerance: Number(row.tolerance || 0),
  max_words: row.max_words || null,
  image_url: row.image_url || '',
  is_shared: Boolean(row.is_shared),
  used_count: Number(row.used_count || 0),
  created_at: row.created_at || null,
  updated_at: row.updated_at || null
});

const buildQuestionPayload = (questionData = {}) => ({
  professeur_id: questionData.professeur_id,
  question_text: questionData.question_text ?? questionData.text ?? '',
  question_type: questionData.question_type ?? questionData.type ?? 'qcm_single',
  difficulty: questionData.difficulty || 'medium',
  matiere: questionData.matiere || null,
  theme: questionData.theme || null,
  options: Array.isArray(questionData.options) ? questionData.options : null,
  correct_answer: questionData.correct_answers ? null : questionData.correct_answer ?? null,
  correct_answers: questionData.correct_answers ?? null,
  points: Number(questionData.points || 1),
  explanation: questionData.explanation || null,
  tolerance: Number(questionData.tolerance || 0),
  max_words: questionData.max_words ? Number(questionData.max_words) : null,
  image_url: questionData.image_url || null,
  is_shared: Boolean(questionData.is_shared),
  updated_at: new Date().toISOString()
});

/** Récupère les questions du professeur */
export const getProfessorQuestions = async (professorProfileId, filters = {}) => {
  try {
    let query = supabase
      .from('question_bank')
      .select('*')
      .eq('professeur_id', professorProfileId)
      .order('created_at', { ascending: false });

    if (filters.type) query = query.eq('question_type', filters.type);
    if (filters.difficulty) query = query.eq('difficulty', filters.difficulty);
    if (filters.matiere) query = query.eq('matiere', filters.matiere);
    if (filters.search) query = query.ilike('question_text', `%${filters.search}%`);

    const { data, error } = await query;
    if (error) throw error;
    return { data: (data || []).map(normalizeQuestion), error: null };
  } catch (error) {
    console.error('getProfessorQuestions:', error);
    return { data: null, error };
  }
};

/** Récupère les questions partagées de l'établissement */
export const getSharedQuestions = async (filters = {}) => {
  try {
    let query = supabase
      .from('question_bank')
      .select(`
        *,
        professeur:profiles!professeur_id(
          id,
          full_name
        )
      `)
      .eq('is_shared', true)
      .order('created_at', { ascending: false });

    if (filters.type) query = query.eq('question_type', filters.type);
    if (filters.difficulty) query = query.eq('difficulty', filters.difficulty);
    if (filters.matiere) query = query.eq('matiere', filters.matiere);
    if (filters.search) query = query.ilike('question_text', `%${filters.search}%`);

    const { data, error } = await query;
    if (error) throw error;
    return { data: (data || []).map(normalizeQuestion), error: null };
  } catch (error) {
    console.error('getSharedQuestions:', error);
    return { data: null, error };
  }
};

/** Crée une question */
export const createQuestion = async (questionData) => {
  try {
    const payload = {
      ...buildQuestionPayload(questionData),
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('question_bank')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return { data: normalizeQuestion(data), error: null };
  } catch (error) {
    console.error('createQuestion:', error);
    return { data: null, error };
  }
};

/** Met à jour une question */
export const updateQuestion = async (id, questionData) => {
  try {
    const { data, error } = await supabase
      .from('question_bank')
      .update(buildQuestionPayload(questionData))
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data: normalizeQuestion(data), error: null };
  } catch (error) {
    console.error('updateQuestion:', error);
    return { data: null, error };
  }
};

/** Supprime une question */
export const deleteQuestion = async (id) => {
  try {
    const { error } = await supabase
      .from('question_bank')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('deleteQuestion:', error);
    return { error };
  }
};

/** Duplique une question dans la banque personnelle du professeur */
export const duplicateQuestion = async (questionId, professorProfileId) => {
  try {
    const { data: original, error: fetchError } = await supabase
      .from('question_bank')
      .select('*')
      .eq('id', questionId)
      .single();

    if (fetchError) throw fetchError;

    const {
      id,
      created_at,
      updated_at,
      used_count,
      ...rest
    } = original;

    const copyPayload = {
      ...rest,
      professeur_id: professorProfileId,
      question_text: `[Copie] ${rest.question_text}`,
      is_shared: false,
      used_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('question_bank')
      .insert(copyPayload)
      .select()
      .single();

    if (error) throw error;
    return { data: normalizeQuestion(data), error: null };
  } catch (error) {
    console.error('duplicateQuestion:', error);
    return { data: null, error };
  }
};

/** Incrémente le compteur d'utilisation */
export const incrementUsedCount = async (questionIds = []) => {
  try {
    const uniqueIds = [...new Set((questionIds || []).filter(Boolean))];

    for (const id of uniqueIds) {
      const { data: current, error: fetchError } = await supabase
        .from('question_bank')
        .select('used_count')
        .eq('id', id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      const { error: updateError } = await supabase
        .from('question_bank')
        .update({ used_count: Number(current?.used_count || 0) + 1 })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }
    }

    return { error: null };
  } catch (error) {
    console.error('incrementUsedCount:', error);
    return { error };
  }
};
