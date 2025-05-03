import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import StudentsListPage from '../../pages/admin/students/StudentsListPage';

// Mock du hook useAuth
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    authState: {
      isAdmin: true,
      user: { id: 'test-user-id' },
    },
  }),
}));

// Mock de supabase
jest.mock('../../utils/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    then: jest.fn().mockImplementation(callback => 
      callback({
        data: [
          {
            id: 1,
            profiles: {
              id: 'profile-1',
              full_name: 'Jean Dupont',
              email: 'jean.dupont@example.com',
              gender: 'Homme',
              date_of_birth: '2000-01-01',
              phone_number: '+1234567890',
              address: '123 Rue Test'
            },
            student_id: 'STD001',
            department_id: 1,
            level: 'Licence 3',
            academic_year: '2024-2025',
            status: 'active',
            created_at: '2023-09-01T00:00:00Z'
          }
        ],
        error: null
      })
    )
  },
}));

describe('StudentsListPage', () => {
  test('Affiche le titre de la page de gestion des étudiants', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <StudentsListPage />
        </AuthProvider>
      </BrowserRouter>
    );
    
    expect(screen.getByText('Gestion des Étudiants')).toBeInTheDocument();
  });

  test('Affiche la barre de recherche et les filtres', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <StudentsListPage />
        </AuthProvider>
      </BrowserRouter>
    );
    
    expect(screen.getByPlaceholderText('Rechercher un étudiant...')).toBeInTheDocument();
    expect(screen.getByText('Département')).toBeInTheDocument();
    expect(screen.getByText('Niveau')).toBeInTheDocument();
    expect(screen.getByText('Statut')).toBeInTheDocument();
    expect(screen.getByText('Année Académique')).toBeInTheDocument();
  });

  test('Affiche les boutons d\'action', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <StudentsListPage />
        </AuthProvider>
      </BrowserRouter>
    );
    
    expect(screen.getByText('Exporter')).toBeInTheDocument();
    expect(screen.getByText('Ajouter')).toBeInTheDocument();
    expect(screen.getByText('Réinitialiser')).toBeInTheDocument();
  });

  test('Affiche les en-têtes du tableau des étudiants', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <StudentsListPage />
        </AuthProvider>
      </BrowserRouter>
    );
    
    expect(screen.getByText('Matricule')).toBeInTheDocument();
    expect(screen.getByText('Nom complet')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Département')).toBeInTheDocument();
    expect(screen.getByText('Niveau')).toBeInTheDocument();
    expect(screen.getByText('Année')).toBeInTheDocument();
    expect(screen.getByText('Statut')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });
});
