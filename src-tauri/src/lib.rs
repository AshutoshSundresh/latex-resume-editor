pub mod file_ops;
pub mod workspace;

use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

use file_ops::{get_file_name, read_file, write_file};
use workspace::init_workspace;

/// Application state for tracking the current file
pub struct AppState {
    pub current_file: Mutex<Option<PathBuf>>,
}

/// Initialize the workspace and return info about it
#[tauri::command]
fn workspace_init() -> Result<String, String> {
    match init_workspace() {
        Ok(path) => Ok(path.to_string_lossy().to_string()),
        Err(e) => Err(format!("Failed to initialize workspace: {}", e)),
    }
}

/// Open a file and return its contents along with file info
#[tauri::command]
fn file_open(path: String, state: State<AppState>) -> Result<FileInfo, String> {
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
fn file_save(content: String, state: State<AppState>) -> Result<(), String> {
    let current = state.current_file.lock().map_err(|e| e.to_string())?;
    let path = current.as_ref().ok_or("No file is currently open")?;

    write_file(path, &content)
}

/// Save content to a new file path
#[tauri::command]
fn file_save_as(path: String, content: String, state: State<AppState>) -> Result<FileInfo, String> {
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
fn file_get_current(state: State<AppState>) -> Option<String> {
    let current = state.current_file.lock().ok()?;
    current.as_ref().map(|p| p.to_string_lossy().to_string())
}

/// File information returned from file operations
#[derive(serde::Serialize)]
pub struct FileInfo {
    pub path: String,
    pub name: String,
    pub content: String,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            current_file: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            workspace_init,
            file_open,
            file_save,
            file_save_as,
            file_get_current
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
