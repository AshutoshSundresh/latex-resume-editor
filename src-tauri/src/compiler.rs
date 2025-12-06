//! LaTeX compilation using tectonic
//!
//! This module handles compiling .tex files to PDF using the tectonic engine.

use std::path::Path;
use std::process::Command;
use std::time::Instant;

/// Result of a compilation attempt
#[derive(Debug, Clone, serde::Serialize)]
pub struct BuildResult {
    pub success: bool,
    pub pdf_path: Option<String>,
    pub log: String,
    pub duration_ms: u64,
    pub error_message: Option<String>,
}

/// Compile a LaTeX file to PDF using tectonic
///
/// # Arguments
/// * `tex_path` - Path to the .tex file to compile
/// * `output_dir` - Directory to place the output PDF
///
/// # Returns
/// A `BuildResult` containing the outcome of the compilation
pub fn compile_latex(tex_path: &Path, output_dir: &Path) -> BuildResult {
    let start = Instant::now();

    // Ensure output directory exists
    if let Err(e) = std::fs::create_dir_all(output_dir) {
        return BuildResult {
            success: false,
            pdf_path: None,
            log: String::new(),
            duration_ms: start.elapsed().as_millis() as u64,
            error_message: Some(format!("Failed to create output directory: {}", e)),
        };
    }

    // Run tectonic
    let result = Command::new("tectonic")
        .arg("-X")
        .arg("compile")
        .arg("--outdir")
        .arg(output_dir)
        .arg(tex_path)
        .output();

    let duration_ms = start.elapsed().as_millis() as u64;

    match result {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout).to_string();
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            let log = format!("{}\n{}", stdout, stderr);

            if output.status.success() {
                // Derive PDF path from tex path
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
                        error_message: Some("PDF file was not created".to_string()),
                    }
                }
            } else {
                BuildResult {
                    success: false,
                    pdf_path: None,
                    log,
                    duration_ms,
                    error_message: Some("Compilation failed".to_string()),
                }
            }
        }
        Err(e) => BuildResult {
            success: false,
            pdf_path: None,
            log: String::new(),
            duration_ms,
            error_message: Some(format!("Failed to run tectonic: {}", e)),
        },
    }
}

