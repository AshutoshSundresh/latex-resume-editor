pub mod compiler;
pub mod file_ops;
pub mod workspace;

use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

use compiler::{check_requirements, compile_latex_async, BuildResult, RequirementsStatus};
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

/// Compile the current LaTeX file to PDF
#[tauri::command]
async fn build_compile(state: State<'_, AppState>) -> Result<BuildResult, String> {
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
fn check_system_requirements() -> RequirementsStatus {
    check_requirements()
}

/// Read a PDF file and return it as base64
#[tauri::command]
fn read_pdf_base64(path: String) -> Result<String, String> {
    use std::fs;
    use std::io::Read;
    
    let mut file = fs::File::open(&path)
        .map_err(|e| format!("Failed to open PDF: {}", e))?;
    
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer)
        .map_err(|e| format!("Failed to read PDF: {}", e))?;
    
    use base64::Engine;
    Ok(base64::engine::general_purpose::STANDARD.encode(&buffer))
}

/// Debug command to check pdflatex paths
#[tauri::command]
fn debug_pdflatex() -> String {
    let home = std::env::var("USERPROFILE").unwrap_or_else(|_| "NOT_FOUND".to_string());
    let path1 = format!(
        "{}\\AppData\\Local\\Programs\\MiKTeX\\miktex\\bin\\x64\\pdflatex.exe",
        home
    );
    let exists1 = std::path::Path::new(&path1).exists();
    
    format!(
        "USERPROFILE: {}\nPath: {}\nExists: {}",
        home, path1, exists1
    )
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
        .plugin(tauri_plugin_fs::init())
        .manage(AppState {
            current_file: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            workspace_init,
            file_open,
            file_save,
            file_save_as,
            file_get_current,
            build_compile,
            check_system_requirements,
            debug_pdflatex,
            read_pdf_base64
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
