/**
 * API Monitoring & Sauvegardes — ESGIS Campus §7
 */
import { supabase } from '../supabase';

// ============================================================
// MONITORING SYSTÈME
// ============================================================

/** Récupère les métriques système récentes */
export const getSystemMetrics = async (metricType = null, limit = 100) => {
  try {
    let query = supabase.from('system_monitoring')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (metricType) query = query.eq('metric_type', metricType);

    const { data, error } = await query;
    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error };
  }
};

/** Enregistre une métrique */
export const recordMetric = async (metricType, metricValue, metadata = null) => {
  try {
    const { error } = await supabase.from('system_monitoring').insert({
      metric_type: metricType,
      metric_value: metricValue,
      metadata,
    });
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
};

/** Récupère le résumé du monitoring */
export const getMonitoringSummary = async () => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

    const [
      { count: usersOnline },
      { count: errorsLastHour },
      { count: requestsToday },
      { data: latestMetrics }
    ] = await Promise.all([
      supabase.from('system_monitoring').select('*', { count: 'exact', head: true })
        .eq('metric_type', 'users_online').gte('recorded_at', oneHourAgo),
      supabase.from('system_monitoring').select('*', { count: 'exact', head: true })
        .eq('metric_type', 'errors').gte('recorded_at', oneHourAgo),
      supabase.from('system_monitoring').select('*', { count: 'exact', head: true })
        .eq('metric_type', 'requests').gte('recorded_at', oneDayAgo),
      supabase.from('system_monitoring').select('metric_type, metric_value, recorded_at')
        .order('recorded_at', { ascending: false }).limit(20),
    ]);

    // Calculer les indicateurs de santé
    const latest = {};
    (latestMetrics || []).forEach(m => {
      if (!latest[m.metric_type]) latest[m.metric_type] = m;
    });

    return {
      data: {
        usersOnline: usersOnline || 0,
        errorsLastHour: errorsLastHour || 0,
        requestsToday: requestsToday || 0,
        cpu: latest.cpu?.metric_value || 0,
        memory: latest.memory?.metric_value || 0,
        storage: latest.storage?.metric_value || 0,
        latency: latest.latency?.metric_value || 0,
        status: (errorsLastHour || 0) > 50 ? 'critical' : (errorsLastHour || 0) > 10 ? 'warning' : 'healthy',
      },
      error: null
    };
  } catch (error) {
    return { data: null, error };
  }
};

// ============================================================
// SAUVEGARDES
// ============================================================

/** Récupère la liste des sauvegardes */
export const getBackups = async () => {
  try {
    const { data, error } = await supabase.from('backups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error };
  }
};

/** Déclenche une sauvegarde manuelle */
export const triggerBackup = async (triggeredBy, backupType = 'manual') => {
  try {
    const { data, error } = await supabase.from('backups').insert({
      backup_type: backupType,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      triggered_by: triggeredBy,
      tables_included: ['profiles', 'students', 'professors', 'courses', 'grades', 'exams', 'generated_documents', 'audit_log'],
    }).select();

    if (error) throw error;

    // Simuler la fin de la sauvegarde (en production, un Edge Function le ferait)
    const backupId = data?.[0]?.id;
    if (backupId) {
      setTimeout(async () => {
        await supabase.from('backups').update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          file_size: Math.floor(Math.random() * 500000000) + 100000000,
          file_path: `backups/esgis_backup_${new Date().toISOString().split('T')[0]}.sql.gz`,
        }).eq('id', backupId);
      }, 5000);
    }

    return { data: data?.[0], error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/** Supprime une sauvegarde */
export const deleteBackup = async (backupId) => {
  try {
    const { error } = await supabase.from('backups').delete().eq('id', backupId);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
};

// ============================================================
// NOTIFICATION PREFERENCES
// ============================================================

/** Récupère les préférences de notification */
export const getNotificationPreferences = async (userId) => {
  try {
    const { data, error } = await supabase.from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return {
      data: data || {
        push_enabled: true, email_enabled: true, sms_enabled: false,
        email_digest: 'immediate', categories: {
          grades: true, exams: true, messages: true,
          announcements: true, documents: true, forums: true
        }
      },
      error: null
    };
  } catch (error) {
    return { data: null, error };
  }
};

/** Met à jour les préférences de notification */
export const updateNotificationPreferences = async (userId, prefs) => {
  try {
    const { data, error } = await supabase.from('notification_preferences')
      .upsert({ user_id: userId, ...prefs }, { onConflict: 'user_id' })
      .select();

    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// ============================================================
// CURRICULUM / MAQUETTES PÉDAGOGIQUES
// ============================================================

/** Récupère les maquettes pédagogiques */
export const getCurriculumTemplates = async (departmentId = null, levelCode = null) => {
  try {
    let query = supabase.from('curriculum_templates')
      .select('*, course:course_id(id, name, code, credits), department:department_id(id, name, code)')
      .order('semester_code').order('course_id');

    if (departmentId) query = query.eq('department_id', departmentId);
    if (levelCode) query = query.eq('level_code', levelCode);

    const { data, error } = await query;
    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error };
  }
};

/** Ajoute une matière à la maquette */
export const addCurriculumEntry = async (entry) => {
  try {
    const { data, error } = await supabase.from('curriculum_templates').insert(entry).select();
    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/** Supprime une entrée de maquette */
export const deleteCurriculumEntry = async (id) => {
  try {
    const { error } = await supabase.from('curriculum_templates').delete().eq('id', id);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
};

/** Met à jour une entrée de maquette */
export const updateCurriculumEntry = async (id, updates) => {
  try {
    const { error } = await supabase.from('curriculum_templates').update(updates).eq('id', id);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
};
