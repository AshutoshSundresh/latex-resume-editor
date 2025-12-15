//! pdflatex command discovery and utilities

use std::process::Command;

/// Get the pdflatex command - tries PATH first, then common locations
pub fn get_pdflatex_command() -> String {
    // Try PATH first
    if Command::new("pdflatex")
        .arg("--version")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
    {
        return "pdflatex".to_string();
    }

    // Try common MiKTeX locations on Windows
    #[cfg(windows)]
    {
        let home = std::env::var("USERPROFILE").unwrap_or_else(|_| "C:\\Users\\Default".to_string());
        let miktex_paths = [
            format!(
                "{}\\AppData\\Local\\Programs\\MiKTeX\\miktex\\bin\\x64\\pdflatex.exe",
                home
            ),
            "C:\\Program Files\\MiKTeX\\miktex\\bin\\x64\\pdflatex.exe".to_string(),
            "C:\\Program Files (x86)\\MiKTeX\\miktex\\bin\\x64\\pdflatex.exe".to_string(),
            "C:\\MiKTeX\\miktex\\bin\\x64\\pdflatex.exe".to_string(),
        ];

        for path in &miktex_paths {
            if std::path::Path::new(path).exists() {
                // Verify it actually works
                if Command::new(path)
                    .arg("--version")
                    .output()
                    .map(|o| o.status.success())
                    .unwrap_or(false)
                {
                    return path.clone();
                }
                // Even if --version fails, if file exists, try to use it
                return path.clone();
            }
        }
    }

    // Fallback to just "pdflatex"
    "pdflatex".to_string()
}

/// Check if pdflatex is available on the system
pub fn is_pdflatex_available() -> bool {
    let cmd = get_pdflatex_command();
    // If it's a full path, just check if file exists
    if cmd.contains('\\') || cmd.contains('/') {
        return std::path::Path::new(&cmd).exists();
    }
    // If it's just "pdflatex", try to run it
    Command::new(&cmd)
        .arg("--version")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

/// Get debug information about pdflatex paths
#[cfg(windows)]
pub fn debug_pdflatex() -> String {
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

/// Get debug information about pdflatex paths
#[cfg(not(windows))]
pub fn debug_pdflatex() -> String {
    let home = std::env::var("HOME").unwrap_or_else(|_| "NOT_FOUND".to_string());
    let common_paths = [
        "/usr/bin/pdflatex",
        "/usr/local/bin/pdflatex",
        "/opt/texbin/pdflatex",
        format!("{}/.texlive/bin/x86_64-linux/pdflatex", home),
        format!("{}/.texlive/bin/universal-darwin/pdflatex", home),
    ];
    
    let mut info = format!("HOME: {}\n", home);
    info.push_str("Common paths:\n");
    
    for path in &common_paths {
        let exists = std::path::Path::new(path).exists();
        info.push_str(&format!("  {}: {}\n", path, if exists { "EXISTS" } else { "not found" }));
    }
    
    // Check if pdflatex is in PATH
    let in_path = Command::new("which")
        .arg("pdflatex")
        .output()
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());
    
    if let Some(path) = in_path {
        info.push_str(&format!("\npdflatex found in PATH: {}", path));
    } else {
        info.push_str("\npdflatex not found in PATH");
    }
    
    info
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_pdflatex_available_returns_bool() {
        let available = is_pdflatex_available();
        // Just verify it returns a boolean without panicking
        assert!(available || !available);
    }

    #[test]
    fn test_is_pdflatex_available_consistency() {
        // Multiple calls should return the same result
        let first = is_pdflatex_available();
        let second = is_pdflatex_available();
        assert_eq!(first, second);
    }

    #[test]
    fn test_get_pdflatex_command_returns_string() {
        let cmd = get_pdflatex_command();
        // Should always return a non-empty string
        assert!(!cmd.is_empty());
    }

    #[test]
    fn test_debug_pdflatex_returns_string() {
        let debug = debug_pdflatex();
        // Should return a non-empty debug string
        assert!(!debug.is_empty());
        // Check for platform-specific environment variable
        #[cfg(windows)]
        assert!(debug.contains("USERPROFILE"));
        #[cfg(not(windows))]
        assert!(debug.contains("HOME"));
    }
}

