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
  typeStage: row.type_stage || 'temps_plein',
  competencesRequises: row.competences_requises || [],
  remuneration: row.remuneration != null ? Number(row.remuneration) : null,
  duree: Number(row.duree || 0),
  professeurContact:
    row.professors?.profiles?.full_name ||
    row.professeur_contact ||
    '',
  datePublication: row.date_publication || row.created_at || null,
  departementId: row.departement_id ?? null,
  niveauRequis: row.niveau_requis || [],
  etat: row.etat || 'active'
});

const normalizeApplication = (row = {}) => ({
  id: row.id,
  offre_id: row.offre_id,
  etudiant_id: row.etudiant_id,
  date_candidature: row.date_candidature || row.created_at || null,
  status: row.status || 'pending',
  lettreMotivation: row.lettre_motivation || '',
  cv_path: row.cv_path || '',
  commentaires: row.commentaires || null,
  note_entretien: row.note_entretien != null ? Number(row.note_entretien) : null,
  created_at: row.created_at || null,
  updated_at: row.updated_at || null,
  offre: row.stage_offres ? normalizeOffer(row.stage_offres) : null
});

const normalizeInterview = (row = {}) => ({
  id: row.id,
  candidatureId: row.candidature_id,
  date: row.date || null,
  lieu: row.lieu || '',
  type: row.type || '',
  lien_visio: row.lien_visio || null,
  contact: row.contact || '',
  duree: Number(row.duree || 0),
  notes: row.notes || '',
  created_at: row.created_at || null,
  updated_at: row.updated_at || null
});

