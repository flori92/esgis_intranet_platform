import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';
import {
  Profile,
  Student,
  Professor,
  Department,
  ExamResult,
  Role,
  ConversationWithParticipants,
  MessageWithSender
} from '../types/supabase.types';

// Récupération des variables d'environnement
// Utilisation d'une approche hybride qui fonctionne à la fois en développement et en production
const getSupabaseConfig = () => {
  // En priorité, utiliser les variables d'environnement Vite standard
  if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
    return {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string,
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string
    };
  }
  // Sinon, essayer de récupérer depuis window.ENV (défini dans env-config.js)
  if (typeof window !== 'undefined' && window.ENV) {
    return {
      supabaseUrl: window.ENV.SUPABASE_URL,
      supabaseAnonKey: window.ENV.SUPABASE_ANON_KEY
    };
  }
  // En production, lever une erreur claire
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Aucune configuration Supabase valide trouvée en production.');
  }
  // Valeurs par défaut pour le développement local
  return {
    supabaseUrl: 'http://localhost:54321',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  };
};

const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

// Vérification de la présence des variables d'environnement
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Les variables d\'environnement pour Supabase ne sont pas définies correctement.');
}

// Création du client Supabase avec gestion des erreurs et mécanismes de retry
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'intranet-esgis'
    }
  },
  // Configuration des retries en cas d'échec
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Type générique pour une fonction callback de changement
export type SupabaseCallback<T = any> = (payload: { new: T; old: T | null }) => void;

/**
 * Vérifie la connexion à Supabase
 * @returns {Promise<boolean>} true si la connexion est établie, false sinon
 */
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    // Tentative de requête simple pour vérifier la connexion
    // Utilisez une table qui existe réellement dans la base de données
    const { error } = await supabase.from('profiles').select('id').limit(1);
    
    if (error) {
      console.error('Erreur lors de la vérification de la connexion à Supabase:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Exception lors de la vérification de la connexion à Supabase:', err);
    return false;
  }
};

/**
 * Récupère le profil utilisateur complet avec les informations de rôle
 * @param userId ID de l'utilisateur
 * @returns Profil utilisateur avec informations de rôle
 */
export const getUserProfile = async (userId: string): Promise<Profile & {
  departments: Department | null;
  student_info: Student | null;
  professor_info: Professor | null;
}> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        departments(*),
        student_info:students!profiles_id_fkey(*),
        professor_info:professors!profiles_id_fkey(*)
      `)
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Erreur lors de la récupération du profil utilisateur:', error);
      throw error;
    }
    
    // Transformer le type string en type Role
    const validRole = (data.role === 'admin' || data.role === 'professor' || data.role === 'student') 
      ? data.role as Role 
      : 'student' as Role;

    // Retourner directement le nouveau profil avec le rôle correct
    return {
      ...data,
      role: validRole
    } as unknown as Profile & {
      departments: Department | null;
      student_info: Student | null;
      professor_info: Professor | null;
    };
  } catch (err) {
    console.error('Exception lors de la récupération du profil utilisateur:', err);
    throw err;
  }
};

/**
 * Met à jour le profil utilisateur
 * @param userId ID de l'utilisateur
 * @param updates Données à mettre à jour
 * @returns Profil mis à jour
 */
export const updateUserProfile = async (userId: string, updates: Partial<Profile>): Promise<Profile> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Erreur lors de la mise à jour du profil utilisateur:', error);
      throw error;
    }
    
    // Vérification et assertion de type pour garantir que data est du type Profile
    if (!data) {
      throw new Error('Profil mis à jour est incomplet ou invalide');
    }
    
    // Vérification de la structure des données et typage
    const profile = data as Profile;
    if (!profile.id) {
      throw new Error('Profil mis à jour ne contient pas d\'identifiant valide');
    }
    
    return profile;
  } catch (err) {
    console.error('Exception lors de la mise à jour du profil utilisateur:', err);
    throw err;
  }
};

/**
 * Télécharge un fichier vers Supabase Storage
 * @param bucket Nom du bucket
 * @param path Chemin du fichier
 * @param file Fichier à télécharger
 * @returns URL du fichier téléchargé
 */
export const uploadFile = async (bucket: string, path: string, file: File) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error('Erreur lors du téléchargement du fichier:', error);
      throw error;
    }
    
    // Récupérer l'URL publique du fichier
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);
    
    return publicUrl;
  } catch (err) {
    console.error('Exception lors du téléchargement du fichier:', err);
    throw err;
  }
};

/**
 * Supprime un fichier de Supabase Storage
 * @param bucket Nom du bucket
 * @param path Chemin du fichier
 */
export const deleteFile = async (bucket: string, path: string) => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    
    if (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
      throw error;
    }
    
    return true;
  } catch (err) {
    console.error('Exception lors de la suppression du fichier:', err);
    throw err;
  }
};

/**
 * S'abonne aux changements en temps réel sur une table
 * @param table Nom de la table
 * @param callback Fonction de callback appelée lors d'un changement
 * @returns Fonction pour se désabonner
 */
export const subscribeToChanges = <T>(table: string, callback: SupabaseCallback<T>) => {
  const subscription = supabase
    .channel(`public:${table}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table }, (payload: any) => {
      callback(payload);
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table }, (payload: any) => {
      callback(payload);
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table }, (payload: any) => {
      callback(payload);
    })
    .subscribe();
    
  return () => {
    subscription.unsubscribe();
  };
};

