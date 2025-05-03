/**
 * Utilitaires pour adapter les données Supabase aux structures attendues par les composants React
 * 
 * Ces fonctions permettent de convertir les données brutes de Supabase en structures
 * compatibles avec les interfaces utilisées dans les composants de l'application.
 */

import {
  MessageWithSender,
  ConversationWithParticipants,
  ExamResult,
  ExamType,
  Profile
} from '../types/supabase.types';

/**
 * Interface étendue pour les résultats d'examens adaptés pour les composants UI
 */
export interface ExamResultWithUI {
  id: number;
  exam_id: number;
  student_id: string;
  grade: number | null;
  comment: string | null;
  status: 'graded' | 'pending' | 'absent';
  created_at: string;
  updated_at: string;
  // Propriétés étendues pour les composants
  exam_title: string;
  exam_type: ExamType;
  exam_date: string;
  exam_weight: number;
  course_id: number;
  course_name: string;
  course_code: string;
  max_grade: number;
  semester: number;
  credits: number;
  average?: number | null;
}

/**
 * Adapte un message brut de Supabase au format attendu par les composants
 * @param raw Message brut de Supabase
 * @returns Message adapté avec les informations de l'expéditeur
 */
export function adaptMessage(raw: Record<string, unknown>): MessageWithSender {
  return {
    id: raw.id as number, // number selon Message
    conversation_id: raw.conversation_id as number, // number selon Message
    sender_id: raw.sender_id as string, // string selon Message
    content: (raw.content as string) || '',
    read: Boolean(raw.read),
    created_at: raw.created_at as string,
    file_url: (raw.file_url as string) ?? null,
    sender_name: (raw.sender_name as string) ?? null,
    sender_avatar_url: (raw.sender_avatar_url as string) ?? null,
    read_status: typeof raw.read_status === 'string' ? (raw.read_status as string) : String(raw.read_status ?? ''),
  };
}

/**
 * Adapte une conversation brute de Supabase au format attendu par les composants
 * @param raw Conversation brute de Supabase
 * @returns Conversation adaptée avec les informations des participants
 */
export function adaptConversation(raw: Record<string, unknown>): ConversationWithParticipants {
  // Récupérer les participants ou définir un tableau vide par défaut
  const participants = Array.isArray(raw.participants) 
    ? raw.participants as Profile[] 
    : [] as Profile[];

  return {
    id: raw.id as number, // number selon Conversation
    title: (raw.title as string) ?? null,
    participant_ids: Array.isArray(raw.participant_ids) ? (raw.participant_ids as string[]) : [],
    created_by: raw.created_by as string, // string selon Conversation
    last_message_id: raw.last_message_id === undefined ? null : (raw.last_message_id as number | null),
    created_at: raw.created_at as string,
    updated_at: raw.updated_at as string,
    participants: participants, // Ajout de la propriété participants manquante
  };
}

/**
 * Adapte un résultat d'examen brut de Supabase au format attendu par les composants
 * @param result Résultat d'examen brut de Supabase
 * @returns Résultat d'examen avec informations sur l'examen et le cours
 */
export function adaptExamResult(raw: ExamResult): ExamResultWithUI {
  // Récupérer les données de l'examen de manière sécurisée
  const examType = raw.exam_type || 'midterm';
  
  // Déterminer le type d'examen de manière sécurisée
  let exam_type: ExamType = 'midterm';
  if (typeof examType === 'string' && ['midterm', 'final', 'quiz'].includes(examType)) {
    exam_type = examType as ExamType;
  }

  return {
    id: raw.id || 0,
    exam_id: raw.exam_id || 0,
    student_id: raw.student_id || '',
    grade: raw.grade || null,
    comment: raw.comment || null,
    status: raw.status || 'pending',
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at || new Date().toISOString(),
    exam_title: raw.exam_title || '',
    exam_type,
    exam_date: raw.exam_date || '',
    exam_weight: raw.exam_weight || 1,
    course_id: raw.course_id || 0,
    course_name: raw.course_name || '',
    course_code: raw.course_code || '',
    max_grade: raw.max_grade || 100,
    semester: raw.semester || 1,
    credits: 0, // Valeur par défaut pour le nombre de crédits
  };
}

/**
 * Formate la date d'un message pour l'affichage
 * @param dateString Date au format ISO string
 * @returns Date formatée pour l'affichage
 */
export const formatMessageDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Si c'est aujourd'hui, afficher seulement l'heure
  if (date.toDateString() === now.toDateString()) {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
  
  // Si c'est hier, afficher "Hier" et l'heure
  if (date.toDateString() === yesterday.toDateString()) {
    return `Hier, ${new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)}`;
  }
  
  // Sinon, afficher la date complète
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

/**
 * Fonction utilitaire pour extraire les données en toute sécurité
 * @param obj Objet à extraire
 * @param key Clé à extraire
 * @param defaultValue Valeur par défaut
 * @returns Valeur extraite ou valeur par défaut
 */
export const safeGet = <T>(obj: unknown, key: string, defaultValue: T): T => {
  if (!obj || typeof obj !== 'object') return defaultValue;
  return (obj as any)[key] as T ?? defaultValue;
};
