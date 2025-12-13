//! Workspace management for ResumeIDE
//!
//! This module handles the app's workspace directory structure:
//! - `%LOCALAPPDATA%/ResumeIDE/` on Windows
//! - Contains: settings.json, logs/, templates/, projects/

use std::path::PathBuf;

/// Get the root workspace directory for the application
/// Returns: `%LOCALAPPDATA%/ResumeIDE/` on Windows
pub fn get_workspace_root() -> Option<PathBuf> {
    dirs::data_local_dir().map(|p| p.join("ResumeIDE"))
}

/// Get the projects directory
/// Returns: `<workspace_root>/projects/`
pub fn get_projects_dir() -> Option<PathBuf> {
    get_workspace_root().map(|p| p.join("projects"))
}

/// Get the templates directory
/// Returns: `<workspace_root>/templates/`
pub fn get_templates_dir() -> Option<PathBuf> {
    get_workspace_root().map(|p| p.join("templates"))
}

/// Get the logs directory
/// Returns: `<workspace_root>/logs/`
pub fn get_logs_dir() -> Option<PathBuf> {
    get_workspace_root().map(|p| p.join("logs"))
}

/// Initialize the workspace directory structure
/// Creates all required directories if they don't exist
pub fn init_workspace() -> Result<PathBuf, std::io::Error> {
    let root = get_workspace_root().ok_or_else(|| {
        std::io::Error::new(
            std::io::ErrorKind::NotFound,
            "Could not determine local app data directory",
        )
    })?;

    // Create all required directories
    let dirs_to_create = [
        root.clone(),
        root.join("projects"),
        root.join("templates"),
        root.join("logs"),
    ];

    for dir in &dirs_to_create {
        if !dir.exists() {
            std::fs::create_dir_all(dir)?;
        }
    }

    Ok(root)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_workspace_root_returns_some() {
        let root = get_workspace_root();
        assert!(root.is_some());
    }

    #[test]
    fn test_workspace_root_ends_with_resumeide() {
        let root = get_workspace_root().unwrap();
        assert!(root.ends_with("ResumeIDE"));
    }

    #[test]
    fn test_projects_dir_is_under_workspace() {
        let projects = get_projects_dir().unwrap();
        let root = get_workspace_root().unwrap();
        assert!(projects.starts_with(&root));
        assert!(projects.ends_with("projects"));
    }

    #[test]
    fn test_templates_dir_is_under_workspace() {
        let templates = get_templates_dir().unwrap();
        let root = get_workspace_root().unwrap();
        assert!(templates.starts_with(&root));
        assert!(templates.ends_with("templates"));
    }

    #[test]
    fn test_logs_dir_is_under_workspace() {
        let logs = get_logs_dir().unwrap();
        let root = get_workspace_root().unwrap();
        assert!(logs.starts_with(&root));
        assert!(logs.ends_with("logs"));
    }
}
