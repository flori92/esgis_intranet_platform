import { supabase } from '../supabase';

const sanitizeString = (value) => {
  if (typeof value !== 'string') {
    return value ?? null;
  }

  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

const splitFullName = (fullName = '') => {
  const trimmed = fullName.trim();

  if (!trimmed) {
    return { first_name: '', last_name: '' };
  }

  const [firstName, ...rest] = trimmed.split(/\s+/);
  return {
    first_name: firstName || '',
    last_name: rest.join(' ')
  };
};

/**
 * Récupère un profil par son ID (toutes colonnes, maybeSingle).
 * Utilisé principalement par le hook d'authentification.
 * @param {string} profileId
 * @returns {Promise<{ profile: Object|null, error: Error|null }>}
 */
export const getProfileById = async (profileId) => {
  try {
    if (!profileId) {
      return { profile: null, error: new Error('Identifiant de profil manquant') };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .maybeSingle();

    if (error) {
      return { profile: null, error };
    }

    return { profile: data, error: null };
  } catch (error) {
    return { profile: null, error };
  }
};

export const syncAuthenticatedProfile = async (defaults = {}) => {
  try {
    const { data, error } = await supabase.rpc('sync_auth_profile', {
      p_full_name: sanitizeString(defaults.full_name),
      p_role: sanitizeString(defaults.role),
      p_department_id: defaults.department_id ?? null
    });

    if (error) {
      return { profile: null, error };
    }

    const profile = Array.isArray(data) ? data[0] || null : data || null;
    return { profile, error: null };
  } catch (error) {
    return { profile: null, error };
  }
};

export const getProfileSettings = async (profileId) => {
  try {
    if (!profileId) {
      return { profile: null, error: new Error('Identifiant de profil manquant') };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        avatar_url,
        role,
        phone,
        address,
        bio,
        birth_date,
        secondary_email,
        cv_url,
        notification_preferences,
        language,
        first_name,
        last_name
      `)
      .eq('id', profileId)
      .single();

    if (error) {
      return { profile: null, error };
    }

    const nameParts = splitFullName(data.full_name);

    return {
      profile: {
        ...data,
        first_name: data.first_name || nameParts.first_name,
        last_name: data.last_name || nameParts.last_name,
        notification_preferences: data.notification_preferences || {},
        language: data.language || 'fr'
      },
      error: null
    };
  } catch (error) {
    console.error('Erreur lors du chargement du profil détaillé:', error);
    return { profile: null, error };
  }
};

export const uploadProfileAvatar = async (profileId, file) => {
  try {
    if (!profileId || !file) {
      return { url: null, error: new Error('Photo de profil manquante') };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `avatars/${profileId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      return { url: null, error: uploadError };
    }

    const { data } = supabase.storage.from('profiles').getPublicUrl(fileName);
    return { url: data?.publicUrl || null, error: null };
  } catch (error) {
    console.error('Erreur lors du téléversement de la photo de profil:', error);
    return { url: null, error };
  }
};

export const uploadStudentCv = async (profileId, file) => {
  try {
    if (!profileId || !file) {
      return { url: null, error: new Error('CV manquant') };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `cv/${profileId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      return { url: null, error: uploadError };
    }

    const { data } = supabase.storage.from('documents').getPublicUrl(fileName);
    return { url: data?.publicUrl || null, error: null };
  } catch (error) {
    console.error('Erreur lors du téléversement du CV:', error);
    return { url: null, error };
  }
};

export const updateProfileSettings = async (profileId, updates) => {
  try {
    if (!profileId) {
      return { profile: null, error: new Error('Identifiant de profil manquant') };
    }

    const firstName = updates.first_name ?? '';
    const lastName = updates.last_name ?? '';
    const fullName = [firstName, lastName].map((value) => (value || '').trim()).filter(Boolean).join(' ').trim();

    const payload = {
      first_name: sanitizeString(firstName) || '',
      last_name: sanitizeString(lastName) || '',
      full_name: fullName || updates.full_name || 'Utilisateur ESGIS',
      phone: sanitizeString(updates.phone),
      address: sanitizeString(updates.address),
      bio: sanitizeString(updates.bio),
      birth_date: sanitizeString(updates.birth_date),
      secondary_email: sanitizeString(updates.secondary_email),
      avatar_url: sanitizeString(updates.avatar_url),
      cv_url: sanitizeString(updates.cv_url),
      notification_preferences: updates.notification_preferences || {},
      language: sanitizeString(updates.language) || 'fr',
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', profileId)
      .select(`
        id,
        email,
        full_name,
        avatar_url,
        role,
        phone,
        address,
        bio,
        birth_date,
        secondary_email,
        cv_url,
        notification_preferences,
        language,
        first_name,
        last_name
      `)
      .single();

    if (error) {
      return { profile: null, error };
    }

    return { profile: data, error: null };
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil détaillé:', error);
    return { profile: null, error };
  }
};

/**
 * Mise à jour directe du profil (sans transformation de champs).
 * Utile pour les pages qui envoient des colonnes brutes (préférences, etc.).
 * @param {string} profileId
 * @param {Object} updates
 * @returns {Promise<{ error: Error|null }>}
 */
export const updateProfileDirect = async (profileId, updates) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profileId);

    return { error: error || null };
  } catch (error) {
    console.error('updateProfileDirect:', error);
    return { error };
  }
};

export const updateCurrentUserPassword = async (newPassword) => {
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { success: !error, error };
  } catch (error) {
    console.error('Erreur lors de la modification du mot de passe:', error);
    return { success: false, error };
  }
};
