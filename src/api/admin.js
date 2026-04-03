/**
 * API Administration — Config système, Audit, Rôles, Bulletins
 * ESGIS Campus §5.5 / §7
 */
import { supabase } from '../supabase';

// ============================================================
// AUDIT LOG
// ============================================================

/** Enregistre un événement d'audit */
export const logAuditEvent = async ({ userId, userName, userRole, action, resource, resourceId, details, ipAddress }) => {
  try {
    const { error } = await supabase.from('audit_log').insert({
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      action,
      resource,
      resource_id: resourceId || null,
      details,
      ip_address: ipAddress || null,
      user_agent: navigator.userAgent,
    });
    if (error) console.error('logAuditEvent error:', error);
    return { error };
  } catch (error) {
    console.error('logAuditEvent:', error);
    return { error };
  }
};

/** Récupère les entrées du journal d'audit */
export const getAuditLogs = async (filters = {}, page = 1, perPage = 50) => {
  try {
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = supabase
      .from('audit_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filters.action) query = query.eq('action', filters.action);
    if (filters.userRole) query = query.eq('user_role', filters.userRole);
    if (filters.resource) query = query.eq('resource', filters.resource);
    if (filters.search) {
      query = query.or(`user_name.ilike.%${filters.search}%,details.ilike.%${filters.search}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return { data, total: count, error: null };
  } catch (error) {
    console.error('getAuditLogs:', error);
    return { data: null, total: 0, error };
  }
};

// ============================================================
// RÔLES & PERMISSIONS
// ============================================================

/** Récupère tous les rôles personnalisés */
export const getRoles = async () => {
  try {
    const { data, error } = await supabase
      .from('custom_roles')
      .select('*')
      .order('created_at');
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/** Crée un rôle */
export const createRole = async (roleData) => {
  try {
    const { data, error } = await supabase.from('custom_roles').insert(roleData).select();
    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/** Met à jour un rôle */
export const updateRole = async (id, roleData) => {
  try {
    const { data, error } = await supabase.from('custom_roles').update(roleData).eq('id', id).select();
    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/** Supprime un rôle */
export const deleteRole = async (id) => {
  try {
    const { error } = await supabase.from('custom_roles').delete().eq('id', id);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
};

// ============================================================
// CONFIG SYSTÈME
// ============================================================

/** Récupère toute la configuration système */
export const getSystemConfig = async () => {
  try {
    const { data, error } = await supabase
      .from('system_config')
      .select('config_key, config_value');
    if (error) throw error;

    // Transformer en objet clé-valeur
    const config = {};
    (data || []).forEach(row => { config[row.config_key] = row.config_value; });
    return { data: config, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/** Met à jour une clé de configuration */
export const updateSystemConfig = async (key, value, updatedBy) => {
  try {
    const { data, error } = await supabase
      .from('system_config')
      .upsert({
        config_key: key,
        config_value: value,
        updated_by: updatedBy,
      }, { onConflict: 'config_key' })
      .select();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/** Sauvegarde toute la configuration d'un coup */
export const saveAllConfig = async (configObject, updatedBy) => {
  try {
    const rows = Object.entries(configObject).map(([key, value]) => ({
      config_key: key,
      config_value: value,
      updated_by: updatedBy,
    }));
    const { error } = await supabase
      .from('system_config')
      .upsert(rows, { onConflict: 'config_key' });
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
};

// ============================================================
// GÉNÉRATION EN MASSE DE BULLETINS
// ============================================================

/** Récupère les étudiants d'un niveau avec leurs moyennes */
export const getStudentsForBulletins = async (niveauId, semestre, anneeAcademique) => {
  try {
    const { data: inscriptions, error: inscErr } = await supabase
      .from('inscriptions')
      .select(`
        id,
        etudiant:etudiant_id(id, first_name, last_name, full_name)
      `)
      .eq('niveau_id', niveauId)
      .eq('annee_academique', anneeAcademique)
      .eq('statut', 'en cours');
    if (inscErr) throw inscErr;

    // Pour chaque étudiant, calculer la moyenne
    const studentsWithGrades = await Promise.all((inscriptions || []).map(async (insc, idx) => {
      const studentId = insc.etudiant?.id;
      if (!studentId) return null;

      const { data: notes } = await supabase
        .from('notes')
        .select('note, coefficient, cours:cours_id(credits)')
        .eq('etudiant_id', studentId);

      let totalWeighted = 0, totalCoef = 0, totalCredits = 0;
      (notes || []).forEach(n => {
        totalWeighted += (n.note || 0) * (n.coefficient || 1);
        totalCoef += (n.coefficient || 1);
        totalCredits += (n.note >= 10 ? (n.cours?.credits || 0) : 0);
      });

      const moyenne = totalCoef > 0 ? Math.round((totalWeighted / totalCoef) * 100) / 100 : 0;
      const getMention = (avg) => {
        if (avg >= 16) return 'Très Bien';
        if (avg >= 14) return 'Bien';
        if (avg >= 12) return 'Assez Bien';
        if (avg >= 10) return 'Passable';
        return 'Insuffisant';
      };
      const getStatut = (avg) => {
        if (avg >= 10) return 'admis';
        if (avg >= 9) return 'compensation';
        if (avg >= 8) return 'rattrapage';
        return 'ajourné';
      };

      return {
        id: studentId,
        name: insc.etudiant?.full_name || `${insc.etudiant?.last_name} ${insc.etudiant?.first_name}`,
        moyenne,
        credits: totalCredits,
        rang: 0,
        mention: getMention(moyenne),
        statut: getStatut(moyenne),
      };
    }));

    // Calculer les rangs
    const valid = studentsWithGrades.filter(Boolean).sort((a, b) => b.moyenne - a.moyenne);
    valid.forEach((s, i) => { s.rang = i + 1; });

    return { data: valid, error: null };
  } catch (error) {
    console.error('getStudentsForBulletins:', error);
    return { data: null, error };
  }
};

/** Enregistre un bulletin généré */
export const saveBulletin = async (bulletinData) => {
  try {
    const { data, error } = await supabase.from('bulletins').insert(bulletinData).select();
    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// ============================================================
// QUIZ D'ENTRAÎNEMENT
// ============================================================

/** Récupère les quiz d'entraînement accessibles à un étudiant */
export const getPracticeQuizzes = async (studentId) => {
  try {
    // D'abord récupérer les cours de l'étudiant
    const { data: inscriptions } = await supabase
      .from('inscriptions')
      .select('niveau_id')
      .eq('etudiant_id', studentId)
      .eq('statut', 'en cours');

    const niveauIds = (inscriptions || []).map(i => i.niveau_id);

    let query = supabase
      .from('practice_quizzes')
      .select(`
        id, title, description, duration_minutes, difficulty, created_at,
        cours:cours_id(id, name, code, niveau_id),
        professeur:professeur_id(id, full_name)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    const { data: quizzes, error } = await query;
    if (error) throw error;

    // Filtrer par niveau de l'étudiant
    const filtered = (quizzes || []).filter(q =>
      !q.cours?.niveau_id || niveauIds.includes(q.cours.niveau_id)
    );

    // Enrichir avec les tentatives de l'étudiant
    const enriched = await Promise.all(filtered.map(async (quiz) => {
      const { data: attempts } = await supabase
        .from('practice_quiz_attempts')
        .select('score, max_score, percentage, completed_at')
        .eq('quiz_id', quiz.id)
        .eq('student_id', studentId)
        .order('percentage', { ascending: false });

      const questionsArray = quiz.questions || [];

      return {
        ...quiz,
        questions_count: Array.isArray(questionsArray) ? questionsArray.length : 0,
        attempts: attempts?.length || 0,
        best_score: attempts?.[0]?.percentage || null,
      };
    }));

    return { data: enriched, error: null };
  } catch (error) {
    console.error('getPracticeQuizzes:', error);
    return { data: null, error };
  }
};

/** Récupère les questions d'un quiz */
export const getPracticeQuizQuestions = async (quizId) => {
  try {
    const { data, error } = await supabase
      .from('practice_quizzes')
      .select('questions')
      .eq('id', quizId)
      .single();
    if (error) throw error;
    return { data: data?.questions || [], error: null };
  } catch (error) {
    return { data: [], error };
  }
};

/** Enregistre une tentative de quiz */
export const savePracticeQuizAttempt = async (attemptData) => {
  try {
    const { data, error } = await supabase
      .from('practice_quiz_attempts')
      .insert(attemptData)
      .select();
    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (error) {
    return { data: null, error };
  }
};
