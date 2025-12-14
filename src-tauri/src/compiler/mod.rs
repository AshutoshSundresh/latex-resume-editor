//! LaTeX compilation module
//!
//! This module handles compiling .tex files to PDF using pdflatex (TeX Live/MiKTeX).

pub mod build;
pub mod pdflatex;
pub mod requirements;

pub use build::{compile_latex, compile_latex_async, BuildResult};
pub use requirements::{check_requirements, RequirementsStatus};

