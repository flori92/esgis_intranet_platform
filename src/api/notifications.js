import { supabase } from '../supabase';

const normalizeNotification = (row = {}) => ({
  id: row.id,
  title: row.title || 'Notification',
  content: row.content || '',
  message: row.content || '',
  priority: row.priority || 'medium',
  read: Boolean(row.read),
  recipient_id: row.recipient_id || null,
  recipient_role: row.recipient_role || null,
  sender_id: row.sender_id || null,
  created_at: row.created_at || null
});

const normalizeInsertPayload = (payload = {}) => ({
  recipient_id: payload.recipient_id ?? payload.userId ?? payload.user_id ?? null,
  recipient_role: payload.recipient_role ?? null,
  sender_id: payload.sender_id ?? null,
  title: payload.title ?? payload.titre ?? 'Notification',
  content: payload.content ?? payload.contenu ?? '',
  priority: payload.priority || 'medium',
  read: Boolean(payload.read)
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
      .select('id, title, content, priority, read, recipient_id, recipient_role, sender_id, created_at')
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

export const subscribeToNotifications = (profileId, onChange) => {
  if (!profileId) {
    return null;
  }

  return supabase
    .channel(`notifications:${profileId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${profileId}`
      },
      onChange
    )
    .subscribe();
};
