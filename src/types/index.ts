export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

export interface Student {
  id: string;
  name: string;
  email?: string;
}

export interface QuizResult {
  studentId: string;
  studentName: string;
  score: number;
  maxScore: number;
  answers: Record<string, number>;
  cheatingAttempts: number;
  completedAt: string;
}

export interface AppState {
  currentUser: Student | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
}

export enum QuizStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED"
}

export interface Timer {
  minutes: number;
  seconds: number;
}