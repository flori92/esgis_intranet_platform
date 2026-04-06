import { supabase } from '@/supabase';

/**
 * Service pour gérer les événements du CMS
 */
export const eventsService = {
  /**
   * Récupère tous les événements publiés pour le dashboard
   */
  async getPublished() {
    const { data, error } = await supabase
      .from('cms_events')
      .select('*')
      .eq('is_published', true)
      .gte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true })
      .limit(10);
    
    if (error) throw error;
    return data || [];
  },

  /**
   * Récupère tous les événements (admin)
   */
  async getAll() {
    const { data, error } = await supabase
      .from('cms_events')
      .select('*')
      .order('position', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  /**
   * Récupère un événement par ID
   */
  async getById(id) {
    const { data, error } = await supabase
      .from('cms_events')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Crée un nouvel événement
   */
  async create(event) {
    const { data, error } = await supabase
      .from('cms_events')
      .insert([{
        ...event,
        created_by: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Met à jour un événement
   */
  async update(id, updates) {
    const { data, error } = await supabase
      .from('cms_events')
      .update({
        ...updates,
        updated_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Supprime un événement
   */
  async delete(id) {
    const { error } = await supabase
      .from('cms_events')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  /**
   * Réordonne les événements
   */
  async reorder(items) {
    const updates = items.map((item, index) => ({
      id: item.id,
      position: index
    }));

    const { error } = await supabase
      .from('cms_events')
      .upsert(updates);
    
    if (error) throw error;
  }
};

/**
 * Service pour gérer les actualités du CMS
 */
export const newsService = {
  /**
   * Récupère toutes les actualités publiées
   */
  async getPublished() {
    const { data, error } = await supabase
      .from('cms_news')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    return data || [];
  },

  /**
   * Récupère les actualités mises en avant
   */
  async getFeatured() {
    const { data, error } = await supabase
      .from('cms_news')
      .select('*')
      .eq('is_published', true)
      .eq('is_featured', true)
      .order('published_at', { ascending: false })
      .limit(5);
    
    if (error) throw error;
    return data || [];
  },

  /**
   * Récupère toutes les actualités (admin)
   */
  async getAll() {
    const { data, error } = await supabase
      .from('cms_news')
      .select('*')
      .order('position', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  /**
   * Récupère une actualité par ID
   */
  async getById(id) {
    const { data, error } = await supabase
      .from('cms_news')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Crée une nouvelle actualité
   */
  async create(news) {
    const { data, error } = await supabase
      .from('cms_news')
      .insert([{
        ...news,
        created_by: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Met à jour une actualité
   */
  async update(id, updates) {
    const { data, error } = await supabase
      .from('cms_news')
      .update({
        ...updates,
        updated_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Supprime une actualité
   */
  async delete(id) {
    const { error } = await supabase
      .from('cms_news')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  /**
   * Réordonne les actualités
   */
  async reorder(items) {
    const updates = items.map((item, index) => ({
      id: item.id,
      position: index
    }));

    const { error } = await supabase
      .from('cms_news')
      .upsert(updates);
    
    if (error) throw error;
  }
};

/**
 * Service pour gérer les annonces du CMS
 */
export const announcementsService = {
  /**
   * Récupère toutes les annonces publiées
   */
  async getPublished() {
    const { data, error } = await supabase
      .from('cms_announcements')
      .select('*')
      .eq('is_published', true)
      .order('position', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  /**
   * Récupère toutes les annonces (admin)
   */
  async getAll() {
    const { data, error } = await supabase
      .from('cms_announcements')
      .select('*')
      .order('position', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  /**
   * Récupère une annonce par ID
   */
  async getById(id) {
    const { data, error } = await supabase
      .from('cms_announcements')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Crée une nouvelle annonce
   */
  async create(announcement) {
    const { data, error } = await supabase
      .from('cms_announcements')
      .insert([{
        ...announcement,
        created_by: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Met à jour une annonce
   */
  async update(id, updates) {
    const { data, error } = await supabase
      .from('cms_announcements')
      .update({
        ...updates,
        updated_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Supprime une annonce
   */
  async delete(id) {
    const { error } = await supabase
      .from('cms_announcements')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  /**
   * Réordonne les annonces
   */
  async reorder(items) {
    const updates = items.map((item, index) => ({
      id: item.id,
      position: index
    }));

    const { error } = await supabase
      .from('cms_announcements')
      .upsert(updates);
    
    if (error) throw error;
  }
};

/**
 * Service pour gérer les bannières du CMS
 */
export const bannersService = {
  /**
   * Récupère toutes les bannières actives
   */
  async getActive() {
    const { data, error } = await supabase
      .from('cms_banners')
      .select('*')
      .eq('is_active', true)
      .order('position', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  /**
   * Récupère toutes les bannières (admin)
   */
  async getAll() {
    const { data, error } = await supabase
      .from('cms_banners')
      .select('*')
      .order('position', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  /**
   * Récupère une bannière par ID
   */
  async getById(id) {
    const { data, error } = await supabase
      .from('cms_banners')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Crée une nouvelle bannière
   */
  async create(banner) {
    const { data, error } = await supabase
      .from('cms_banners')
      .insert([{
        ...banner,
        created_by: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Met à jour une bannière
   */
  async update(id, updates) {
    const { data, error } = await supabase
      .from('cms_banners')
      .update({
        ...updates,
        updated_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Supprime une bannière
   */
  async delete(id) {
    const { error } = await supabase
      .from('cms_banners')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  /**
   * Réordonne les bannières
   */
  async reorder(items) {
    const updates = items.map((item, index) => ({
      id: item.id,
      position: index
    }));

    const { error } = await supabase
      .from('cms_banners')
      .upsert(updates);
    
    if (error) throw error;
  }
};
