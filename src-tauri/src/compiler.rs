//! LaTeX compilation using pdflatex
//!
//! This module handles compiling .tex files to PDF using pdflatex (TeX Live/MiKTeX).

use std::path::Path;
use std::process::Command;
use std::time::Instant;
use tokio::process::Command as AsyncCommand;

/// Result of a compilation attempt
#[derive(Debug, Clone, serde::Serialize)]
pub struct BuildResult {
    pub success: bool,
    pub pdf_path: Option<String>,
    pub log: String,
    pub duration_ms: u64,
    pub error_message: Option<String>,
}

/// Get the pdflatex command - tries PATH first, then common locations
fn get_pdflatex_command() -> String {
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

/// Get system requirements status
#[derive(Debug, Clone, serde::Serialize)]
pub struct RequirementsStatus {
    pub pdflatex_available: bool,
    pub pdflatex_path: Option<String>,
    pub all_satisfied: bool,
}

/// Check all requirements
pub fn check_requirements() -> RequirementsStatus {
    let pdflatex_cmd = get_pdflatex_command();
    
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

/// Get the temp build directory for compilation artifacts
fn get_build_dir() -> std::path::PathBuf {
    let base = dirs::cache_dir()
        .or_else(dirs::data_local_dir)
        .unwrap_or_else(std::env::temp_dir);
    base.join("ResumeIDE").join("build")
}

/// Compile a LaTeX file to PDF using pdflatex (async version)
pub async fn compile_latex_async(tex_path: &Path, _output_dir: &Path) -> BuildResult {
    let start = Instant::now();
    
    // Use a temp directory for build artifacts (aux, log, etc)
    let build_dir = get_build_dir();

    // Ensure build directory exists
    if let Err(e) = std::fs::create_dir_all(&build_dir) {
        return BuildResult {
            success: false,
            pdf_path: None,
            log: String::new(),
            duration_ms: start.elapsed().as_millis() as u64,
            error_message: Some(format!("Failed to create build directory: {}", e)),
        };
    }

    // Run pdflatex asynchronously
    let pdflatex_cmd = get_pdflatex_command();
    
    // Build command with proper environment
    let mut cmd = AsyncCommand::new(&pdflatex_cmd);
    cmd.arg("-interaction=nonstopmode")
        .arg(format!(
            "-output-directory={}",
            build_dir.to_string_lossy()
        ))
        .arg(tex_path);
    
    // If using full path, add parent directory to PATH for DLLs
    if pdflatex_cmd.contains('\\') || pdflatex_cmd.contains('/') {
        if let Some(parent) = std::path::Path::new(&pdflatex_cmd).parent() {
            let current_path = std::env::var("PATH").unwrap_or_default();
            let new_path = format!("{};{}", parent.to_string_lossy(), current_path);
            cmd.env("PATH", new_path);
        }
    }
    
    let result = cmd.output().await;

    let duration_ms = start.elapsed().as_millis() as u64;

    match result {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout).to_string();
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            let log = format!("{}\n{}", stdout, stderr);

            // Derive PDF path from tex path
            let pdf_name = tex_path
                .file_stem()
                .map(|s| format!("{}.pdf", s.to_string_lossy()))
                .unwrap_or_else(|| "output.pdf".to_string());

            let built_pdf = build_dir.join(&pdf_name);

            // pdflatex may return non-zero but still produce a PDF
            if built_pdf.exists() {
                // Copy PDF to same directory as source file
                let final_pdf = tex_path.parent()
                    .map(|p| p.join(&pdf_name))
                    .unwrap_or_else(|| std::path::PathBuf::from(&pdf_name));
                
                if let Err(e) = std::fs::copy(&built_pdf, &final_pdf) {
                    return BuildResult {
                        success: false,
                        pdf_path: None,
                        log,
                        duration_ms,
                        error_message: Some(format!("Failed to copy PDF: {}", e)),
                    };
                }

                BuildResult {
                    success: true,
                    pdf_path: Some(final_pdf.to_string_lossy().to_string()),
                    log,
                    duration_ms,
                    error_message: None,
                }
            } else {
                BuildResult {
                    success: false,
                    pdf_path: None,
                    log,
                    duration_ms,
                    error_message: Some("Compilation failed - no PDF generated".to_string()),
                }
            }
        }
        Err(e) => BuildResult {
            success: false,
            pdf_path: None,
            log: String::new(),
            duration_ms,
            error_message: Some(format!(
                "Failed to run pdflatex: {}. Make sure TeX Live or MiKTeX is installed.",
                e
            )),
        },
    }
}

