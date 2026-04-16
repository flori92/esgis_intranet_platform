/**
 * API Gestion des Demandes Administratives — ESGIS Campus §9
 */
import { supabase } from '../supabase';

/**
 * Récupère les demandes d'un étudiant
 * @param {string} profileId - UUID du profil demandeur
 */
export const getStudentRequests = async (profileId) => {
  try {
    const { data, error } = await supabase
      .from('validation_queue')
      .select(`
        *,
        document:generated_documents!document_id(
          id,
          file_path,
          status,
          deposit_note,
          approval_date,
          document_templates!template_id(name, type)
        )
      `)
      .eq('requester_id', profileId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('getStudentRequests:', error);
    return { data: [], error };
  }
};

/**
 * Crée une nouvelle demande administrative
 * @param {Object} requestData 
 */
export const createAdministrativeRequest = async (requestData) => {
  try {
    const { data, error } = await supabase
      .from('validation_queue')
      .insert({
        request_type: requestData.type,
        requester_id: requestData.requesterId,
        student_id: requestData.studentId || null,
        status: 'received',
        priority: requestData.priority || 'normal',
        details: requestData.details || {},
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('createAdministrativeRequest:', error);
    return { data: null, error };
  }
};

/**
 * Met à jour le statut d'une demande (Admin)
 * @param {string} requestId 
 * @param {Object} updates 
 */
export const updateRequestStatus = async (requestId, updates) => {
  try {
    const { data, error } = await supabase
      .from('validation_queue')
      .update({
        status: updates.status,
        reviewer_id: updates.reviewerId,
        review_comment: updates.comment,
        document_id: updates.documentId || null,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('updateRequestStatus:', error);
    return { data: null, error };
  }
};
