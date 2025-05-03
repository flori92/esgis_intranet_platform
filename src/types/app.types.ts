import { Database } from './database.types';

// Types pour les profils utilisateurs
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

// Types pour les étudiants
export type Student = Database['public']['Tables']['students']['Row'];
export type StudentInsert = Database['public']['Tables']['students']['Insert'];
export type StudentUpdate = Database['public']['Tables']['students']['Update'];

// Types pour les professeurs
export type Professor = Database['public']['Tables']['professors']['Row'];
export type ProfessorInsert = Database['public']['Tables']['professors']['Insert'];
export type ProfessorUpdate = Database['public']['Tables']['professors']['Update'];

// Types pour les départements
export type Department = Database['public']['Tables']['departments']['Row'];
export type DepartmentInsert = Database['public']['Tables']['departments']['Insert'];
export type DepartmentUpdate = Database['public']['Tables']['departments']['Update'];

// Types pour les cours
export type Course = Database['public']['Tables']['courses']['Row'];
export type CourseInsert = Database['public']['Tables']['courses']['Insert'];
export type CourseUpdate = Database['public']['Tables']['courses']['Update'];

// Types pour les sessions de cours
export type CourseSession = Database['public']['Tables']['course_sessions']['Row'];
export type CourseSessionInsert = Database['public']['Tables']['course_sessions']['Insert'];
export type CourseSessionUpdate = Database['public']['Tables']['course_sessions']['Update'];

// Types pour les examens
export type Exam = Database['public']['Tables']['exams']['Row'];
export type ExamInsert = Database['public']['Tables']['exams']['Insert'];
export type ExamUpdate = Database['public']['Tables']['exams']['Update'];

// Types pour les résultats d'examens
export type ExamResult = Database['public']['Tables']['exam_results']['Row'];
export type ExamResultInsert = Database['public']['Tables']['exam_results']['Insert'];
export type ExamResultUpdate = Database['public']['Tables']['exam_results']['Update'];

// Types pour les documents
export type Document = Database['public']['Tables']['documents']['Row'];
export type DocumentInsert = Database['public']['Tables']['documents']['Insert'];
export type DocumentUpdate = Database['public']['Tables']['documents']['Update'];

// Types pour les messages
export type Message = Database['public']['Tables']['messages']['Row'];
export type MessageInsert = Database['public']['Tables']['messages']['Insert'];
export type MessageUpdate = Database['public']['Tables']['messages']['Update'];

// Types pour les conversations
export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type ConversationInsert = Database['public']['Tables']['conversations']['Insert'];
export type ConversationUpdate = Database['public']['Tables']['conversations']['Update'];

// Types pour les participants aux conversations
export type ConversationParticipant = Database['public']['Tables']['conversation_participants']['Row'];
export type ConversationParticipantInsert = Database['public']['Tables']['conversation_participants']['Insert'];
export type ConversationParticipantUpdate = Database['public']['Tables']['conversation_participants']['Update'];

// Types pour les notifications
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update'];

// Types pour les événements
export type Event = Database['public']['Tables']['events']['Row'];
export type EventInsert = Database['public']['Tables']['events']['Insert'];
export type EventUpdate = Database['public']['Tables']['events']['Update'];

// Types pour les demandes
export type Request = Database['public']['Tables']['requests']['Row'];
export type RequestInsert = Database['public']['Tables']['requests']['Insert'];
export type RequestUpdate = Database['public']['Tables']['requests']['Update'];

// Types pour les paiements
export type Payment = Database['public']['Tables']['payments']['Row'];
export type PaymentInsert = Database['public']['Tables']['payments']['Insert'];
export type PaymentUpdate = Database['public']['Tables']['payments']['Update'];

// Types personnalisés pour l'application
export interface UserWithProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: 'admin' | 'professor' | 'student';
  department_id?: number;
  is_active: boolean;
}

export interface CourseSessionWithDetails {
  id: number;
  course: {
    id: number;
    name: string;
    code: string;
  };
  professor: {
    id: number;
    name: string;
  };
  date: Date;
  duration: number;
  room: string | null;
  status: string;
}

export interface ExamWithDetails {
  id: number;
  name: string;
  date: Date;
  course: {
    id: number;
    name: string;
    code: string;
  };
  grade?: number;
  status: string;
}

export interface ConversationWithParticipants extends Conversation {
  participants: {
    id: string;
    full_name: string;
    avatar_url?: string;
  }[];
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
    read: boolean;
  };
  unread_count: number;
}

export interface MessageWithSender extends Message {
  sender: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface DocumentWithDetails extends Document {
  uploader: {
    id: string;
    full_name: string;
  };
  course?: {
    id: number;
    name: string;
    code: string;
  };
}

export interface NotificationWithDetails extends Notification {
  created_at_formatted: string;
}
