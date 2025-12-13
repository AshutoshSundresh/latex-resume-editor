//! Diagnostics parsing for LaTeX compilation output
//!
//! Parses tectonic/LaTeX compiler output to extract errors and warnings.

use serde::Serialize;

/// Severity level of a diagnostic
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Severity {
    Error,
    Warning,
    Info,
}

/// A single diagnostic message from the compiler
#[derive(Debug, Clone, Serialize)]
pub struct Diagnostic {
    pub severity: Severity,
    pub message: String,
    pub file: Option<String>,
    pub line: Option<u32>,
    pub column: Option<u32>,
}

impl Diagnostic {
    /// Create a new error diagnostic
    pub fn error(message: impl Into<String>) -> Self {
        Self {
            severity: Severity::Error,
            message: message.into(),
            file: None,
            line: None,
            column: None,
        }
    }

    /// Create a new warning diagnostic
    pub fn warning(message: impl Into<String>) -> Self {
        Self {
            severity: Severity::Warning,
            message: message.into(),
            file: None,
            line: None,
            column: None,
        }
    }

    /// Set the file for this diagnostic
    pub fn with_file(mut self, file: impl Into<String>) -> Self {
        self.file = Some(file.into());
        self
    }

    /// Set the line number for this diagnostic
    pub fn with_line(mut self, line: u32) -> Self {
        self.line = Some(line);
        self
    }

    /// Set the column for this diagnostic
    pub fn with_column(mut self, column: u32) -> Self {
        self.column = Some(column);
        self
    }
}

/// Parse compiler output and extract diagnostics
pub fn parse_diagnostics(output: &str) -> Vec<Diagnostic> {
    let mut diagnostics = Vec::new();

    for line in output.lines() {
        // Match LaTeX error pattern: "! LaTeX Error: ..."
        if line.starts_with("! ") || line.contains("! LaTeX Error:") {
            let message = line
                .trim_start_matches("! ")
                .trim_start_matches("LaTeX Error: ")
                .to_string();
            diagnostics.push(Diagnostic::error(message));
        }
        // Match "error:" pattern from tectonic
        else if line.to_lowercase().contains("error:") {
            let message = extract_after_pattern(line, "error:");
            if !message.is_empty() {
                diagnostics.push(Diagnostic::error(message));
            }
        }
        // Match warning patterns
        else if line.to_lowercase().contains("warning:") {
            let message = extract_after_pattern(line, "warning:");
            if !message.is_empty() {
                diagnostics.push(Diagnostic::warning(message));
            }
        }
        // Match "LaTeX Warning:" pattern
        else if line.contains("LaTeX Warning:") {
            let message = extract_after_pattern(line, "LaTeX Warning:");
            if !message.is_empty() {
                diagnostics.push(Diagnostic::warning(message));
            }
        }
        // Match line number pattern: "l.123 ..."
        else if line.starts_with("l.") {
            if let Some(diag) = diagnostics.last_mut() {
                if let Some(line_num) = parse_line_number(line) {
                    diag.line = Some(line_num);
                }
            }
        }
    }

    diagnostics
}

/// Extract the message after a pattern (case-insensitive)
fn extract_after_pattern(line: &str, pattern: &str) -> String {
    let lower = line.to_lowercase();
    if let Some(pos) = lower.find(&pattern.to_lowercase()) {
        line[pos + pattern.len()..].trim().to_string()
    } else {
        String::new()
    }
}

/// Parse line number from "l.123 ..." format
fn parse_line_number(line: &str) -> Option<u32> {
    let trimmed = line.trim_start_matches("l.");
    let num_str: String = trimmed.chars().take_while(|c| c.is_ascii_digit()).collect();
    num_str.parse().ok()
}

#[cfg(test)]
mod tests {
    use super::*;

    // ============ Diagnostic struct tests ============

    #[test]
    fn test_diagnostic_error_creation() {
        let diag = Diagnostic::error("Undefined control sequence");
        assert_eq!(diag.severity, Severity::Error);
        assert_eq!(diag.message, "Undefined control sequence");
        assert!(diag.file.is_none());
        assert!(diag.line.is_none());
    }

    #[test]
    fn test_diagnostic_warning_creation() {
        let diag = Diagnostic::warning("Font shape not available");
        assert_eq!(diag.severity, Severity::Warning);
        assert_eq!(diag.message, "Font shape not available");
    }

    #[test]
    fn test_diagnostic_with_file() {
        let diag = Diagnostic::error("Error").with_file("resume.tex");
        assert_eq!(diag.file, Some("resume.tex".to_string()));
    }

    #[test]
    fn test_diagnostic_with_line() {
        let diag = Diagnostic::error("Error").with_line(42);
        assert_eq!(diag.line, Some(42));
    }

    #[test]
    fn test_diagnostic_with_column() {
        let diag = Diagnostic::error("Error").with_column(15);
        assert_eq!(diag.column, Some(15));
    }

