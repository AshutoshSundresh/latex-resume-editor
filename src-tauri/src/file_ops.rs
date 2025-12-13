//! File operations for ResumeIDE
//!
//! Handles reading and writing .tex files

use std::fs;
use std::path::Path;

/// Read a file and return its contents
pub fn read_file(path: &Path) -> Result<String, String> {
    fs::read_to_string(path).map_err(|e| format!("Failed to read file: {}", e))
}

/// Write content to a file
pub fn write_file(path: &Path, content: &str) -> Result<(), String> {
    fs::write(path, content).map_err(|e| format!("Failed to write file: {}", e))
}

/// Check if a path has a .tex extension
pub fn is_tex_file(path: &Path) -> bool {
    path.extension()
        .map(|ext| ext.to_string_lossy().to_lowercase() == "tex")
        .unwrap_or(false)
}

/// Get the file name from a path
pub fn get_file_name(path: &Path) -> String {
    path.file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "Untitled".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use std::path::PathBuf;
    use tempfile::NamedTempFile;

    #[test]
    fn test_is_tex_file_true() {
        let path = PathBuf::from("resume.tex");
        assert!(is_tex_file(&path));
    }

    #[test]
    fn test_is_tex_file_false() {
        let path = PathBuf::from("resume.pdf");
        assert!(!is_tex_file(&path));
    }

    #[test]
    fn test_is_tex_file_case_insensitive() {
        let path = PathBuf::from("resume.TEX");
        assert!(is_tex_file(&path));
    }

    #[test]
    fn test_get_file_name() {
        let path = PathBuf::from("/some/path/resume.tex");
        assert_eq!(get_file_name(&path), "resume.tex");
    }

    #[test]
    fn test_read_write_file() {
        let mut temp = NamedTempFile::new().unwrap();
        let content = "\\documentclass{article}";
        writeln!(temp, "{}", content).unwrap();

        let path = temp.path().to_path_buf();
        let read_content = read_file(&path).unwrap();
        assert!(read_content.contains("\\documentclass"));
    }
}
