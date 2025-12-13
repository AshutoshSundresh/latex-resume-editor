//! Shared types used across the application

/// File information returned from file operations
#[derive(serde::Serialize)]
pub struct FileInfo {
    pub path: String,
    pub name: String,
    pub content: String,
}