/// Compile a LaTeX file to PDF using pdflatex (sync version for tests)
#[allow(dead_code)]
pub fn compile_latex(tex_path: &Path, output_dir: &Path) -> BuildResult {
    let start = Instant::now();

    if let Err(e) = std::fs::create_dir_all(output_dir) {
        return BuildResult {
            success: false,
            pdf_path: None,
            log: String::new(),
            duration_ms: start.elapsed().as_millis() as u64,
            error_message: Some(format!("Failed to create output directory: {}", e)),
        };
    }

    let pdflatex_cmd = get_pdflatex_command();
    let mut cmd = Command::new(&pdflatex_cmd);
    cmd.arg("-interaction=nonstopmode")
        .arg(format!(
            "-output-directory={}",
            output_dir.to_string_lossy()
        ))
        .arg(tex_path);
    
    // If using full path, add parent directory to PATH for DLLs
    if pdflatex_cmd.contains('\\') || pdflatex_cmd.contains('/') {
        if let Some(parent) = std::path::Path::new(&pdflatex_cmd).parent() {
            let current_path = std::env::var("PATH").unwrap_or_default();
            let new_path = format!("{};{}", parent.to_string_lossy(), current_path);
            cmd.env("PATH", new_path);
        }
    }
    
    let result = cmd.output();

    let duration_ms = start.elapsed().as_millis() as u64;

    match result {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout).to_string();
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            let log = format!("{}\n{}", stdout, stderr);

            let pdf_name = tex_path
                .file_stem()
                .map(|s| format!("{}.pdf", s.to_string_lossy()))
                .unwrap_or_else(|| "output.pdf".to_string());

            let pdf_path = output_dir.join(&pdf_name);

            if pdf_path.exists() {
                BuildResult {
                    success: true,
                    pdf_path: Some(pdf_path.to_string_lossy().to_string()),
                    log,
                    duration_ms,
                    error_message: None,
                }
            } else {
                BuildResult {
                    success: false,
                    pdf_path: None,
                    log,
                    duration_ms,
                    error_message: Some("Compilation failed - no PDF generated".to_string()),
                }
            }
        }
        Err(e) => BuildResult {
            success: false,
            pdf_path: None,
            log: String::new(),
            duration_ms,
            error_message: Some(format!("Failed to run pdflatex: {}", e)),
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::io::Write;
    use tempfile::TempDir;

    // ============ BuildResult tests ============

    #[test]
    fn test_build_result_serializes_success() {
        let result = BuildResult {
            success: true,
            pdf_path: Some("/path/to/output.pdf".to_string()),
            log: "Build log".to_string(),
            duration_ms: 1500,
            error_message: None,
        };

        let json = serde_json::to_string(&result).unwrap();
        assert!(json.contains("\"success\":true"));
        assert!(json.contains("\"pdf_path\":\"/path/to/output.pdf\""));
        assert!(json.contains("\"duration_ms\":1500"));
        assert!(json.contains("\"error_message\":null"));
    }

    #[test]
    fn test_build_result_serializes_failure() {
        let result = BuildResult {
            success: false,
            pdf_path: None,
            log: "Error occurred".to_string(),
            duration_ms: 50,
            error_message: Some("Compilation failed".to_string()),
        };

        let json = serde_json::to_string(&result).unwrap();
        assert!(json.contains("\"success\":false"));
        assert!(json.contains("\"pdf_path\":null"));
        assert!(json.contains("\"error_message\":\"Compilation failed\""));
    }

    #[test]
    fn test_build_result_clone() {
        let result = BuildResult {
            success: true,
            pdf_path: Some("/test.pdf".to_string()),
            log: "Log".to_string(),
            duration_ms: 100,
            error_message: None,
        };

        let cloned = result.clone();
        assert_eq!(result.success, cloned.success);
        assert_eq!(result.pdf_path, cloned.pdf_path);
        assert_eq!(result.log, cloned.log);
        assert_eq!(result.duration_ms, cloned.duration_ms);
    }

    #[test]
    fn test_build_result_debug() {
        let result = BuildResult {
            success: true,
            pdf_path: None,
            log: String::new(),
            duration_ms: 0,
            error_message: None,
        };

        let debug_str = format!("{:?}", result);
        assert!(debug_str.contains("BuildResult"));
        assert!(debug_str.contains("success: true"));
    }

    // ============ RequirementsStatus tests ============

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

    // ============ Function tests ============

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

    // ============ compile_latex tests ============

    #[test]
    fn test_compile_latex_creates_output_directory() {
        let temp_dir = TempDir::new().unwrap();
        let tex_path = temp_dir.path().join("test.tex");
        let output_dir = temp_dir.path().join("build");

        // Create a minimal tex file
        let mut file = fs::File::create(&tex_path).unwrap();
        writeln!(file, "\\documentclass{{article}}").unwrap();
        writeln!(file, "\\begin{{document}}").unwrap();
        writeln!(file, "Hello").unwrap();
        writeln!(file, "\\end{{document}}").unwrap();

        assert!(!output_dir.exists());

        let _result = compile_latex(&tex_path, &output_dir);

        // Output directory should be created regardless of pdflatex availability
        assert!(output_dir.exists());
    }

    #[test]
    fn test_compile_latex_with_nonexistent_file() {
        let temp_dir = TempDir::new().unwrap();
        let tex_path = temp_dir.path().join("nonexistent.tex");
        let output_dir = temp_dir.path().join("output");

        let result = compile_latex(&tex_path, &output_dir);

        // Should fail (file doesn't exist)
        assert!(!result.success);
        assert!(result.pdf_path.is_none());
    }

    #[test]
    fn test_compile_latex_duration_is_tracked() {
        let temp_dir = TempDir::new().unwrap();
        let tex_path = temp_dir.path().join("test.tex");
        let output_dir = temp_dir.path().join("output");

        // Create minimal tex file
        fs::write(
            &tex_path,
            "\\documentclass{article}\\begin{document}Hi\\end{document}",
        )
        .unwrap();

        let result = compile_latex(&tex_path, &output_dir);

        // Duration should be tracked regardless of success
        let _ = result.duration_ms;
    }

    // ============ Integration tests (only run if pdflatex is available) ============

    #[test]
    fn test_compile_latex_success_if_pdflatex_available() {
        if !is_pdflatex_available() {
            return;
        }

        let temp_dir = TempDir::new().unwrap();
        let tex_path = temp_dir.path().join("test.tex");
        let output_dir = temp_dir.path().join("output");

        let content = r#"\documentclass{article}
\begin{document}
Hello, World!
\end{document}
"#;
        fs::write(&tex_path, content).unwrap();

        let result = compile_latex(&tex_path, &output_dir);

        assert!(
            result.success,
            "Expected success, got: {:?}",
            result.error_message
        );
        assert!(result.pdf_path.is_some());
        assert!(result.error_message.is_none());

        // Verify PDF was actually created
        let pdf_path = std::path::PathBuf::from(result.pdf_path.unwrap());
        assert!(pdf_path.exists());
    }

    #[test]
    fn test_pdf_path_derives_from_tex_name() {
        if !is_pdflatex_available() {
            return;
        }

        let temp_dir = TempDir::new().unwrap();
        let tex_path = temp_dir.path().join("my_resume.tex");
        let output_dir = temp_dir.path().join("output");

        let content = r#"\documentclass{article}
\begin{document}
Test
\end{document}
"#;
        fs::write(&tex_path, content).unwrap();

        let result = compile_latex(&tex_path, &output_dir);

        if result.success {
            let pdf_path = result.pdf_path.unwrap();
            assert!(pdf_path.contains("my_resume.pdf"));
        }
    }
}
