//! Application state management

use std::path::PathBuf;
use std::sync::Mutex;

/// Application state for tracking the current file
pub struct AppState {
    pub current_file: Mutex<Option<PathBuf>>,
}

impl AppState {
    /// Create a new AppState instance
    pub fn new() -> Self {
        Self {
            current_file: Mutex::new(None),
        }
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}

