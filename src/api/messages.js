/**
 * Service Messagerie — ESGIS Campus
 * Centralise les opérations sur la table `messages` et les contacts.
 */
import { supabase } from '../supabase';

/**
 * Récupère les contacts disponibles pour un utilisateur.
 * @param {string} currentProfileId - ID du profil courant
 * @param {Object} options
 * @param {string[]} [options.roleFilter] - Rôles autorisés (ex. ['professor','admin'])
 * @returns {Promise<{ contacts: Array, error: Error|null }>}
 */
export const getContacts = async (currentProfileId, { roleFilter } = {}) => {
  try {
    let query = supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, role, is_active')
      .neq('id', currentProfileId)
      .eq('is_active', true)
      .order('full_name', { ascending: true });

    if (roleFilter?.length) {
      query = query.in('role', roleFilter);
    }

    const { data, error } = await query;

    if (error) {
      return { contacts: [], error };
    }

    return { contacts: data || [], error: null };
  } catch (error) {
    console.error('getContacts:', error);
    return { contacts: [], error };
  }
};

/**
 * Récupère les messages reçus ou envoyés.
 * @param {string} profileId - ID du profil
 * @param {'received'|'sent'} direction
 * @returns {Promise<{ messages: Array, error: Error|null }>}
 */
export const getMessages = async (profileId, direction = 'received') => {
  try {
    let query = supabase
      .from('messages')
      .select(`
        id,
        sender_id,
        recipient_id,
        subject,
        content,
        read,
        created_at,
        sender:sender_id(id, full_name, email, avatar_url, role),
        recipient:recipient_id(id, full_name, email, avatar_url, role)
      `)
      .order('created_at', { ascending: false });

    query = direction === 'received'
      ? query.eq('recipient_id', profileId)
      : query.eq('sender_id', profileId);

    const { data, error } = await query;

    if (error) {
      return { messages: [], error };
    }

    return { messages: data || [], error: null };
  } catch (error) {
    console.error('getMessages:', error);
    return { messages: [], error };
  }
};

/**
 * Marque un message comme lu.
 * @param {string} messageId
 * @returns {Promise<{ error: Error|null }>}
 */
export const markMessageAsRead = async (messageId) => {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('id', messageId);

    return { error: error || null };
  } catch (error) {
    console.error('markMessageAsRead:', error);
    return { error };
  }
};

/**
 * Envoie un nouveau message.
 * @param {Object} payload
 * @param {string} payload.sender_id
 * @param {string} payload.recipient_id
 * @param {string} payload.subject
 * @param {string} payload.content
 * @returns {Promise<{ error: Error|null }>}
 */
export const sendMessage = async ({ sender_id, recipient_id, subject, content }) => {
  try {
    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id,
        recipient_id,
        subject,
        content,
        read: false
      });

    return { error: error || null };
  } catch (error) {
    console.error('sendMessage:', error);
    return { error };
  }
};
