pub mod commands;
pub mod compiler;
pub mod file_ops;
pub mod pdf;
pub mod state;
pub mod types;
pub mod workspace;

use state::AppState;

// Re-export commonly used types
pub use types::FileInfo;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            commands::workspace_init,
            commands::file_open,
            commands::file_save,
            commands::file_save_as,
            commands::file_get_current,
            commands::build_compile,
            commands::check_system_requirements,
            commands::debug_pdflatex,
            commands::read_pdf_base64
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
