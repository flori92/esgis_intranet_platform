/**
 * API Cours & Ressources Pédagogiques — ESGIS Campus §3.2 / §4.2
 */
import { supabase } from '../supabase';

/** Récupère les cours d'un étudiant via ses inscriptions */
export const getStudentCourses = async (studentId) => {
  try {
    const { data: inscriptions, error: inscErr } = await supabase
      .from('inscriptions')
      .select('niveau_id')
      .eq('etudiant_id', studentId)
      .eq('statut', 'en cours');
    if (inscErr) throw inscErr;

    const niveauIds = (inscriptions || []).map(i => i.niveau_id);
    if (niveauIds.length === 0) return { data: [], error: null };

    const { data, error } = await supabase
      .from('cours')
      .select(`
        id, code, name, credits, description,
        professeur:professeur_id(id, full_name, avatar_url),
        niveau:niveau_id(id, code, name, filiere:filiere_id(id, code, name))
      `)
      .in('niveau_id', niveauIds)
      .order('name');

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('getStudentCourses:', error);
    return { data: null, error };
  }
};

/** Récupère les chapitres et ressources d'un cours */
export const getCourseChaptersAndResources = async (courseId) => {
  try {
    const { data: chapters, error: chErr } = await supabase
      .from('course_chapters')
      .select('id, name, sort_order')
      .eq('cours_id', courseId)
      .order('sort_order');
    if (chErr) throw chErr;

    const { data: resources, error: resErr } = await supabase
      .from('course_resources')
      .select(`
        id, title, description, file_url, file_type, file_size,
        downloads_count, status, publish_at, created_at,
        chapter_id,
        uploaded_by:uploaded_by(id, full_name)
      `)
      .eq('cours_id', courseId)
      .eq('status', 'published')
      .order('created_at', { ascending: false });
    if (resErr) throw resErr;

    const chaptersWithResources = (chapters || []).map(ch => ({
      ...ch,
      resources: (resources || []).filter(r => r.chapter_id === ch.id)
    }));

    return { data: chaptersWithResources, error: null };
  } catch (error) {
    console.error('getCourseChaptersAndResources:', error);
    return { data: null, error };
  }
};

/** Enregistre une interaction (vue, téléchargement, favori, réaction) */
export const recordResourceInteraction = async (resourceId, userId, type, reactionValue = null) => {
  try {
    const { data, error } = await supabase
      .from('resource_interactions')
      .upsert({
        resource_id: resourceId,
        user_id: userId,
        interaction_type: type,
        reaction_value: reactionValue
      }, { onConflict: 'resource_id,user_id,interaction_type' })
      .select();

    // Incrémenter le compteur de téléchargements
    if (type === 'download') {
      await supabase.rpc('increment_download_count', { rid: resourceId }).catch(() => {});
    }
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('recordResourceInteraction:', error);
    return { data: null, error };
  }
};

/** Récupère les favoris d'un utilisateur */
export const getUserFavorites = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('resource_interactions')
      .select('resource_id')
      .eq('user_id', userId)
      .eq('interaction_type', 'favorite');
    if (error) throw error;
    return { data: (data || []).map(d => d.resource_id), error: null };
  } catch (error) {
    return { data: [], error };
  }
};

/** Recherche dans les ressources */
export const searchResources = async (query, courseId = null) => {
  try {
    let q = supabase
      .from('course_resources')
      .select(`
        id, title, file_type, file_size, created_at, downloads_count,
        chapter:chapter_id(name),
        cours:cours_id(name, code),
        uploaded_by:uploaded_by(full_name)
      `)
      .eq('status', 'published')
      .ilike('title', `%${query}%`);
    if (courseId) q = q.eq('cours_id', courseId);
    const { data, error } = await q.limit(50);
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/** Upload une ressource (professeur) */
export const uploadResource = async (file, courseId, chapterId, title, description, professorId) => {
  try {
    const ext = file.name.split('.').pop();
    const path = `courses/${courseId}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('documents').upload(path, file);
    if (upErr) throw upErr;
    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);

    const { data, error } = await supabase
      .from('course_resources')
      .insert({
        chapter_id: chapterId, cours_id: courseId, title, description,
        file_url: urlData.publicUrl, file_type: ext, file_size: file.size,
        uploaded_by: professorId, status: 'published'
      })
      .select();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('uploadResource:', error);
    return { data: null, error };
  }
};