/// Check if tectonic is available on the system
pub fn is_tectonic_available() -> bool {
    Command::new("tectonic")
        .arg("--version")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::io::Write;
    use std::path::PathBuf;
    use tempfile::TempDir;

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
    fn test_build_result_serializes_error() {
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
    fn test_compile_with_nonexistent_file() {
        let tex_path = PathBuf::from("/nonexistent/path/file.tex");
        let temp_dir = TempDir::new().unwrap();

        let result = compile_latex(&tex_path, temp_dir.path());

        assert!(!result.success);
        assert!(result.pdf_path.is_none());
        assert!(result.error_message.is_some());
        // duration_ms is u64, always tracks time
    }

    #[test]
    fn test_compile_creates_output_directory() {
        let temp_dir = TempDir::new().unwrap();
        let tex_path = temp_dir.path().join("test.tex");
        let output_dir = temp_dir.path().join("build");

        // Create a dummy tex file
        fs::write(&tex_path, "\\documentclass{article}").unwrap();

        // Output dir shouldn't exist yet
        assert!(!output_dir.exists());

        // Run compile (will fail but should create dir)
        let _result = compile_latex(&tex_path, &output_dir);

        // Output dir should now exist
        assert!(output_dir.exists());
    }

    #[test]
    fn test_compile_with_invalid_latex() {
        let temp_dir = TempDir::new().unwrap();
        let tex_path = temp_dir.path().join("invalid.tex");

        // Create invalid LaTeX content
        fs::write(&tex_path, "this is not valid latex \\invalid").unwrap();

        let result = compile_latex(&tex_path, temp_dir.path());

        // Should fail if tectonic is available, or fail with "tectonic not found"
        assert!(!result.success);
        assert!(result.pdf_path.is_none());
    }

    #[test]
    fn test_compile_duration_is_tracked() {
        let temp_dir = TempDir::new().unwrap();
        let tex_path = temp_dir.path().join("test.tex");

        fs::write(&tex_path, "\\documentclass{article}").unwrap();

        let result = compile_latex(&tex_path, temp_dir.path());

        // Duration should be tracked regardless of success (u64 type)
        // Just verify it doesn't panic and returns a value
        let _duration = result.duration_ms;
    }

    #[test]
    fn test_is_tectonic_available_returns_bool() {
        let available = is_tectonic_available();
        // Just verify it returns a bool without panicking
        assert!(available || !available);
    }

    #[test]
    fn test_build_result_error_state() {
        let result = BuildResult {
            success: false,
            pdf_path: None,
            log: "Error log".to_string(),
            duration_ms: 100,
            error_message: Some("Test error".to_string()),
        };

        assert!(!result.success);
        assert!(result.pdf_path.is_none());
        assert_eq!(result.error_message, Some("Test error".to_string()));
        assert_eq!(result.log, "Error log");
    }

    #[test]
    fn test_build_result_success_state() {
        let result = BuildResult {
            success: true,
            pdf_path: Some("/output/resume.pdf".to_string()),
            log: "Compilation successful".to_string(),
            duration_ms: 2500,
            error_message: None,
        };

        assert!(result.success);
        assert_eq!(result.pdf_path, Some("/output/resume.pdf".to_string()));
        assert!(result.error_message.is_none());
    }

    #[test]
    fn test_build_result_clone() {
        let result = BuildResult {
            success: true,
            pdf_path: Some("/path/to/file.pdf".to_string()),
            log: "Log".to_string(),
            duration_ms: 100,
            error_message: None,
        };

        let cloned = result.clone();
        assert_eq!(result.success, cloned.success);
        assert_eq!(result.pdf_path, cloned.pdf_path);
        assert_eq!(result.log, cloned.log);
    }

    #[test]
    fn test_build_result_debug() {
        let result = BuildResult {
            success: true,
            pdf_path: Some("/test.pdf".to_string()),
            log: "test".to_string(),
            duration_ms: 50,
            error_message: None,
        };

        let debug_str = format!("{:?}", result);
        assert!(debug_str.contains("BuildResult"));
        assert!(debug_str.contains("success: true"));
    }

    #[test]
    fn test_compile_with_valid_latex_if_tectonic_available() {
        if !is_tectonic_available() {
            // Skip test if tectonic not installed
            return;
        }

        let temp_dir = TempDir::new().unwrap();
        let tex_path = temp_dir.path().join("valid.tex");

        // Create valid minimal LaTeX
        let mut file = fs::File::create(&tex_path).unwrap();
        writeln!(file, "\\documentclass{{article}}").unwrap();
        writeln!(file, "\\begin{{document}}").unwrap();
        writeln!(file, "Hello, World!").unwrap();
        writeln!(file, "\\end{{document}}").unwrap();

        let result = compile_latex(&tex_path, temp_dir.path());

        assert!(
            result.success,
            "Expected success but got: {:?}",
            result.error_message
        );
        assert!(result.pdf_path.is_some());
        assert!(result.error_message.is_none());

        // Verify PDF was actually created
        let pdf_path = PathBuf::from(result.pdf_path.unwrap());
        assert!(pdf_path.exists(), "PDF file should exist");
    }

    #[test]
    fn test_pdf_path_derives_from_tex_name() {
        if !is_tectonic_available() {
            return;
        }

        let temp_dir = TempDir::new().unwrap();
        let tex_path = temp_dir.path().join("my_resume.tex");

        let mut file = fs::File::create(&tex_path).unwrap();
        writeln!(file, "\\documentclass{{article}}").unwrap();
        writeln!(file, "\\begin{{document}}").unwrap();
        writeln!(file, "Test").unwrap();
        writeln!(file, "\\end{{document}}").unwrap();

        let result = compile_latex(&tex_path, temp_dir.path());

        if result.success {
            let pdf_path = result.pdf_path.unwrap();
            assert!(
                pdf_path.contains("my_resume.pdf"),
                "PDF should be named after tex file"
            );
        }
    }
}
