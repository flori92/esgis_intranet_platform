// Utilitaires partagés pour AuthContext

export const completedQuizzes = new Set<string>();

export interface ActiveStudent {
  id?: string;
  student_id: string;
  student_name: string;
  status: 'connected' | 'in_progress' | 'completed';
  cheating_attempts: number;
  connected_at: string;
  last_activity: string;
  has_completed?: boolean;
}

export const activeStudents: Record<string, ActiveStudent> = {};
