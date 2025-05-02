// Déclarations de types globales pour les modules externes

declare module 'react' {
  export interface FC<P = {}> {
    (props: P): JSX.Element | null;
  }
  
  export function createContext<T>(defaultValue: T): any;
  export function useContext<T>(context: any): T;
  export function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  
  export type ReactNode = any;
}

declare module 'react/jsx-runtime' {
  export namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
    type Element = any;
  }
}

declare module '@emailjs/browser' {
  export function init(publicKey: string): void;
  export function send(serviceId: string, templateId: string, templateParams: any): Promise<any>;
}

declare module 'react-hot-toast' {
  export function success(message: string, options?: any): string;
  export function error(message: string, options?: any): string;
  export function dismiss(toastId?: string): void;
  export const Toaster: React.FC;
  
  const toast: {
    success: typeof success;
    error: typeof error;
    dismiss: typeof dismiss;
  };
  
  export default toast;
}

declare module 'lucide-react' {
  export const Clock: any;
}

// Déclarations pour les contextes de l'application
declare module '../context/AuthContext' {
  export interface AuthState {
    currentUser: {
      id: string;
      name: string;
      role: string;
    } | null;
    isAuthenticated: boolean;
  }
  
  export interface AuthContextType {
    appState: AuthState;
    login: (id: string, name: string, role: string) => void;
    logout: () => void;
  }
  
  export function useAuth(): AuthContextType;
}

declare module '../context/QuizContext' {
  import { Question, QuizResult, QuizStatus, Timer } from '../types';
  
  export interface QuizContextType {
    questions: Question[];
    currentQuestionIndex: number;
    userAnswers: Record<string, number>;
    quizStatus: QuizStatus;
    cheatingAttempts: number;
    timer: Timer;
    quizResults: QuizResult[];
    startQuiz: () => void;
    endQuiz: () => void;
    answerQuestion: (questionId: string, answerIndex: number) => void;
    goToNextQuestion: () => void;
    goToPreviousQuestion: () => void;
    calculateScore: () => number;
    reportCheatingAttempt: () => void;
  }
  
  export function useQuiz(): QuizContextType;
}
