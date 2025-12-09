/**
 * Tauri API wrapper for file operations
 */
import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';

export interface FileInfo {
  path: string;
  name: string;
  content: string;
}

/**
 * Open a file dialog and load the selected .tex file
 */
export async function openFile(): Promise<FileInfo | null> {
  const selected = await open({
    multiple: false,
    filters: [
      { name: 'LaTeX Files', extensions: ['tex'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (!selected) {
    return null;
  }

  const path = typeof selected === 'string' ? selected : selected.path;
  return invoke<FileInfo>('file_open', { path });
}

/**
 * Save the current file content
 */
export async function saveFile(content: string): Promise<void> {
  return invoke('file_save', { content });
}

/**
 * Open a save dialog and save content to the selected path
 */
export async function saveFileAs(content: string): Promise<FileInfo | null> {
  const selected = await save({
    filters: [
      { name: 'LaTeX Files', extensions: ['tex'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    defaultPath: 'resume.tex',
  });

  if (!selected) {
    return null;
  }

  return invoke<FileInfo>('file_save_as', { path: selected, content });
}

/**
 * Get the current file path
 */
export async function getCurrentFile(): Promise<string | null> {
  return invoke<string | null>('file_get_current');
}

/**
 * Initialize the workspace
 */
export async function initWorkspace(): Promise<string> {
  return invoke<string>('workspace_init');
}

/**
 * Severity of a diagnostic message
 */
export type Severity = 'error' | 'warning' | 'info';

/**
 * A diagnostic message from the compiler
 */
export interface Diagnostic {
  severity: Severity;
  message: string;
  file: string | null;
  line: number | null;
  column: number | null;
}

/**
 * Result of a LaTeX compilation
 */
export interface BuildResult {
  success: boolean;
  pdf_path: string | null;
  log: string;
  duration_ms: number;
  error_message: string | null;
  diagnostics: Diagnostic[];
}

/**
 * Compile the current LaTeX file to PDF
 */
export async function compileLatex(): Promise<BuildResult> {
  return invoke<BuildResult>('build_compile');
}

/**
 * Check if tectonic is available on the system
 */
export async function checkTectonic(): Promise<boolean> {
  return invoke<boolean>('build_check_tectonic');
}
