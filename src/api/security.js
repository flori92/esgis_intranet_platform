/**
 * API Sécurité — OTP, 2FA, Intégrité, RGPD
 * ESGIS Campus §6.3 / §7 / §9.4
 */
import { supabase } from '../supabase';

const normalizeIncidentDate = (entry) => entry?.timestamp || entry?.detected_at || entry?.created_at || null;
const getProfileName = (profile) => profile?.full_name || profile?.email || null;

// ============================================================
// OTP / VÉRIFICATION RENFORCÉE
// ============================================================

/** Génère un code OTP et l'enregistre */
export const generateOTP = async (userId, purpose = 'exam_access', method = 'email') => {
  try {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

    const { data, error } = await supabase.from('otp_codes').insert({
      user_id: userId,
      code,
      purpose,
      method,
      expires_at: expiresAt,
    }).select();

    if (error) throw error;
    return { data: { ...data?.[0], code }, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/** Vérifie un code OTP */
export const verifyOTP = async (userId, code, purpose = 'exam_access') => {
  try {
    const { data, error } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('user_id', userId)
      .eq('code', code)
      .eq('purpose', purpose)
      .eq('is_used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return { valid: false, error: null };

    await supabase.from('otp_codes').update({ is_used: true }).eq('id', data.id);
    return { valid: true, error: null };
  } catch (error) {
    return { valid: false, error };
  }
};

// ============================================================
// 2FA
// ============================================================

/** Récupère les paramètres 2FA d'un utilisateur */
export const get2FASettings = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('two_factor_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return { data: data || { is_enabled: false, method: 'email' }, error: null };
  } catch (error) {
    return { data: { is_enabled: false, method: 'email' }, error };
  }
};

/** Active/désactive le 2FA */
export const toggle2FA = async (userId, enabled, method = 'email') => {
  try {
    const { data, error } = await supabase
      .from('two_factor_settings')
      .upsert({
        user_id: userId,
        is_enabled: enabled,
        method,
        last_verified_at: enabled ? new Date().toISOString() : null,
      }, { onConflict: 'user_id' })
      .select();

    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// ============================================================
// RAPPORT D'INTÉGRITÉ EXAMEN
// ============================================================

/** Génère un rapport d'intégrité pour un examen */
export const generateIntegrityReport = async (examId, generatedBy) => {
  try {
    const numericExamId = Number(examId);

    // Récupérer les incidents
    const [studentsRes, incidentsRes, resultsRes] = await Promise.all([
      supabase
        .from('student_exams')
        .select(`
          id,
          student_id,
          attempt_status,
          answers,
          updated_at,
          profiles(
            id,
            full_name,
            students(
              id,
              student_number
            )
          )
        `)
        .eq('exam_id', numericExamId),
      supabase
        .from('cheating_attempts')
        .select(`
          id,
          student_id,
          exam_id,
          student_exam_id,
          details,
          attempt_count,
          detected_at,
          created_at,
          profiles(full_name, email)
        `)
        .eq('exam_id', numericExamId),
      supabase
        .from('quiz_results')
        .select(`
          id,
          student_id,
          exam_id,
          score,
          completion_time,
          completed_at,
          profiles(full_name, email)
        `)
        .eq('exam_id', numericExamId),
    ]);

    if (studentsRes.error) throw studentsRes.error;
    if (incidentsRes.error) throw incidentsRes.error;
    if (resultsRes.error) throw resultsRes.error;

    const students = studentsRes.data || [];
    const incidents = incidentsRes.data || [];
    const results = resultsRes.data || [];

    // Analyser les sorties d'onglet
    const tabSwitches = incidents
      .filter((incident) => /onglet|focus|blur|tab/i.test(String(incident.details || '')))
      .map((incident) => ({
        student_id: incident.student_id,
        student_name: getProfileName(incident.profiles),
        count: Number(incident.attempt_count || 1),
        timestamp: normalizeIncidentDate(incident),
        details: incident.details || ''
      }));

    // Analyser les reconnexions
    const reconnections = incidents
      .filter((incident) => /reconnect|reconnexion/i.test(String(incident.details || '')))
      .map((incident) => ({
        student_id: incident.student_id,
        student_name: getProfileName(incident.profiles),
        timestamp: normalizeIncidentDate(incident),
        details: incident.details || ''
      }));

    // Détecter les temps anormalement courts
    const suspiciousTiming = results
      .filter((result) => result.completion_time && result.completion_time < 60)
      .map((result) => ({
        student_id: result.student_id,
        student_name: getProfileName(result.profiles),
        completion_time: Number(result.completion_time || 0),
        completed_at: result.completed_at || null
      }));

    // Calculer le niveau de risque
    const totalIncidents = incidents.length;
    const riskLevel = totalIncidents > 20 ? 'critical' : totalIncidents > 10 ? 'high' : totalIncidents > 3 ? 'medium' : 'low';

    const summary = `${students.length} étudiants, ${totalIncidents} incident(s) détecté(s). ` +
      `${tabSwitches.length} sortie(s) d'onglet, ${reconnections.length} reconnexion(s), ` +
      `${suspiciousTiming.length} temps suspect(s).`;

    const { data, error } = await supabase.from('integrity_reports').insert({
      exam_id: numericExamId,
      generated_by: generatedBy,
      total_students: students.length,
      incidents_count: totalIncidents,
      tab_switches: tabSwitches,
      reconnections,
      suspicious_timing: suspiciousTiming,
      copy_similarity: [],
      summary,
      risk_level: riskLevel,
    }).select();

    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/** Récupère les rapports d'intégrité */
export const getIntegrityReports = async (examId = null) => {
  try {
    let query = supabase.from('integrity_reports').select('*').order('created_at', { ascending: false });
    if (examId) query = query.eq('exam_id', Number(examId));
    const { data, error } = await query;
    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error };
  }
};

// ============================================================
// HISTORIQUE DES MODIFICATIONS DE NOTES
// ============================================================

/** Enregistre un changement de note */
export const logGradeChange = async ({ gradeId, studentId, courseId, oldValue, newValue, changeType, changedBy, reason }) => {
  try {
    const { error } = await supabase.from('grade_history').insert({
      grade_id: gradeId,
      student_id: studentId,
      course_id: courseId,
      old_value: oldValue,
      new_value: newValue,
      change_type: changeType,
      changed_by: changedBy,
      reason,
    });
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
};

/** Récupère l'historique des modifications de notes */
export const getGradeHistory = async (filters = {}) => {
  try {
    let query = supabase.from('grade_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (filters.studentId) query = query.eq('student_id', filters.studentId);
    if (filters.courseId) query = query.eq('course_id', filters.courseId);
    if (filters.changedBy) query = query.eq('changed_by', filters.changedBy);

    const { data, error } = await query;
    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error };
  }
};

// ============================================================
// RGPD — CONFORMITÉ
// ============================================================

/** Récupère les politiques de rétention */
export const getRetentionPolicies = async () => {
  try {
    const { data, error } = await supabase.from('data_retention_policies').select('*').order('data_type');
    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error };
  }
};

/** Met à jour une politique de rétention */
export const updateRetentionPolicy = async (id, updates) => {
  try {
    const { error } = await supabase.from('data_retention_policies').update(updates).eq('id', id);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
};

/** Soumet une demande d'accès aux données */
export const submitDataAccessRequest = async (userId, requestType, details) => {
  try {
    const { data, error } = await supabase.from('data_access_requests').insert({
      user_id: userId,
      request_type: requestType,
      details,
    }).select();
    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/** Récupère les demandes d'accès */
export const getDataAccessRequests = async (filters = {}) => {
  try {
    let query = supabase.from('data_access_requests')
      .select('*, user:profiles!user_id(full_name, email), processor:profiles!processed_by(full_name)')
      .order('created_at', { ascending: false });

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.userId) query = query.eq('user_id', filters.userId);

    const { data, error } = await query;
    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error };
  }
};

/** Traite une demande d'accès */
export const processDataAccessRequest = async (requestId, status, response, processedBy) => {
  try {
    const { error } = await supabase.from('data_access_requests').update({
      status,
      response,
      processed_by: processedBy,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
    }).eq('id', requestId);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
};

/** Exporte toutes les données d'un utilisateur (droit d'accès RGPD) */
export const exportUserData = async (userId) => {
  try {
    const { data: student } = await supabase.from('students').select('id').eq('profile_id', userId).maybeSingle();
    const studentIntegerId = student?.id;

    const promises = [
      supabase.from('profiles').select('*').eq('id', userId).single(),
      studentIntegerId
        ? supabase.from('generated_documents').select('*').eq('student_id', studentIntegerId)
        : Promise.resolve({ data: [] }),
      supabase.from('notifications').select('*').or(`recipient_id.eq.${userId},sender_id.eq.${userId}`).limit(100),
      supabase.from('messages').select('*').or(`sender_id.eq.${userId},recipient_id.eq.${userId}`).limit(100),
    ];

    if (studentIntegerId) {
      promises.push(supabase.from('grades').select('*, course:courses(name, code)').eq('student_id', studentIntegerId));
    } else {
      promises.push(Promise.resolve({ data: [] }));
    }

    const [profileRes, docsRes, notifRes, messagesRes, gradesRes] = await Promise.all(promises);

    return {
      data: {
        profile: profileRes.data,
        grades: gradesRes?.data || [],
        documents: docsRes.data || [],
        notifications: notifRes.data || [],
        messages: messagesRes.data || [],
        exported_at: new Date().toISOString(),
      },
      error: null
    };
  } catch (error) {
    return { data: null, error };
  }
};
