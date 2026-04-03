/**
 * API Gestion des Paiements — ESGIS Campus §5.2
 */
import { supabase } from '../supabase';

/** Récupère le statut financier de tous les étudiants */
export const getAllPaymentStatuses = async (filters = {}) => {
  try {
    let query = supabase
      .from('inscriptions')
      .select(`
        id, annee_academique, statut,
        etudiant:etudiant_id(id, first_name, last_name, full_name),
        niveau:niveau_id(id, code, name, filiere:filiere_id(id, name))
      `)
      .eq('statut', 'en cours')
      .order('created_at', { ascending: false });

    const { data: inscriptions, error: inscErr } = await query;
    if (inscErr) throw inscErr;

    // Pour chaque étudiant, récupérer les paiements
    const result = await Promise.all((inscriptions || []).map(async (insc) => {
      const { data: paiements } = await supabase
        .from('paiements')
        .select('id, montant, type, date_paiement, methode_paiement, statut, reference, recu_url')
        .eq('etudiant_id', insc.etudiant?.id)
        .eq('inscription_id', insc.id)
        .order('date_paiement', { ascending: false });

      const montantPaye = (paiements || [])
        .filter(p => p.statut === 'validé')
        .reduce((sum, p) => sum + (p.montant || 0), 0);

      // Montant dû basé sur le niveau (configurable)
      const montantDu = 850000; // XOF par défaut, à récupérer de system_config

      return {
        id: insc.id,
        student_id: insc.etudiant?.id,
        student_name: insc.etudiant?.full_name || `${insc.etudiant?.last_name} ${insc.etudiant?.first_name}`,
        filiere: `${insc.niveau?.code} ${insc.niveau?.filiere?.name || ''}`.trim(),
        annee_academique: insc.annee_academique,
        montant_du: montantDu,
        montant_paye: montantPaye,
        solde: Math.max(0, montantDu - montantPaye),
        statut: montantPaye >= montantDu ? 'payé' : montantPaye > 0 ? 'partiel' : 'impayé',
        paiements: paiements || [],
        derniere_date: paiements?.[0]?.date_paiement || null,
        methode: paiements?.[0]?.methode_paiement || '-',
        reference: paiements?.[0]?.reference || '-',
      };
    }));

    return { data: result, error: null };
  } catch (error) {
    console.error('getAllPaymentStatuses:', error);
    return { data: null, error };
  }
};

/** Enregistre un nouveau versement */
export const recordPayment = async (paymentData) => {
  try {
    const { data, error } = await supabase
      .from('paiements')
      .insert({
        etudiant_id: paymentData.etudiant_id,
        inscription_id: paymentData.inscription_id || null,
        montant: paymentData.montant,
        devise: 'XOF',
        type: paymentData.type || 'frais_scolarite',
        motif: paymentData.motif || 'Frais de scolarité',
        date_paiement: paymentData.date || new Date().toISOString(),
        reference: paymentData.reference || `PAY-${Date.now()}`,
        methode_paiement: paymentData.methode,
        statut: 'validé',
      })
      .select();
    if (error) throw error;

    // Enregistrer aussi dans payment_records pour traçabilité
    await supabase.from('payment_records').insert({
      paiement_id: data?.[0]?.id,
      etudiant_id: paymentData.etudiant_id,
      montant: paymentData.montant,
      methode: paymentData.methode,
      reference: paymentData.reference,
      date_versement: paymentData.date || new Date().toISOString().split('T')[0],
      enregistre_par: paymentData.enregistre_par,
    });

    return { data: data?.[0], error: null };
  } catch (error) {
    console.error('recordPayment:', error);
    return { data: null, error };
  }
};

/** Récupère l'historique des paiements d'un étudiant */
export const getStudentPayments = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('paiements')
      .select('*')
      .eq('etudiant_id', studentId)
      .order('date_paiement', { ascending: false });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/** Statistiques financières globales */
export const getPaymentStats = async () => {
  try {
    const { data, error } = await supabase
      .from('paiements')
      .select('montant, statut')
      .eq('statut', 'validé');
    if (error) throw error;

    const totalEncaisse = (data || []).reduce((s, p) => s + (p.montant || 0), 0);
    return { data: { totalEncaisse, count: data?.length || 0 }, error: null };
  } catch (error) {
    return { data: null, error };
  }
};
