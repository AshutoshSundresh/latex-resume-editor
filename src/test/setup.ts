import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock ResizeObserver for allotment component
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Default mock responses
const mockResponses: Record<string, unknown> = {
  workspace_init: '/mock/workspace/path',
  file_open: {
    path: '/mock/path/resume.tex',
    name: 'resume.tex',
    content: '\\documentclass{article}\n\\begin{document}\nHello\n\\end{document}',
  },
  file_save: undefined,
  file_save_as: {
    path: '/mock/path/saved.tex',
    name: 'saved.tex',
    content: 'saved content',
  },
  file_get_current: '/mock/path/resume.tex',
  build_compile: {
    success: true,
    pdf_path: '/mock/path/output.pdf',
    log: 'Compilation successful',
    duration_ms: 1234,
    error_message: null,
  },
  debug_pdflatex: 'Mock debug info',
  read_pdf_base64: 'JVBERi0x', // Minimal PDF base64
  check_system_requirements: {
    pdflatex_available: true,
    pdflatex_path: '/usr/bin/pdflatex',
    all_satisfied: true,
  },
};

// Mock Tauri API for tests
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn((command: string, _args?: unknown) => {
    const response = mockResponses[command];
    if (response !== undefined) {
      return Promise.resolve(response);
    }
    console.warn(`Unmocked Tauri command: ${command}`);
    return Promise.resolve(null);
  }),
  convertFileSrc: vi.fn((path: string) => `asset://localhost/${path}`),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn().mockResolvedValue('/mock/path/selected.tex'),
  save: vi.fn().mockResolvedValue('/mock/path/saved.tex'),
}));

// Export mock responses for test customization
export { mockResponses };
