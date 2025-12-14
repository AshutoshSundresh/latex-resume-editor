//! Tauri command handlers

use std::path::PathBuf;
use tauri::State;

use crate::compiler::{check_requirements, compile_latex_async, RequirementsStatus};
use crate::file_ops::{get_file_name, read_file, write_file};
use crate::pdf;
use crate::state::AppState;
use crate::types::FileInfo;
use crate::workspace::init_workspace;

/// Initialize the workspace and return info about it
#[tauri::command]
pub fn workspace_init() -> Result<String, String> {
    match init_workspace() {
        Ok(path) => Ok(path.to_string_lossy().to_string()),
        Err(e) => Err(format!("Failed to initialize workspace: {}", e)),
    }
}

/// Open a file and return its contents along with file info
#[tauri::command]
pub fn file_open(path: String, state: State<AppState>) -> Result<FileInfo, String> {
    let path_buf = PathBuf::from(&path);
    let content = read_file(&path_buf)?;
    let name = get_file_name(&path_buf);

    // Update current file state
    let mut current = state.current_file.lock().map_err(|e| e.to_string())?;
    *current = Some(path_buf.clone());

    Ok(FileInfo {
        path,
        name,
        content,
    })
}

/// Save content to the current file
#[tauri::command]
pub fn file_save(content: String, state: State<AppState>) -> Result<(), String> {
    let current = state.current_file.lock().map_err(|e| e.to_string())?;
    let path = current.as_ref().ok_or("No file is currently open")?;

    write_file(path, &content)
}

/// Save content to a new file path
#[tauri::command]
pub fn file_save_as(path: String, content: String, state: State<AppState>) -> Result<FileInfo, String> {
    let path_buf = PathBuf::from(&path);
    write_file(&path_buf, &content)?;

    let name = get_file_name(&path_buf);

    // Update current file state
    let mut current = state.current_file.lock().map_err(|e| e.to_string())?;
    *current = Some(path_buf);

    Ok(FileInfo {
        path,
        name,
        content,
    })
}

/// Get info about the currently open file
#[tauri::command]
pub fn file_get_current(state: State<AppState>) -> Option<String> {
    let current = state.current_file.lock().ok()?;
    current.as_ref().map(|p| p.to_string_lossy().to_string())
}

/// Compile the current LaTeX file to PDF
#[tauri::command]
pub async fn build_compile(state: State<'_, AppState>) -> Result<crate::compiler::BuildResult, String> {
    let tex_path = {
        let current = state.current_file.lock().map_err(|e| e.to_string())?;
        current.as_ref().ok_or("No file is currently open")?.clone()
    };

    // Use the same directory as the tex file for output
    let output_dir = tex_path
        .parent()
        .ok_or("Cannot determine output directory")?
        .to_path_buf();

    Ok(compile_latex_async(&tex_path, &output_dir).await)
}

/// Check system requirements (pdflatex, etc.)
#[tauri::command]
pub fn check_system_requirements() -> RequirementsStatus {
    check_requirements()
}

/// Read a PDF file and return it as base64
#[tauri::command]
pub fn read_pdf_base64(path: String) -> Result<String, String> {
    pdf::read_pdf_base64(&path)
}

/// Debug command to check pdflatex paths
#[tauri::command]
pub fn debug_pdflatex() -> String {
    crate::compiler::pdflatex::debug_pdflatex()
}

