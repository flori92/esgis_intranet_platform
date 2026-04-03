/**
 * API Banque de Questions — ESGIS Campus §4.7
 */
import { supabase } from '../supabase';

/** Récupère les questions du professeur */
export const getProfessorQuestions = async (professorId, filters = {}) => {
  try {
    let query = supabase
      .from('question_bank')
      .select('*')
      .eq('professeur_id', professorId)
      .order('created_at', { ascending: false });

    if (filters.type) query = query.eq('question_type', filters.type);
    if (filters.difficulty) query = query.eq('difficulty', filters.difficulty);
    if (filters.matiere) query = query.eq('matiere', filters.matiere);
    if (filters.search) query = query.ilike('question_text', `%${filters.search}%`);

    const { data, error } = await query;
    if (error) throw error;
    return { data, error: null };
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
      .select(`*, professeur:professeur_id(id, full_name)`)
      .eq('is_shared', true)
      .order('created_at', { ascending: false });

    if (filters.type) query = query.eq('question_type', filters.type);
    if (filters.difficulty) query = query.eq('difficulty', filters.difficulty);
    if (filters.matiere) query = query.eq('matiere', filters.matiere);

    const { data, error } = await query;
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/** Crée une question */
export const createQuestion = async (questionData) => {
  try {
    const { data, error } = await supabase
      .from('question_bank')
      .insert(questionData)
      .select();
    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/** Met à jour une question */
export const updateQuestion = async (id, questionData) => {
  try {
    const { data, error } = await supabase
      .from('question_bank')
      .update(questionData)
      .eq('id', id)
      .select();
    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/** Supprime une question */
export const deleteQuestion = async (id) => {
  try {
    const { error } = await supabase.from('question_bank').delete().eq('id', id);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
};

/** Duplique une question */
export const duplicateQuestion = async (questionId, professorId) => {
  try {
    const { data: original, error: fetchErr } = await supabase
      .from('question_bank')
      .select('*')
      .eq('id', questionId)
      .single();
    if (fetchErr) throw fetchErr;

    const { id, created_at, updated_at, used_count, ...rest } = original;
    const copy = {
      ...rest,
      professeur_id: professorId,
      question_text: `[Copie] ${rest.question_text}`,
      used_count: 0,
      is_shared: false,
    };

    const { data, error } = await supabase.from('question_bank').insert(copy).select();
    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/** Incrémente le compteur d'utilisation */
export const incrementUsedCount = async (questionIds) => {
  try {
    for (const id of questionIds) {
      const { data: q } = await supabase
        .from('question_bank')
        .select('used_count')
        .eq('id', id)
        .single();
      await supabase
        .from('question_bank')
        .update({ used_count: (q?.used_count || 0) + 1 })
        .eq('id', id);
    }
    return { error: null };
  } catch (error) {
    return { error };
  }
};
