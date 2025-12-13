import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';
import {
  openFile,
  saveFile,
  saveFileAs,
  getCurrentFile,
  initWorkspace,
  compileLatex,
  checkRequirements,
} from '../api';

// Mocks are set up in setup.ts

describe('Tauri API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initWorkspace', () => {
    it('should call workspace_init command', async () => {
      const result = await initWorkspace();
      expect(invoke).toHaveBeenCalledWith('workspace_init');
      expect(result).toBe('/mock/workspace/path');
    });
  });

  describe('openFile', () => {
    it('should open dialog and call file_open command', async () => {
      const result = await openFile();

      expect(open).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenCalledWith({
        multiple: false,
        filters: [
          { name: 'LaTeX Files', extensions: ['tex'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });
      expect(invoke).toHaveBeenCalledWith('file_open', { path: '/mock/path/selected.tex' });
      expect(result).toBeDefined();
    });

    it('should return null if dialog is cancelled', async () => {
      vi.mocked(open).mockResolvedValueOnce(null);

      const result = await openFile();

      expect(open).toHaveBeenCalledTimes(1);
      expect(invoke).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('saveFile', () => {
    it('should call file_save command with content', async () => {
      const content = 'Test content';
      await saveFile(content);

      expect(invoke).toHaveBeenCalledWith('file_save', { content });
    });

    it('should handle empty content', async () => {
      await saveFile('');
      expect(invoke).toHaveBeenCalledWith('file_save', { content: '' });
    });
  });

  describe('saveFileAs', () => {
    it('should open save dialog and call file_save_as command', async () => {
      const content = 'Test content';
      const result = await saveFileAs(content);

      expect(save).toHaveBeenCalledTimes(1);
      expect(save).toHaveBeenCalledWith({
        filters: [
          { name: 'LaTeX Files', extensions: ['tex'] },
          { name: 'All Files', extensions: ['*'] },
        ],
        defaultPath: 'resume.tex',
      });
      expect(invoke).toHaveBeenCalledWith('file_save_as', {
        path: '/mock/path/saved.tex',
        content,
      });
      expect(result).toBeDefined();
    });

    it('should return null if save dialog is cancelled', async () => {
      vi.mocked(save).mockResolvedValueOnce(null);

      const result = await saveFileAs('content');

      expect(save).toHaveBeenCalledTimes(1);
      expect(invoke).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('getCurrentFile', () => {
    it('should call file_get_current command', async () => {
      const result = await getCurrentFile();

      expect(invoke).toHaveBeenCalledWith('file_get_current');
      expect(result).toBe('/mock/path/resume.tex');
    });
  });

  describe('compileLatex', () => {
    it('should call build_compile command', async () => {
      const result = await compileLatex();

      expect(invoke).toHaveBeenCalledWith('build_compile');
      expect(result).toEqual({
        success: true,
        pdf_path: '/mock/path/output.pdf',
        log: 'Compilation successful',
        duration_ms: 1234,
        error_message: null,
      });
    });

    it('should return BuildResult with all fields', async () => {
      const result = await compileLatex();

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('pdf_path');
      expect(result).toHaveProperty('log');
      expect(result).toHaveProperty('duration_ms');
      expect(result).toHaveProperty('error_message');
    });
  });

  describe('checkRequirements', () => {
    it('should call check_system_requirements command', async () => {
      const result = await checkRequirements();

      expect(invoke).toHaveBeenCalledWith('check_system_requirements');
      expect(result).toEqual({
        pdflatex_available: true,
        pdflatex_path: '/usr/bin/pdflatex',
        all_satisfied: true,
      });
    });

    it('should return RequirementsStatus with all fields', async () => {
      const result = await checkRequirements();

      expect(result).toHaveProperty('pdflatex_available');
      expect(result).toHaveProperty('pdflatex_path');
      expect(result).toHaveProperty('all_satisfied');
    });
  });
});

describe('API types', () => {
  describe('BuildResult', () => {
    it('should handle successful build result', async () => {
      const result = await compileLatex();

      expect(result.success).toBe(true);
      expect(result.pdf_path).toBe('/mock/path/output.pdf');
      expect(result.error_message).toBeNull();
    });
  });

  describe('RequirementsStatus', () => {
    it('should have consistent all_satisfied with pdflatex_available', async () => {
      const result = await checkRequirements();

      // In our mock, both are true
      expect(result.all_satisfied).toBe(result.pdflatex_available);
    });
  });
});
