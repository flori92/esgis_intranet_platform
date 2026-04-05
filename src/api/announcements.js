/**
 * API Annonces ciblées — ESGIS Campus §5.8
 */
import { supabase } from '../supabase';

export const getAnnouncements = async (filters = {}) => {
  try {
    let query = supabase
      .from('announcements')
      .select(`
        id, title, content, target, priority, status,
        send_push, send_email, send_sms, views_count,
        published_at, created_at, updated_at,
        author:profiles!author_id(id, full_name)
      `)
      .order('created_at', { ascending: false });

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.onlyPublished) query = query.eq('status', 'published');
    const { data, error } = await query;
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getPublishedAnnouncements = async (userTarget = null) => {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select(`
        id, title, content, target, priority, views_count, published_at,
        author:profiles!author_id(id, full_name)
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(50);
    if (error) throw error;

    // Filtrer côté client par target si nécessaire
    let filtered = data || [];
    if (userTarget) {
      filtered = filtered.filter(a => {
        const targets = a.target || ['all'];
        return targets.includes('all') || targets.includes(userTarget);
      });
    }
    return { data: filtered, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const createAnnouncement = async (announcementData) => {
  try {
    const payload = {
      ...announcementData,
      published_at: announcementData.status === 'published' ? new Date().toISOString() : null,
    };
    const { data, error } = await supabase.from('announcements').insert(payload).select();
    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const updateAnnouncement = async (id, announcementData) => {
  try {
    const payload = { ...announcementData };
    if (announcementData.status === 'published' && !announcementData.published_at) {
      payload.published_at = new Date().toISOString();
    }
    const { data, error } = await supabase.from('announcements').update(payload).eq('id', id).select();
    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const deleteAnnouncement = async (id) => {
  try {
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
};

export const incrementViewCount = async (id) => {
  try {
    const { data: current } = await supabase.from('announcements').select('views_count').eq('id', id).single();
    await supabase.from('announcements').update({ views_count: (current?.views_count || 0) + 1 }).eq('id', id);
  } catch (error) {
    console.error('incrementViewCount:', error);
  }
};
