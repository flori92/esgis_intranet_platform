/**
 * API Gestion des Stages et Insertion — ESGIS Campus §10
 */
import { supabase } from '../supabase';

const normalizeOffer = (row = {}) => ({
  id: row.id,
  titre: row.titre || '',
  description: row.description || '',
  entreprise: {
    id: row.entreprises?.id ?? row.entreprise_id ?? null,
    nom: row.entreprises?.nom || 'Entreprise',
    secteur: row.entreprises?.secteur || ''
  },
  dateDebut: row.date_debut || null,
  dateFin: row.date_fin || null,
  lieu: row.lieu || '',
  typeStage: row.type_stage || 'internship',
  competencesRequises: row.competences_requises || [],
  remuneration: row.remuneration != null ? Number(row.remuneration) : null,
  duree: row.duree || '',
  professeurContact: row.professors?.profiles?.full_name || '',
  datePublication: row.created_at || null,
  departementId: row.departement_id ?? null,
  niveauRequis: row.niveau_requis || [],
  etat: row.etat || 'active'
});

const normalizeApplication = (row = {}) => ({
  id: row.id,
  offre_id: row.offre_id,
  student_id: row.etudiant_id,
  date_candidature: row.created_at || null,
  status: row.statut || 'pending',
  lettreMotivation: row.lettre_motivation || '',
  cv_path: row.cv_path || '',
  offre: row.stage_offres ? normalizeOffer(row.stage_offres) : null
});

/** Recupere les offres de stage */
export const getStageOffers = async (filters = {}) => {
  try {
    let query = supabase
      .from('stage_offres')
      .select(`
        *,
        entreprises:entreprise_id(*),
        professors:professeur_id(id, profiles:profile_id(full_name))
      `)
      .order('created_at', { ascending: false });

    if (filters.etat) query = query.eq('etat', filters.etat);
    
    const { data, error } = await query;
    if (error) throw error;

    return { data: (data || []).map(normalizeOffer), error: null };
  } catch (error) {
    console.error('getStageOffers:', error);
    return { data: [], error };
  }
};

/** Recupere les candidatures d'un étudiant */
export const getStudentStageApplications = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('stage_candidatures')
      .select(`
        *,
        stage_offres:offre_id(
          *,
          entreprises:entreprise_id(*),
          professors:professeur_id(id, profiles:profile_id(full_name))
        )
      `)
      .eq('etudiant_id', studentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: (data || []).map(normalizeApplication), error: null };
  } catch (error) {
    console.error('getStudentStageApplications:', error);
    return { data: [], error };
  }
};

/** Créer une candidature */
export const createStageApplication = async ({ offreId, studentId, lettreMotivation, cvPath }) => {
  try {
    const { data, error } = await supabase
      .from('stage_candidatures')
      .insert({
        offre_id: offreId,
        etudiant_id: studentId,
        lettre_motivation: lettreMotivation,
        cv_path: cvPath,
        statut: 'en_attente'
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('createStageApplication:', error);
    return { data: null, error };
  }
};

/** Supprimer une offre (Admin/Prof) */
export const deleteStageOffer = async (id) => {
  try {
    const { error } = await supabase.from('stage_offres').delete().eq('id', id);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
};

/** Supprimer une candidature (Etudiant) */
export const deleteStageApplication = async (id) => {
  try {
    const { error } = await supabase.from('stage_candidatures').delete().eq('id', id);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
};

// Legacy support for older components
export const getStudentStageInterviews = async () => ({ data: [], error: null });
export const updateStageApplication = async () => ({ data: null, error: null });
export const createStageOffer = async (data) => {
  const { data: res, error } = await supabase.from('stage_offres').insert(data).select().single();
  return { data: res, error };
};
export const getStageCompanies = async () => {
  const { data, error } = await supabase.from('entreprises').select('*').order('nom');
  return { data, error };
};
