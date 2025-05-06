/**
 * Ce fichier est utilisé pour définir une implémentation factice de Jest
 * en environnement de production afin d'éviter les erreurs "jest is not defined"
 */

// Vérifier si nous sommes en production (pas en environnement de test)
if (typeof jest === 'undefined') {
  // Créer un objet global jest factice pour éviter les erreurs en production
  window.jest = {
    fn: (implementation = () => {}) => {
      const mockFn = (...args) => {
        if (implementation) {
          return implementation(...args);
        }
        return undefined;
      };
      
      mockFn.mockImplementation = () => mockFn;
      mockFn.mockReturnValue = () => mockFn;
      mockFn.mockResolvedValue = () => mockFn;
      mockFn.mockRejectedValue = () => mockFn;
      
      return mockFn;
    }
  };
}
