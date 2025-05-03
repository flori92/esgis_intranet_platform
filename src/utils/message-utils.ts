/**
 * Utilitaires pour la gestion des messages
 * 
 * Ce fichier contient des fonctions utilitaires pour la gestion des messages
 * et des conversations dans l'application.
 */

import { supabase } from '../utils/supabase';
import { Message } from '../types/supabase.types';

/**
 * Met à jour l'état de lecture des messages d'une conversation
 * @param conversationId ID de la conversation
 * @param userId ID de l'utilisateur qui lit les messages
 * @returns Résultat de l'opération
 */
export const updateMessageReadStatus = async (conversationId: string, userId: string) => {
  // Récupérer tous les messages non lus de la conversation
  const { data: unreadMessages, error: fetchError } = await supabase
    .from('messages')
    .select('id')
    .eq('conversation_id', conversationId)
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

/**
 * Formate la date d'un message pour l'affichage
 * @param timestamp Date au format ISO string
 * @returns Date formatée pour l'affichage
 */
export const formatMessageDate = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Trie les messages par date
 * @param messages Liste des messages à trier
 * @returns Liste des messages triés par date
 */
export const sortMessagesByDate = (messages: Message[]): Message[] => {
  return [...messages].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return dateA - dateB;
  });
};
