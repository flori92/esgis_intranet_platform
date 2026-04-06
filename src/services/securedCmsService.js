import { supabase } from '@/supabase';
import { cmsPermissionsService } from './cmsPermissionsService';
import { eventsService, newsService, announcementsService, bannersService } from './cmsService';

/**
 * Service de sécurité CMS - vérifie les permissions avant chaque opération
 */

/**
 * Vérifier si l'utilisateur a accès aux fonctions CMS
 */
async function checkAccess(userId, module = 'all') {
  if (!userId) {
    throw new Error('Non authentifié');
  }

  const hasAccess = await cmsPermissionsService.hasPermission(
    userId,
    'editor',
    module
  );

  if (!hasAccess) {
    throw new Error(`Accès refusé au module ${module}`);
  }
}

/**
 * Services CMS sécurisés - avec vérification de permissions
 */
export const securedEventsService = {
  // READ - aucune permission requise
  async getPublished() {
    return eventsService.getPublished();
  },

  // READ - aucune permission requise
  async getAll() {
    return eventsService.getAll();
  },

  // READ - aucune permission requise
  async getById(id) {
    return eventsService.getById(id);
  },

  // WRITE - permission requise
  async create(event) {
    const { data: user } = await supabase.auth.getUser();
    await checkAccess(user.user?.id, 'events');

    const result = await eventsService.create(event);

    // Log l'action
    await cmsPermissionsService.logAction(
      user.user?.id,
      'create',
      'cms_events',
      result.id,
      event.title
    );

    return result;
  },

  // WRITE - permission requise
  async update(id, updates) {
    const { data: user } = await supabase.auth.getUser();
    await checkAccess(user.user?.id, 'events');

    const result = await eventsService.update(id, updates);

    // Log l'action
    await cmsPermissionsService.logAction(user.user?.id, 'update', 'cms_events', id);

    return result;
  },

  // WRITE - permission requise
  async delete(id) {
    const { data: user } = await supabase.auth.getUser();
    await checkAccess(user.user?.id, 'events');

    await eventsService.delete(id);

    // Log l'action
    await cmsPermissionsService.logAction(user.user?.id, 'delete', 'cms_events', id);
  },

  async reorder(items) {
    const { data: user } = await supabase.auth.getUser();
    await checkAccess(user.user?.id, 'events');

    await eventsService.reorder(items);

    // Log l'action
    await cmsPermissionsService.logAction(user.user?.id, 'reorder', 'cms_events');
  }
};

export const securedNewsService = {
  // READ - aucune permission requise
  async getPublished() {
    return newsService.getPublished();
  },

  async getFeatured() {
    return newsService.getFeatured();
  },

  async getAll() {
    return newsService.getAll();
  },

  async getById(id) {
    return newsService.getById(id);
  },

  // WRITE - permission requise
  async create(news) {
    const { data: user } = await supabase.auth.getUser();
    await checkAccess(user.user?.id, 'news');

    const result = await newsService.create(news);

    await cmsPermissionsService.logAction(
      user.user?.id,
      'create',
      'cms_news',
      result.id,
      news.title
    );

    return result;
  },

  async update(id, updates) {
    const { data: user } = await supabase.auth.getUser();
    await checkAccess(user.user?.id, 'news');

    const result = await newsService.update(id, updates);

    await cmsPermissionsService.logAction(user.user?.id, 'update', 'cms_news', id);

    return result;
  },

  async delete(id) {
    const { data: user } = await supabase.auth.getUser();
    await checkAccess(user.user?.id, 'news');

    await newsService.delete(id);

    await cmsPermissionsService.logAction(user.user?.id, 'delete', 'cms_news', id);
  },

  async reorder(items) {
    const { data: user } = await supabase.auth.getUser();
    await checkAccess(user.user?.id, 'news');

    await newsService.reorder(items);

    await cmsPermissionsService.logAction(user.user?.id, 'reorder', 'cms_news');
  }
};

export const securedAnnouncementsService = {
  // READ - aucune permission requise
  async getPublished() {
    return announcementsService.getPublished();
  },

  async getAll() {
    return announcementsService.getAll();
  },

  async getById(id) {
    return announcementsService.getById(id);
  },

  // WRITE - permission requise
  async create(announcement) {
    const { data: user } = await supabase.auth.getUser();
    await checkAccess(user.user?.id, 'announcements');

    const result = await announcementsService.create(announcement);

    await cmsPermissionsService.logAction(
      user.user?.id,
      'create',
      'cms_announcements',
      result.id,
      announcement.title
    );

    return result;
  },

  async update(id, updates) {
    const { data: user } = await supabase.auth.getUser();
    await checkAccess(user.user?.id, 'announcements');

    const result = await announcementsService.update(id, updates);

    await cmsPermissionsService.logAction(user.user?.id, 'update', 'cms_announcements', id);

    return result;
  },

  async delete(id) {
    const { data: user } = await supabase.auth.getUser();
    await checkAccess(user.user?.id, 'announcements');

    await announcementsService.delete(id);

    await cmsPermissionsService.logAction(user.user?.id, 'delete', 'cms_announcements', id);
  },

  async reorder(items) {
    const { data: user } = await supabase.auth.getUser();
    await checkAccess(user.user?.id, 'announcements');

    await announcementsService.reorder(items);

    await cmsPermissionsService.logAction(user.user?.id, 'reorder', 'cms_announcements');
  }
};

export const securedBannersService = {
  // READ - aucune permission requise
  async getActive() {
    return bannersService.getActive();
  },

  async getAll() {
    return bannersService.getAll();
  },

  async getById(id) {
    return bannersService.getById(id);
  },

  // WRITE - permission requise
  async create(banner) {
    const { data: user } = await supabase.auth.getUser();
    await checkAccess(user.user?.id, 'banners');

    const result = await bannersService.create(banner);

    await cmsPermissionsService.logAction(
      user.user?.id,
      'create',
      'cms_banners',
      result.id,
      banner.title
    );

    return result;
  },

  async update(id, updates) {
    const { data: user } = await supabase.auth.getUser();
    await checkAccess(user.user?.id, 'banners');

    const result = await bannersService.update(id, updates);

    await cmsPermissionsService.logAction(user.user?.id, 'update', 'cms_banners', id);

    return result;
  },

  async delete(id) {
    const { data: user } = await supabase.auth.getUser();
    await checkAccess(user.user?.id, 'banners');

    await bannersService.delete(id);

    await cmsPermissionsService.logAction(user.user?.id, 'delete', 'cms_banners', id);
  },

  async reorder(items) {
    const { data: user } = await supabase.auth.getUser();
    await checkAccess(user.user?.id, 'banners');

    await bannersService.reorder(items);

    await cmsPermissionsService.logAction(user.user?.id, 'reorder', 'cms_banners');
  }
};

/**
 * Fonction utilitaire pour vérifier les permissions
 */
export async function checkCMSPermission(userId, module = 'all') {
  return cmsPermissionsService.hasPermission(userId, 'editor', module);
}
