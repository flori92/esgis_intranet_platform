// Configuration des mocks pour les tests de l'application
import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock de l'AuthProvider pour les tests
jest.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }) => <div data-testid="auth-provider">{children}</div>,
  useAuth: jest.fn(() => ({
    authState: {
      user: null,
      profile: null,
      student: null,
      professor: null,
      session: null,
      isAdmin: false,
      isProfessor: false,
      isStudent: false,
      error: null,
      loading: false
    },
    signIn: jest.fn(),
    signOut: jest.fn(),
    logout: jest.fn(),
    resetPassword: jest.fn(),
    updateProfile: jest.fn(),
    createUserAccount: jest.fn()
  }))
}));

// Mock des composants de route
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  BrowserRouter: ({ children }) => <div data-testid="browser-router">{children}</div>,
  Routes: ({ children }) => <div data-testid="routes">{children}</div>,
  Route: () => <div data-testid="route" />,
  Navigate: () => <div data-testid="navigate" />
}));

// Tests basiques pour vérifier le rendu de l'application
describe('App Component', () => {
  test('renders without crashing', () => {
    render(<App />);
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
  });
});
