import { supabase } from '../supabase';

const normalizeNotification = (row = {}) => ({
  id: row.id,
  title: row.title || 'Notification',
  content: row.content || row.message || '',
  message: row.message || row.content || '',
  priority: row.priority || row.type || 'medium',
  type: row.type || row.priority || 'info',
  read: row.read ?? row.is_read ?? false,
  is_read: row.is_read ?? row.read ?? false,
  recipient_id: row.recipient_id || row.user_id || null,
  recipient_role: row.recipient_role || null,
  sender_id: row.sender_id || null,
  created_at: row.created_at || null
});

const normalizeInsertPayload = (payload = {}) => ({
  recipient_id: payload.recipient_id ?? payload.userId ?? payload.user_id ?? null,
  recipient_role: payload.recipient_role ?? null,
  sender_id: payload.sender_id ?? null,
  title: payload.title ?? payload.titre ?? 'Notification',
  content: payload.content ?? payload.message ?? payload.contenu ?? '',
  priority: payload.priority ?? payload.type ?? 'medium',
  read: Boolean(payload.read ?? payload.is_read)
});

const buildNotificationScope = (profileId, role) => {
  const filters = [];

  if (profileId) {
    filters.push(`recipient_id.eq.${profileId}`);
  }

  if (role) {
    filters.push(`recipient_role.eq.${role}`);
  }

  filters.push('recipient_role.eq.all');

  return filters.join(',');
};

export const getNotifications = async (profileId, role, options = {}) => {
  try {
    const { limit, unreadOnly = false } = options;

    let query = supabase
      .from('notifications')
      .select('*')
      .or(buildNotificationScope(profileId, role))
      .order('created_at', { ascending: false });

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { data: (data || []).map(normalizeNotification), error: null };
  } catch (error) {
    console.error('Erreur getNotifications:', error);
    return { data: null, error };
  }
};

export const createNotification = async (payload) => {
  try {
    const insertPayload = normalizeInsertPayload(payload);
    const { data, error } = await supabase
      .from('notifications')
      .insert(insertPayload)
      .select()
      .single();

    if (error) throw error;
    return { data: normalizeNotification(data), error: null };
  } catch (error) {
    console.error('Erreur createNotification:', error);
    return { data: null, error };
  }
};

export const createNotificationsBulk = async (payloads) => {
  try {
    const normalizedPayloads = (payloads || []).map(normalizeInsertPayload);
    const { data, error } = await supabase
      .from('notifications')
      .insert(normalizedPayloads)
      .select();

    if (error) throw error;
    return { data: (data || []).map(normalizeNotification), error: null };
  } catch (error) {
    console.error('Erreur createNotificationsBulk:', error);
    return { data: null, error };
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Erreur markNotificationAsRead:', error);
    return { error };
  }
};

export const markAllNotificationsAsRead = async (profileId, role) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .or(buildNotificationScope(profileId, role))
      .eq('read', false);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Erreur markAllNotificationsAsRead:', error);
    return { error };
  }
};

export const deleteNotification = async (notificationId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Erreur deleteNotification:', error);
    return { error };
  }
};

export const deleteReadNotifications = async (profileId, role) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .or(buildNotificationScope(profileId, role))
      .eq('read', true);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Erreur deleteReadNotifications:', error);
    return { error };
  }
};

export const subscribeToNotifications = (profileId, role, onChange) => {
  if (!profileId) {
    return null;
  }

  // On crée un canal unique pour l'utilisateur
  // Note: Supabase Realtime ne supporte pas encore les filtres complexes OR en mode 'filter'
  // On écoute donc tous les changements de la table notifications et on filtre côté client si nécessaire,
  // ou on s'abonne plus largement.
  return supabase
    .channel(`notifications-live-${profileId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      },
      (payload) => {
        const newNotif = payload.new;
        // Filtrage côté client pour s'assurer que la notification concerne l'utilisateur
        if (
          newNotif.recipient_id === profileId || 
          newNotif.recipient_role === role || 
          newNotif.recipient_role === 'all'
        ) {
          onChange(payload);
        }
      }
    )
    .subscribe();
};
