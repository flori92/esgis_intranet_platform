/**
 * Fichier de remplacement pour Jest en production
 * Ce fichier est utilisé pour remplacer toutes les références à Jest
 * dans le code de production afin d'éviter les erreurs "jest is not defined"
 */

// Créer un objet global jest factice
window.jest = {
  fn: (implementation = () => {}) => {
    const mockFn = (...args) => {
      if (implementation) {
        return implementation(...args);
      }
      return undefined;
    };
    
    // Ajouter toutes les méthodes courantes de Jest
    mockFn.mockImplementation = () => mockFn;
    mockFn.mockReturnValue = () => mockFn;
    mockFn.mockResolvedValue = () => mockFn;
    mockFn.mockRejectedValue = () => mockFn;
    mockFn.mockReturnThis = () => mockFn;
    mockFn.mockName = () => mockFn;
    mockFn.getMockName = () => '';
    
    return mockFn;
  },
  // Ajouter d'autres méthodes courantes de Jest
  mock: () => {},
  unmock: () => {},
  requireActual: (module) => module,
  requireMock: (module) => module,
  clearAllMocks: () => {},
  resetAllMocks: () => {},
  restoreAllMocks: () => {},
  spyOn: () => ({
    mockImplementation: () => {},
    mockReturnValue: () => {},
    mockResolvedValue: () => {},
    mockRejectedValue: () => {}
  })
};