/**
 * Récupère les conversations d'un utilisateur avec leurs participants
 * @param userId ID de l'utilisateur
 * @returns Liste des conversations avec participants
 */
export const getUserConversations = async (userId: string): Promise<ConversationWithParticipants[]> => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .contains('participant_ids', [userId]);
    
    if (error) {
      console.error('Erreur lors de la récupération des conversations:', error);
      throw error;
    }
    
    return data as ConversationWithParticipants[];
  } catch (err) {
    console.error('Exception lors de la récupération des conversations:', err);
    throw err;
  }
};

/**
 * Récupère les messages d'une conversation
 * @param conversationId ID de la conversation
 * @returns Liste des messages
 */
export const getConversationMessages = async (conversationId: string | number): Promise<MessageWithSender[]> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', typeof conversationId === 'string' ? parseInt(conversationId, 10) : conversationId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Erreur lors de la récupération des messages:', error);
      throw error;
    }
    
    // Utiliser la fonction d'adaptation pour convertir les messages bruts
    if (!data) {
      return [];
    }
    
    // Récupérer les profils des expéditeurs
    const senderIds = [...new Set(data.map(m => m.sender_id))];
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', senderIds);
      
    if (profilesError) {
      console.error('Erreur lors de la récupération des profils:', profilesError);
      throw profilesError;
    }
    
    // Créer une Map pour les profils
    const profilesMap = new Map();
    if (profilesData) {
      profilesData.forEach(profile => {
        profilesMap.set(profile.id, profile);
      });
    }
    
    // Adapter les messages avec les informations du profil
    return data.map(msg => {
      const sender = profilesMap.get(msg.sender_id) || null;
      return {
        ...msg,
        sender,
        read_status: msg.read ? 'read' : 'unread',
        file_url: null // Ajoutez cette propriété si nécessaire dans le type MessageWithSender
      };
    });
  } catch (err) {
    console.error('Exception lors de la récupération des messages:', err);
    throw err;
  }
};

/**
 * Récupère les résultats d'examens d'un étudiant
 * @param studentId ID de l'étudiant
 * @returns Liste des résultats d'examens avec détails
 */
export const getStudentExamResults = async (studentId: number): Promise<ExamResult[]> => {
  try {
    const { data, error } = await supabase
      .from('exam_results')
      .select(`
        *,
        exams(*),
        exams.courses(*)
      `)
      .eq('student_id', studentId);
    
    if (error) {
      console.error('Erreur lors de la récupération des résultats d\'examens:', error);
      throw error;
    }
    
    return data as unknown as ExamResult[];
  } catch (err) {
    console.error('Exception lors de la récupération des résultats d\'examens:', err);
    throw err;
  }
};

/**
 * Met à jour le statut de lecture d'un message
 * Cette fonction est destinée à être appelée avant que la RPC soit disponible
 * @param conversationId ID de la conversation
 * @param userId ID de l'utilisateur
 * @returns Résultat de l'opération
 */
export const updateMessageReadStatus = async (conversationId: string | number, userId: string): Promise<{ success: boolean; updated: number }> => {
  // Récupérer tous les messages non lus de la conversation
  const { data: unreadMessages, error: fetchError } = await supabase
    .from('messages')
    .select('id')
    .eq('conversation_id', typeof conversationId === 'string' ? parseInt(conversationId, 10) : conversationId)
    .eq('read', false)
    .neq('sender_id', userId);

  if (fetchError) {
    console.error('Erreur lors de la récupération des messages non lus:', fetchError);
    throw new Error(`Erreur lors de la récupération des messages non lus: ${fetchError.message}`);
  }

  if (!unreadMessages || unreadMessages.length === 0) {
    return { success: true, updated: 0 };
  }

  // Mettre à jour le statut de lecture des messages
  const { error: updateError } = await supabase
    .from('messages')
    .update({ read: true })
    .in('id', unreadMessages.map(msg => msg.id));

  if (updateError) {
    console.error('Erreur lors de la mise à jour des statuts de lecture:', updateError);
    throw new Error(`Erreur lors de la mise à jour des statuts de lecture: ${updateError.message}`);
  }

  return { success: true, updated: unreadMessages.length };
};

export default supabase;
