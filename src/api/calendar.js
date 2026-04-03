/**
 * API Calendrier & Emploi du temps — ESGIS Campus §5.7
 */
import { supabase } from '../supabase';

/** Récupère tous les créneaux d'emploi du temps */
export const getScheduleEvents = async (filters = {}) => {
  try {
    let query = supabase
      .from('emplois_du_temps')
      .select(`
        id, jour_semaine, heure_debut, heure_fin, salle, recurrence, date_debut, date_fin,
        cours:cours_id(id, code, name),
        professeur:professeur_id(id, full_name),
        groupe:groupe_id(id, name)
      `)
      .order('jour_semaine')
      .order('heure_debut');

    if (filters.professeurId) query = query.eq('professeur_id', filters.professeurId);
    if (filters.groupeId) query = query.eq('groupe_id', filters.groupeId);
    if (filters.coursId) query = query.eq('cours_id', filters.coursId);

    const { data, error } = await query;
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('getScheduleEvents:', error);
    return { data: null, error };
  }
};

/** Récupère les événements institutionnels */
export const getInstitutionalEvents = async () => {
  try {
    const { data, error } = await supabase
      .from('evenements')
      .select(`
        id, title, description, lieu, date_debut, date_fin, type,
        organisateur:organisateur_id(id, full_name),
        public_cible
      `)
      .order('date_debut', { ascending: true });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/** Crée un créneau d'emploi du temps */
export const createScheduleEvent = async (eventData) => {
  try {
    const { data, error } = await supabase
      .from('emplois_du_temps')
      .insert(eventData)
      .select();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/** Met à jour un créneau */
export const updateScheduleEvent = async (id, eventData) => {
  try {
    const { data, error } = await supabase
      .from('emplois_du_temps')
      .update(eventData)
      .eq('id', id)
      .select();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/** Supprime un créneau */
export const deleteScheduleEvent = async (id) => {
  try {
    const { error } = await supabase.from('emplois_du_temps').delete().eq('id', id);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
};

/** Crée un événement institutionnel */
export const createInstitutionalEvent = async (eventData) => {
  try {
    const { data, error } = await supabase
      .from('evenements')
      .insert(eventData)
      .select();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/** Supprime un événement */
export const deleteInstitutionalEvent = async (id) => {
  try {
    const { error } = await supabase.from('evenements').delete().eq('id', id);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
};
