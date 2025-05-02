import React, { createContext, useContext, useState, ReactNode } from "react";
import { Student, AppState } from "../types";

interface AuthContextType {
  appState: AppState;
  login: (name: string, isAdmin?: boolean) => boolean;
  logout: () => void;
}

const defaultState: AppState = {
  currentUser: null,
  isAdmin: false,
  isAuthenticated: false
};

// Store completed quiz names to prevent retakes
const completedQuizzes = new Set<string>();

const AuthContext = createContext<AuthContextType>({
  appState: defaultState,
  login: () => false,
  logout: () => {}
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [appState, setAppState] = useState<AppState>(defaultState);

  const login = (name: string, isAdmin = false): boolean => {
    const trimmedName = name.trim();
    
    // If user has already completed the quiz and is not an admin, prevent login
    if (!isAdmin && completedQuizzes.has(trimmedName.toLowerCase())) {
      toast.error("Vous avez déjà passé cette évaluation. Vous ne pouvez pas la repasser.");
      return false;
    }

    const student: Student = {
      id: Date.now().toString(),
      name: trimmedName
    };

    setAppState({
      currentUser: student,
      isAdmin,
      isAuthenticated: true
    });
    
    return true;
  };

  const logout = () => {
    // Add the user to completed quizzes when they logout after completing
    if (appState.currentUser && !appState.isAdmin) {
      completedQuizzes.add(appState.currentUser.name.toLowerCase());
    }
    setAppState(defaultState);
  };

  return (
    <AuthContext.Provider value={{ appState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};