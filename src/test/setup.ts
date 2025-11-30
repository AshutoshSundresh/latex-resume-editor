import '@testing-library/jest-dom';

// Mock ResizeObserver for allotment component
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
