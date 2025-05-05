import React, { ReactNode, ReactElement } from 'react';
import { render } from '@testing-library/react';
import { AuthProvider } from '../context/AuthContext';
import { QuizProvider } from '../context/QuizContext';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Création d'un thème de test
const theme = createTheme();

// Interface pour les props du wrapper de test
interface TestWrapperProps {
  children: ReactNode;
}

// Wrapper pour les tests qui inclut tous les providers nécessaires
export const TestWrapper: React.FC<TestWrapperProps> = ({ children }) => {
  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <AuthProvider>
          <QuizProvider>
            <AuthProvider>
              <QuizProvider>
                {children}
              </QuizProvider>
            </AuthProvider>
          </QuizProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

// Fonction utilitaire pour rendre un composant avec tous les providers
export function renderWithProviders(ui: ReactElement) {
  return render(ui, { wrapper: TestWrapper });
}
