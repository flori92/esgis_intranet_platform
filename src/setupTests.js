// Configuration Jest pour supporter les tests React
import '@testing-library/jest-dom';

// Mock global fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
  })
);
