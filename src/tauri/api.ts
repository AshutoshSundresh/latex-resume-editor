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
 * Result of a LaTeX compilation
 */
export interface BuildResult {
  success: boolean;
  pdf_path: string | null;
  log: string;
  duration_ms: number;
  error_message: string | null;
}

/**
 * Compile the current LaTeX file to PDF
 */
export async function compileLatex(): Promise<BuildResult> {
  return invoke<BuildResult>('build_compile');
}

/**
 * System requirements status
 */
export interface RequirementsStatus {
  pdflatex_available: boolean;
  pdflatex_path: string | null;
  all_satisfied: boolean;
}

/**
 * Check system requirements (pdflatex, etc.)
 */
export async function checkRequirements(): Promise<RequirementsStatus> {
  return invoke<RequirementsStatus>('check_system_requirements');
}

/**
 * Debug pdflatex detection
 */
export async function debugPdflatex(): Promise<string> {
  return invoke<string>('debug_pdflatex');
}

/**
 * Read a PDF file and return it as a data URL
 */
export async function readPdfAsDataUrl(path: string): Promise<string> {
  const base64 = await invoke<string>('read_pdf_base64', { path });
  return `data:application/pdf;base64,${base64}`;
}
