//! System requirements checking

use std::process::Command;

use super::pdflatex;

/// Get system requirements status
#[derive(Debug, Clone, serde::Serialize)]
pub struct RequirementsStatus {
    pub pdflatex_available: bool,
    pub pdflatex_path: Option<String>,
    pub all_satisfied: bool,
}

/// Check all requirements
pub fn check_requirements() -> RequirementsStatus {
    let pdflatex_cmd = pdflatex::get_pdflatex_command();
    
    // Check if available - if it's a path, just check existence
    let pdflatex_available = if pdflatex_cmd.contains('\\') || pdflatex_cmd.contains('/') {
        std::path::Path::new(&pdflatex_cmd).exists()
    } else {
        Command::new(&pdflatex_cmd)
            .arg("--version")
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false)
    };

    // Get the path we're using
    let pdflatex_path = if pdflatex_available {
        if pdflatex_cmd == "pdflatex" {
            // It's in PATH, try to find the actual path
            #[cfg(windows)]
            {
                Command::new("where")
                    .arg("pdflatex")
                    .output()
                    .ok()
                    .and_then(|o| {
                        String::from_utf8(o.stdout)
                            .ok()
                            .map(|s| s.lines().next().unwrap_or("").trim().to_string())
                    })
                    .filter(|s| !s.is_empty())
            }
            #[cfg(not(windows))]
            {
                Command::new("which")
                    .arg("pdflatex")
                    .output()
                    .ok()
                    .and_then(|o| String::from_utf8(o.stdout).ok())
                    .map(|s| s.trim().to_string())
                    .filter(|s| !s.is_empty())
            }
        } else {
            // We're using a direct path
            Some(pdflatex_cmd)
        }
    } else {
        None
    };

    RequirementsStatus {
        pdflatex_available,
        pdflatex_path,
        all_satisfied: pdflatex_available,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_requirements_status_serializes_satisfied() {
        let status = RequirementsStatus {
            pdflatex_available: true,
            pdflatex_path: Some("/usr/bin/pdflatex".to_string()),
            all_satisfied: true,
        };

        let json = serde_json::to_string(&status).unwrap();
        assert!(json.contains("\"pdflatex_available\":true"));
        assert!(json.contains("\"all_satisfied\":true"));
        assert!(json.contains("\"/usr/bin/pdflatex\""));
    }

    #[test]
    fn test_requirements_status_serializes_unsatisfied() {
        let status = RequirementsStatus {
            pdflatex_available: false,
            pdflatex_path: None,
            all_satisfied: false,
        };

        let json = serde_json::to_string(&status).unwrap();
        assert!(json.contains("\"pdflatex_available\":false"));
        assert!(json.contains("\"all_satisfied\":false"));
        assert!(json.contains("\"pdflatex_path\":null"));
    }

    #[test]
    fn test_requirements_status_clone() {
        let status = RequirementsStatus {
            pdflatex_available: true,
            pdflatex_path: Some("/path".to_string()),
            all_satisfied: true,
        };

        let cloned = status.clone();
        assert_eq!(status.pdflatex_available, cloned.pdflatex_available);
        assert_eq!(status.pdflatex_path, cloned.pdflatex_path);
        assert_eq!(status.all_satisfied, cloned.all_satisfied);
    }

    #[test]
    fn test_requirements_status_debug() {
        let status = RequirementsStatus {
            pdflatex_available: false,
            pdflatex_path: None,
            all_satisfied: false,
        };

        let debug_str = format!("{:?}", status);
        assert!(debug_str.contains("RequirementsStatus"));
        assert!(debug_str.contains("pdflatex_available: false"));
    }

    #[test]
    fn test_check_requirements_returns_status() {
        let status = check_requirements();
        // all_satisfied should match pdflatex_available
        assert_eq!(status.all_satisfied, status.pdflatex_available);
    }

    #[test]
    fn test_check_requirements_path_consistency() {
        let status = check_requirements();
        // If pdflatex is available, path should be Some; otherwise None
        if status.pdflatex_available {
            assert!(status.pdflatex_path.is_some());
        }
    }
}

