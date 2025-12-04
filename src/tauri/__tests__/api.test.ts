import { describe, it, expect, vi, beforeEach } from 'vitest';
import { openFile, saveFile, saveFileAs, getCurrentFile, initWorkspace } from '../api';
import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';

// Get mocked functions
const mockInvoke = vi.mocked(invoke);
const mockOpen = vi.mocked(open);
const mockSave = vi.mocked(save);

describe('Tauri API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('openFile', () => {
    it('should return null when user cancels dialog', async () => {
      mockOpen.mockResolvedValue(null);

      const result = await openFile();

      expect(result).toBeNull();
      expect(mockInvoke).not.toHaveBeenCalled();
    });

    it('should invoke file_open with selected path', async () => {
      const mockFileInfo = {
        path: '/path/to/resume.tex',
        name: 'resume.tex',
        content: '\\documentclass{article}',
      };

      mockOpen.mockResolvedValue({ path: '/path/to/resume.tex', name: 'resume.tex' });
      mockInvoke.mockResolvedValue(mockFileInfo);

      const result = await openFile();

      expect(mockInvoke).toHaveBeenCalledWith('file_open', { path: '/path/to/resume.tex' });
      expect(result).toEqual(mockFileInfo);
    });
  });

  describe('saveFile', () => {
    it('should invoke file_save with content', async () => {
      mockInvoke.mockResolvedValue(undefined);

      await saveFile('\\documentclass{article}');

      expect(mockInvoke).toHaveBeenCalledWith('file_save', { content: '\\documentclass{article}' });
    });
  });

  describe('saveFileAs', () => {
    it('should return null when user cancels dialog', async () => {
      mockSave.mockResolvedValue(null);

      const result = await saveFileAs('content');

      expect(result).toBeNull();
      expect(mockInvoke).not.toHaveBeenCalled();
    });

    it('should invoke file_save_as with path and content', async () => {
      const mockFileInfo = {
        path: '/path/to/new.tex',
        name: 'new.tex',
        content: 'content',
      };

      mockSave.mockResolvedValue('/path/to/new.tex');
      mockInvoke.mockResolvedValue(mockFileInfo);

      const result = await saveFileAs('content');

      expect(mockInvoke).toHaveBeenCalledWith('file_save_as', {
        path: '/path/to/new.tex',
        content: 'content',
      });
      expect(result).toEqual(mockFileInfo);
    });
  });

  describe('getCurrentFile', () => {
    it('should invoke file_get_current and return path', async () => {
      mockInvoke.mockResolvedValue('/path/to/current.tex');

      const result = await getCurrentFile();

      expect(mockInvoke).toHaveBeenCalledWith('file_get_current');
      expect(result).toBe('/path/to/current.tex');
    });

    it('should return null when no file is open', async () => {
      mockInvoke.mockResolvedValue(null);

      const result = await getCurrentFile();

      expect(result).toBeNull();
    });
  });

  describe('initWorkspace', () => {
    it('should invoke workspace_init and return path', async () => {
      mockInvoke.mockResolvedValue('C:\\Users\\user\\AppData\\Local\\ResumeIDE');

      const result = await initWorkspace();

      expect(mockInvoke).toHaveBeenCalledWith('workspace_init');
      expect(result).toBe('C:\\Users\\user\\AppData\\Local\\ResumeIDE');
    });
  });
});
