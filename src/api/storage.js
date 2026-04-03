/**
 * Service Storage — ESGIS Campus
 * Centralise les opérations sur Supabase Storage.
 */
import { supabase } from '../supabase';

/**
 * Upload un fichier dans un bucket.
 * @param {string} bucket - Nom du bucket
 * @param {string} path - Chemin dans le bucket
 * @param {Blob|ArrayBuffer|Uint8Array|File} data - Contenu du fichier
 * @param {Object} [options] - Options (upsert, contentType, etc.)
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export const uploadFile = async (bucket, path, data, options = {}) => {
  try {
    const { data: result, error } = await supabase.storage
      .from(bucket)
      .upload(path, data, options);

    return { data: result, error: error || null };
  } catch (error) {
    console.error('uploadFile:', error);
    return { data: null, error };
  }
};

/**
 * Télécharge un fichier depuis un bucket.
 * @param {string} bucket
 * @param {string} path
 * @returns {Promise<{ data: Blob|null, error: Error|null }>}
 */
export const downloadFile = async (bucket, path) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);

    return { data, error: error || null };
  } catch (error) {
    console.error('downloadFile:', error);
    return { data: null, error };
  }
};

/**
 * Retourne l'URL publique d'un fichier.
 * @param {string} bucket
 * @param {string} path
 * @returns {{ publicUrl: string|null }}
 */
export const getPublicUrl = (bucket, path) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { publicUrl: data?.publicUrl || null };
};

/**
 * Crée une URL signée (temporaire) pour un fichier.
 * @param {string} bucket
 * @param {string} path
 * @param {number} expiresIn - Durée en secondes
 * @returns {Promise<{ signedUrl: string|null, error: Error|null }>}
 */
export const createSignedUrl = async (bucket, path, expiresIn = 60) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    return { signedUrl: data?.signedUrl || null, error: error || null };
  } catch (error) {
    console.error('createSignedUrl:', error);
    return { signedUrl: null, error };
  }
};

/**
 * Supprime un ou plusieurs fichiers d'un bucket.
 * @param {string} bucket
 * @param {string[]} paths
 * @returns {Promise<{ error: Error|null }>}
 */
export const removeFiles = async (bucket, paths) => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove(paths);

    return { error: error || null };
  } catch (error) {
    console.error('removeFiles:', error);
    return { error };
  }
};
