pub mod workspace;

use workspace::init_workspace;

/// Initialize the workspace and return info about it
#[tauri::command]
fn workspace_init() -> Result<String, String> {
    match init_workspace() {
        Ok(path) => Ok(path.to_string_lossy().to_string()),
        Err(e) => Err(format!("Failed to initialize workspace: {}", e)),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![workspace_init])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
