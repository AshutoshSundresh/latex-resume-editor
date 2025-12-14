//! PDF file operations

use std::fs;
use std::io::Read;

/// Read a PDF file and return it as base64
pub fn read_pdf_base64(path: &str) -> Result<String, String> {
    let mut file = fs::File::open(path)
        .map_err(|e| format!("Failed to open PDF: {}", e))?;
    
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer)
        .map_err(|e| format!("Failed to read PDF: {}", e))?;
    
    use base64::Engine;
    Ok(base64::engine::general_purpose::STANDARD.encode(&buffer))
}

