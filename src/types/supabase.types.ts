/**
 * Types générés à partir du schéma de base de données Supabase
 * Ces types représentent la structure exacte des tables dans la base de données
 */

export type Role = 'admin' | 'professor' | 'student';
export type ExamType = 'midterm' | 'final' | 'quiz';
export type ExamStatus = 'graded' | 'pending' | 'absent';
export type CourseStatus = 'passed' | 'failed' | 'pending';
export type RequestStatus = 'pending' | 'approved' | 'rejected';
export type RequestType = 'absence' | 'grade_review' | 'document' | 'other';
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

/**
 * Profil utilisateur
 */
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: Role;
  department_id: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Étudiant
 */
export interface Student {
  id: string;
  profile_id: string;
  student_id: string;
  student_number?: string;    // Ajout pour compatibilité avec le code existant
  enrollment_year: number;
  entry_year?: number;        // Ajout pour compatibilité avec le code existant
  current_year: number;
  level?: string;             // Ajout pour compatibilité avec le code existant
  department_id: number;
  created_at: string;
  updated_at: string;
  profile?: Profile;
  // Propriétés étendues utilisées dans l'application
  graduation_year?: string | number | null;
  specialization?: string | null;
  status?: 'active' | 'suspended' | 'graduated' | 'expelled';
}

/**
 * Professeur
 */
export interface Professor {
  id?: number | string;
  profile_id: string;
  employee_number: string;  // Renommé de professor_id pour correspondre au schéma de la BD
  hire_date: string;
  specialties?: string[];   // Renommé de specialty et adapté en tableau
  status?: string;
  department_id?: number;   // Rendu optionnel car pas dans le schéma de base
  created_at?: string;
  updated_at?: string;
  profile?: Profile;
}

/**
 * Département
 */
export interface Department {
  id: number;
  name: string;
  code: string;
  description: string | null;
  head_professor_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Cours
 */
export interface Course {
  id: number;
  code: string;
  name: string;
  description: string | null;
  department_id: number;
  academic_year: string;
  semester: number;
  created_at: string;
  updated_at: string;
}

/**
 * Attribution de cours à un professeur
 */
export interface ProfessorCourse {
  id: number;
  professor_id: string;
  course_id: number;
  is_main_professor: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Inscription d'un étudiant à un cours
 */
export interface StudentCourse {
  id: number;
  student_id: string;
  course_id: number;
  enrollment_date: string;
  status: CourseStatus;
  final_grade: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Session de cours
 */
export interface CourseSession {
  id: number;
  course_id: number;
  professor_id: string;
  date: string;
  start_time: string;
  end_time: string;
  room: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Présence à une session de cours
 */
export interface Attendance {
  id: number;
  session_id: number;
  student_id: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  comment: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Examen
 */
export interface Exam {
  id: number;
  title: string;
  course_id: number;
  professor_id: string;
  date: string;
  max_grade: number;
  weight: number;
  type: ExamType;
  description: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Résultat d'examen
 */
export interface ExamResult {
  id: number;
  exam_id: number;
  student_id: string;
  grade: number | null;
  comment: string | null;
  status: ExamStatus;
  created_at: string;
  updated_at: string;
  
  // Champs joints
  exam_title?: string;
  exam_type?: ExamType;
  exam_date?: string;
  exam_weight?: number;
  course_id?: number;
  course_name?: string;
  course_code?: string;
  max_grade?: number;
  semester?: number;
}

/**
 * Conversation de messagerie
 */
export interface Conversation {
  id: number | string;  // Accepte les deux formats pour compatibilité
  title: string | null;
  participant_ids: string[];
  created_by: string;
  last_message_id: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Message dans une conversation
 */
export interface Message {
  id: number;
  conversation_id: number | string;  // Accepte les deux formats pour compatibilité
  sender_id: string;
  content: string;
  file_url: string | null;
  read: boolean;
  created_at: string;
  updated_at?: string;
}

/**
 * Événement (calendrier)
 */
export interface Event {
  id: number;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  all_day: boolean;
  location: string | null;
  event_type: 'course' | 'exam' | 'deadline' | 'holiday' | 'other';
  created_by: string;
  course_id: number | null;
  exam_id: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Document
 */
export interface Document {
  id: number;
  title: string;
  description: string | null;
  file_url: string;
  document_type: 'syllabus' | 'assignment' | 'lecture_notes' | 'other';
  uploader_id: string;
  course_id: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Demande (absence, révision de note, etc.)
 */
export interface Request {
  id: number;
  requester_id: string;
  type: RequestType;
  title: string;
  description: string;
  status: RequestStatus;
  reviewer_id: string | null;
  review_comment: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Paiement
 */
export interface Payment {
  id: number;
  student_id: string;
  amount: number;
  currency: string;
  description: string;
  due_date: string;
  payment_date: string | null;
  status: PaymentStatus;
  payment_method: string | null;
  transaction_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Stage
 */
export interface Internship {
  id: number;
  student_id: string;
  company_name: string;
  position: string;
  supervisor_name: string;
  supervisor_email: string | null;
  start_date: string;
  end_date: string;
  description: string | null;
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled';
  grade: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Types étendus pour l'interface utilisateur
 */

/**
 * Conversation avec participants (pour l'affichage dans l'UI)
 */
export interface ConversationWithParticipants extends Omit<Conversation, 'last_message_id'> {
  last_message_id: number | null;
  participants: Profile[];
  last_message?: Message;
}

/**
 * Message avec expéditeur (pour l'affichage dans l'UI)
 */
export interface MessageWithSender extends Message {
  sender_name?: string | null;
  sender_avatar_url?: string | null;
  read_status?: string; // string pour compatibilité avec le backend
  file_url: string | null; // doit être toujours présent (jamais undefined)
}

/**
 * Résultat d'examen enrichi pour l'UI
 */
export interface ExamResultWithUI {
  id: number;
  exam_id: number;
  student_id: string;
  grade: number | null;
  comment: string | null;
  status: ExamStatus;
  created_at: string;
  updated_at: string;
  // Propriétés étendues pour l'affichage UI
  exam_title: string;
  exam_type: ExamType;
  exam_date: string;
  exam_weight: number;
  course_id: number;
  course_name: string;
  course_code: string;
  semester: number;
  credits: number;
  max_grade: number;
}

/**
 * Moyenne d'un cours (pour l'affichage dans l'UI)
 */
export interface CourseAverage {
  course_id: number;
  course_name: string;
  course_code: string;
  semester: number;
  average: number | null;
  status: CourseStatus;
}

/**
 * Moyenne semestrielle (pour l'affichage dans l'UI)
 */
export interface SemesterAverage {
  academic_year: string;
  semester: number;
  average: number | null;
  status: CourseStatus;
  total_credits: number;
  validated_credits: number;
}
