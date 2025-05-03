import React, { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { render, RenderOptions } from '@testing-library/react';

// Interface pour les props du wrapper de test
interface TestWrapperProps {
  children: ReactNode;
}

// Mock du AuthProvider pour les tests
export const MockAuthProvider: React.FC<TestWrapperProps> = ({ children }) => {
  return <div data-testid="auth-provider">{children}</div>;
};

// Wrapper complet pour les tests avec BrowserRouter et AuthProvider
export const AllProviders: React.FC<TestWrapperProps> = ({ children }) => {
  return (
    <BrowserRouter>
      <MockAuthProvider>
        {children}
      </MockAuthProvider>
    </BrowserRouter>
  );
};

// Fonction de rendu personnalisée avec tous les providers
export const renderWithProviders = (
  ui: JSX.Element,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, { wrapper: AllProviders, ...options });
};

// Export des types pour être utilisés dans les tests
export type { TestWrapperProps };
