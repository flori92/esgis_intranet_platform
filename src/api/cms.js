import { supabase } from '../supabase';

/**
 * Get active hero banners, ordered by position.
 */
export const getCMSBanners = async () => {
  try {
    const { data, error } = await supabase
      .from('cms_banners')
      .select('*')
      .eq('is_active', true)
      .order('position', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error };
  }
};

/**
 * Get published news articles.
 */
export const getCMSNews = async (limit = 6) => {
  try {
    const { data, error } = await supabase
      .from('cms_news')
      .select('*')
      .eq('is_published', true)
      .order('position', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error };
  }
};

/**
 * Get published upcoming events.
 */
export const getCMSEvents = async (limit = 6) => {
  try {
    const { data, error } = await supabase
      .from('cms_events')
      .select('*')
      .eq('is_published', true)
      .gte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error };
  }
};

/**
 * Get published announcements.
 */
export const getCMSAnnouncements = async (limit = 5) => {
  try {
    const { data, error } = await supabase
      .from('cms_announcements')
      .select('*')
      .eq('is_published', true)
      .order('position', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error };
  }
};