export const getStageCompanies = async () => {
  try {
    const { data, error } = await supabase
      .from('entreprises')
      .select('id, nom, secteur')
      .order('nom', { ascending: true });

    if (error) {
      throw error;
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('getStageCompanies:', error);
    return { data: [], error };
  }
};

export const getStageOffers = async () => {
  try {
    const { data, error } = await supabase
      .from('stage_offres')
      .select(`
        id,
        titre,
        description,
        entreprise_id,
        date_debut,
        date_fin,
        lieu,
        type_stage,
        competences_requises,
        remuneration,
        duree,
        professeur_id,
        date_publication,
        departement_id,
        niveau_requis,
        etat,
        created_at,
        entreprises:entreprise_id(
          id,
          nom,
          secteur
        ),
        professors:professeur_id(
          id,
          profile_id,
          profiles:profile_id(
            full_name
          )
        )
      `)
      .eq('etat', 'active')
      .order('date_publication', { ascending: false });

    if (error) {
      throw error;
    }

    return { data: (data || []).map(normalizeOffer), error: null };
  } catch (error) {
    console.error('getStageOffers:', error);
    return { data: [], error };
  }
};

export const getStudentStageApplications = async (studentId) => {
  try {
    if (!studentId) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from('stage_candidatures')
      .select(`
        id,
        offre_id,
        etudiant_id,
        date_candidature,
        status,
        lettre_motivation,
        cv_path,
        commentaires,
        note_entretien,
        created_at,
        updated_at,
        stage_offres:offre_id(
          id,
          titre,
          description,
          entreprise_id,
          date_debut,
          date_fin,
          lieu,
          type_stage,
          competences_requises,
          remuneration,
          duree,
          professeur_id,
          date_publication,
          departement_id,
          niveau_requis,
          etat,
          created_at,
          entreprises:entreprise_id(
            id,
            nom,
            secteur
          ),
          professors:professeur_id(
            id,
            profile_id,
            profiles:profile_id(
              full_name
            )
          )
        )
      `)
      .eq('etudiant_id', Number(studentId))
      .order('date_candidature', { ascending: false });

    if (error) {
      throw error;
    }

    return { data: (data || []).map(normalizeApplication), error: null };
  } catch (error) {
    console.error('getStudentStageApplications:', error);
    return { data: [], error };
  }
};

export const getStudentStageInterviews = async (studentId) => {
  try {
    if (!studentId) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from('stage_entretiens')
      .select(`
        id,
        candidature_id,
        date,
        lieu,
        type,
        lien_visio,
        contact,
        duree,
        notes,
        created_at,
        updated_at,
        stage_candidatures!inner(
          id,
          etudiant_id
        )
      `)
      .eq('stage_candidatures.etudiant_id', Number(studentId))
      .order('date', { ascending: true });

    if (error) {
      throw error;
    }

    return { data: (data || []).map(normalizeInterview), error: null };
  } catch (error) {
    console.error('getStudentStageInterviews:', error);
    return { data: [], error };
  }
};

export const createStageOffer = async ({
  titre,
  description,
  entrepriseId,
  dateDebut,
  dateFin,
  lieu,
  typeStage,
  competencesRequises,
  remuneration,
  duree,
  professorId,
  departementId,
  niveauRequis
}) => {
  try {
    const { data, error } = await supabase
      .from('stage_offres')
      .insert({
        titre,
        description,
        entreprise_id: Number(entrepriseId),
        date_debut: dateDebut,
        date_fin: dateFin,
        lieu,
        type_stage: typeStage,
        competences_requises: competencesRequises || [],
        remuneration: remuneration != null ? Number(remuneration) : null,
        duree: Number(duree),
        professeur_id: professorId ? Number(professorId) : null,
        date_publication: new Date().toISOString(),
        departement_id: Number(departementId),
        niveau_requis: niveauRequis || [],
        etat: 'active'
      })
      .select(`
        id,
        titre,
        description,
        entreprise_id,
        date_debut,
        date_fin,
        lieu,
        type_stage,
        competences_requises,
        remuneration,
        duree,
        professeur_id,
        date_publication,
        departement_id,
        niveau_requis,
        etat,
        created_at,
        entreprises:entreprise_id(
          id,
          nom,
          secteur
        ),
        professors:professeur_id(
          id,
          profile_id,
          profiles:profile_id(
            full_name
          )
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    return { data: normalizeOffer(data), error: null };
  } catch (error) {
    console.error('createStageOffer:', error);
    return { data: null, error };
  }
};

export const createStageApplication = async ({ offreId, studentId, lettreMotivation, cvPath }) => {
  try {
    const { data, error } = await supabase
      .from('stage_candidatures')
      .insert({
        offre_id: Number(offreId),
        etudiant_id: Number(studentId),
        date_candidature: new Date().toISOString(),
        status: 'pending',
        lettre_motivation: lettreMotivation,
        cv_path: cvPath
      })
      .select(`
        id,
        offre_id,
        etudiant_id,
        date_candidature,
        status,
        lettre_motivation,
        cv_path,
        commentaires,
        note_entretien,
        created_at,
        updated_at,
        stage_offres:offre_id(
          id,
          titre,
          description,
          entreprise_id,
          date_debut,
          date_fin,
          lieu,
          type_stage,
          competences_requises,
          remuneration,
          duree,
          professeur_id,
          date_publication,
          departement_id,
          niveau_requis,
          etat,
          created_at,
          entreprises:entreprise_id(
            id,
            nom,
            secteur
          ),
          professors:professeur_id(
            id,
            profile_id,
            profiles:profile_id(
              full_name
            )
          )
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    return { data: normalizeApplication(data), error: null };
  } catch (error) {
    console.error('createStageApplication:', error);
    return { data: null, error };
  }
};

export const updateStageApplication = async (applicationId, updates) => {
  try {
    const payload = {};

    if (typeof updates.lettreMotivation === 'string') {
      payload.lettre_motivation = updates.lettreMotivation;
    }

    const { data, error } = await supabase
      .from('stage_candidatures')
      .update(payload)
      .eq('id', Number(applicationId))
      .select(`
        id,
        offre_id,
        etudiant_id,
        date_candidature,
        status,
        lettre_motivation,
        cv_path,
        commentaires,
        note_entretien,
        created_at,
        updated_at,
        stage_offres:offre_id(
          id,
          titre,
          description,
          entreprise_id,
          date_debut,
          date_fin,
          lieu,
          type_stage,
          competences_requises,
          remuneration,
          duree,
          professeur_id,
          date_publication,
          departement_id,
          niveau_requis,
          etat,
          created_at,
          entreprises:entreprise_id(
            id,
            nom,
            secteur
          )
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    return { data: normalizeApplication(data), error: null };
  } catch (error) {
    console.error('updateStageApplication:', error);
    return { data: null, error };
  }
};

export const deleteStageApplication = async (applicationId) => {
  try {
    const { error } = await supabase
      .from('stage_candidatures')
      .delete()
      .eq('id', Number(applicationId));

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('deleteStageApplication:', error);
    return { error };
  }
};
