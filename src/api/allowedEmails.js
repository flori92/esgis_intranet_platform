/**
 * API Emails Approuvés — Gestion des emails autorisés à se connecter
 * Permet à l'administration de pré-approuver les emails (Gmail, etc.)
 * des étudiants, professeurs et admins.
 */
import { supabase } from '../supabase';

/**
 * Vérifie si un email est approuvé pour la connexion
 * @param {string} email - Email à vérifier
 * @returns {Promise<{allowed: boolean, data: Object|null, error: Error|null}>}
 */
export const checkEmailAllowed = async (email) => {
  try {
    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabase
      .from('allowed_emails')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return {
      allowed: !!data,
      data,
      error: null,
    };
  } catch (error) {
    console.error('checkEmailAllowed:', error);
    return { allowed: false, data: null, error };
  }
};

/**
 * Récupère la liste de tous les emails approuvés
 * @param {Object} filters - Filtres optionnels
 * @param {string} filters.role - Filtrer par rôle
 * @param {string} filters.search - Recherche par email ou nom
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export const getAllowedEmails = async (filters = {}) => {
  try {
    let query = supabase
      .from('allowed_emails')
      .select('*, department:departments(id, name)')
      .order('created_at', { ascending: false });

    if (filters.role) {
      query = query.eq('role', filters.role);
    }

    if (filters.search) {
      const search = `%${filters.search}%`;
      query = query.or(`email.ilike.${search},full_name.ilike.${search}`);
    }

    if (filters.is_registered !== undefined) {
      query = query.eq('is_registered', filters.is_registered);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('getAllowedEmails:', error);
    return { data: [], error };
  }
};

/**
 * Ajoute un email à la liste des emails approuvés
 * @param {Object} emailData - Données de l'email
 * @param {string} emailData.email - Adresse email
 * @param {string} emailData.role - Rôle (student, professor, admin)
 * @param {string} emailData.full_name - Nom complet (optionnel)
 * @param {number} emailData.department_id - ID du département (optionnel)
 * @param {string} emailData.level - Niveau d'études (optionnel)
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const addAllowedEmail = async (emailData) => {
  try {
    const { data: session } = await supabase.auth.getSession();

    const normalizedData = {
      email: emailData.email.trim().toLowerCase(),
      role: emailData.role || 'student',
      full_name: emailData.full_name || null,
      department_id: emailData.department_id || null,
      level: emailData.level || null,
      added_by: session?.session?.user?.id || null,
      is_registered: false,
    };

    const { data, error } = await supabase
      .from('allowed_emails')
      .insert(normalizedData)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Cet email est déjà dans la liste des emails approuvés.');
      }
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('addAllowedEmail:', error);
    return { data: null, error };
  }
};

/**
 * Ajoute plusieurs emails en une fois (import en masse)
 * @param {Array<Object>} emails - Liste d'emails à ajouter
 * @returns {Promise<{success: Array, errors: Array}>}
 */
export const addAllowedEmailsBulk = async (emails) => {
  const results = { success: [], errors: [] };

  const { data: session } = await supabase.auth.getSession();
  const addedBy = session?.session?.user?.id || null;

  const normalizedEmails = emails.map((item) => ({
    email: item.email.trim().toLowerCase(),
    role: item.role || 'student',
    full_name: item.full_name || null,
    department_id: item.department_id || null,
    level: item.level || null,
    added_by: addedBy,
    is_registered: false,
  }));

  const { data, error } = await supabase
    .from('allowed_emails')
    .upsert(normalizedEmails, { onConflict: 'email', ignoreDuplicates: true })
    .select();

  if (error) {
    results.errors.push({ error: error.message });
  } else {
    results.success = data || [];
  }

  return results;
};

/**
 * Met à jour un email approuvé
 * @param {number} id - ID de l'entrée
 * @param {Object} updates - Données à mettre à jour
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const updateAllowedEmail = async (id, updates) => {
  try {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (updates.email) {
      updateData.email = updates.email.trim().toLowerCase();
    }

    const { data, error } = await supabase
      .from('allowed_emails')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('updateAllowedEmail:', error);
    return { data: null, error };
  }
};

/**
 * Supprime un email de la liste des emails approuvés
 * @param {number} id - ID de l'entrée
 * @returns {Promise<{error: Error|null}>}
 */
export const deleteAllowedEmail = async (id) => {
  try {
    const { error } = await supabase
      .from('allowed_emails')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('deleteAllowedEmail:', error);
    return { error };
  }
};

/**
 * Marque un email comme enregistré (après que l'utilisateur a créé son compte)
 * @param {string} email - Email à marquer
 * @returns {Promise<{error: Error|null}>}
 */
export const markEmailAsRegistered = async (email) => {
  try {
    const { error } = await supabase
      .from('allowed_emails')
      .update({
        is_registered: true,
        updated_at: new Date().toISOString(),
      })
      .eq('email', email.trim().toLowerCase());

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('markEmailAsRegistered:', error);
    return { error };
  }
};