    #[test]
    fn test_diagnostic_builder_chain() {
        let diag = Diagnostic::error("Undefined command")
            .with_file("main.tex")
            .with_line(10)
            .with_column(5);

        assert_eq!(diag.severity, Severity::Error);
        assert_eq!(diag.message, "Undefined command");
        assert_eq!(diag.file, Some("main.tex".to_string()));
        assert_eq!(diag.line, Some(10));
        assert_eq!(diag.column, Some(5));
    }

    #[test]
    fn test_diagnostic_serializes() {
        let diag = Diagnostic::error("Test error").with_line(5);
        let json = serde_json::to_string(&diag).unwrap();
        assert!(json.contains("\"severity\":\"error\""));
        assert!(json.contains("\"message\":\"Test error\""));
        assert!(json.contains("\"line\":5"));
    }

    #[test]
    fn test_severity_serializes_lowercase() {
        let error = Severity::Error;
        let warning = Severity::Warning;
        let info = Severity::Info;

        assert_eq!(serde_json::to_string(&error).unwrap(), "\"error\"");
        assert_eq!(serde_json::to_string(&warning).unwrap(), "\"warning\"");
        assert_eq!(serde_json::to_string(&info).unwrap(), "\"info\"");
    }

    // ============ Parser tests ============

    #[test]
    fn test_parse_empty_output() {
        let diagnostics = parse_diagnostics("");
        assert!(diagnostics.is_empty());
    }

    #[test]
    fn test_parse_clean_output() {
        let output = "This is XeTeX, Version 3.14159265\nOutput written on resume.pdf";
        let diagnostics = parse_diagnostics(output);
        assert!(diagnostics.is_empty());
    }

    #[test]
    fn test_parse_latex_error() {
        let output = "! LaTeX Error: File `missing.sty' not found.";
        let diagnostics = parse_diagnostics(output);

        assert_eq!(diagnostics.len(), 1);
        assert_eq!(diagnostics[0].severity, Severity::Error);
        assert!(diagnostics[0]
            .message
            .contains("File `missing.sty' not found"));
    }

    #[test]
    fn test_parse_undefined_control_sequence() {
        let output = "! Undefined control sequence.\nl.15 \\badcommand";
        let diagnostics = parse_diagnostics(output);

        assert_eq!(diagnostics.len(), 1);
        assert_eq!(diagnostics[0].severity, Severity::Error);
        assert_eq!(diagnostics[0].line, Some(15));
    }

    #[test]
    fn test_parse_tectonic_error() {
        let output = "error: the main file must be readable";
        let diagnostics = parse_diagnostics(output);

        assert_eq!(diagnostics.len(), 1);
        assert_eq!(diagnostics[0].severity, Severity::Error);
        assert!(diagnostics[0]
            .message
            .contains("main file must be readable"));
    }

    #[test]
    fn test_parse_warning() {
        let output = "LaTeX Warning: Citation `foo' on page 1 undefined";
        let diagnostics = parse_diagnostics(output);

        assert_eq!(diagnostics.len(), 1);
        assert_eq!(diagnostics[0].severity, Severity::Warning);
        assert!(diagnostics[0].message.contains("Citation"));
    }

    #[test]
    fn test_parse_multiple_diagnostics() {
        let output = r#"
! Undefined control sequence.
l.10 \foo
LaTeX Warning: Label not defined
! LaTeX Error: Environment undefined.
l.25
        "#;

        let diagnostics = parse_diagnostics(output);

        assert!(diagnostics.len() >= 2);
        assert!(diagnostics.iter().any(|d| d.severity == Severity::Error));
        assert!(diagnostics.iter().any(|d| d.severity == Severity::Warning));
    }

    #[test]
    fn test_parse_line_number() {
        assert_eq!(parse_line_number("l.42 \\foo"), Some(42));
        assert_eq!(parse_line_number("l.1 text"), Some(1));
        assert_eq!(parse_line_number("l.999"), Some(999));
        assert_eq!(parse_line_number("not a line"), None);
    }

    #[test]
    fn test_extract_after_pattern() {
        assert_eq!(
            extract_after_pattern("error: something bad", "error:"),
            "something bad"
        );
        assert_eq!(
            extract_after_pattern("ERROR: uppercase", "error:"),
            "uppercase"
        );
        assert_eq!(extract_after_pattern("no match", "error:"), "");
    }

    #[test]
    fn test_diagnostic_clone() {
        let diag = Diagnostic::error("Test").with_line(5);
        let cloned = diag.clone();
        assert_eq!(diag.message, cloned.message);
        assert_eq!(diag.line, cloned.line);
    }

    #[test]
    fn test_severity_equality() {
        assert_eq!(Severity::Error, Severity::Error);
        assert_ne!(Severity::Error, Severity::Warning);
    }
}
