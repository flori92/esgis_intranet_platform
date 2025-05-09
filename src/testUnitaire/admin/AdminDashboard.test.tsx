// Mock de l'AuthProvider pour résoudre le problème de props children
jest.mock('../../context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="auth-provider">{children}</div>,
  useAuth: () => ({
    authState: {
      isAdmin: true,
      user: { id: 'test-user-id' },
    },
    logout: jest.fn(),
  }),
}));

import React from 'react';
import { screen } from '@testing-library/react';
import AdminDashboardPage from '../../pages/admin/AdminDashboardPage';
import { renderWithProviders } from '../../__tests__/test-utils';

describe('AdminDashboardPage', () => {
  test('Affiche le titre du tableau de bord', () => {
    renderWithProviders(<AdminDashboardPage />);
    
    expect(screen.getByText('Tableau de Bord Administratif')).toBeInTheDocument();
  });

  test('Affiche les modules d\'administration', () => {
    renderWithProviders(<AdminDashboardPage />);
    
    expect(screen.getByText('Départements & Filières')).toBeInTheDocument();
    expect(screen.getByText('Professeurs & Rôles')).toBeInTheDocument();
    expect(screen.getByText('Matières & Cours')).toBeInTheDocument();
    expect(screen.getByText('Assignation des Cours')).toBeInTheDocument();
    expect(screen.getByText('Gestion des Étudiants')).toBeInTheDocument();
  });

  test('Affiche les statistiques rapides', () => {
    renderWithProviders(<AdminDashboardPage />);
    
    expect(screen.getByText('Départements')).toBeInTheDocument();
    expect(screen.getByText('Professeurs')).toBeInTheDocument();
    expect(screen.getByText('Étudiants')).toBeInTheDocument();
    expect(screen.getByText('Cours')).toBeInTheDocument();
  });

  test('Affiche les actions rapides', () => {
    renderWithProviders(<AdminDashboardPage />);
    
    expect(screen.getByText('Actions rapides')).toBeInTheDocument();
    expect(screen.getByText('Créer un nouveau département')).toBeInTheDocument();
    expect(screen.getByText('Ajouter un nouveau cours')).toBeInTheDocument();
    expect(screen.getByText('Assigner des rôles aux professeurs')).toBeInTheDocument();
  });
});
