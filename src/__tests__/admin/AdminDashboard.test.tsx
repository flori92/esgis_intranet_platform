import { screen } from '@testing-library/react';
import AdminDashboardPage from '../../pages/admin/AdminDashboardPage';
import { renderWithProviders } from '../test-utils';

// Mock des composants et hooks nécessaires
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    authState: {
      user: { id: 'admin-123' },
      profile: { full_name: 'Admin Test', role: 'admin' },
      isAdmin: true,
      isProfessor: false,
      isStudent: false,
      loading: false
    },
    logout: jest.fn()
  })
}));

describe('AdminDashboardPage', () => {
  test('Affiche le titre du tableau de bord', () => {
    renderWithProviders(<AdminDashboardPage />);
    
    expect(screen.getByText('Tableau de Bord Administratif')).toBeInTheDocument();
  });

  test('Affiche les modules d\'administration', () => {
    renderWithProviders(<AdminDashboardPage />);
    
    expect(screen.getByText('Gestion des Étudiants')).toBeInTheDocument();
    expect(screen.getByText('Gestion des Professeurs')).toBeInTheDocument();
    expect(screen.getByText('Gestion des Cours')).toBeInTheDocument();
  });
  
  test('Affiche les statistiques rapides', () => {
    renderWithProviders(<AdminDashboardPage />);
    
    expect(screen.getByText('Étudiants')).toBeInTheDocument();
    expect(screen.getByText('Professeurs')).toBeInTheDocument();
    expect(screen.getByText('Cours')).toBeInTheDocument();
  });

  test('Affiche les actions rapides', () => {
    renderWithProviders(<AdminDashboardPage />);
    
    expect(screen.getByText('Actions Rapides')).toBeInTheDocument();
  });
});
