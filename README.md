# ResumeIDE

Desktop LaTeX resume editor with live PDF preview, built with Tauri, React, and Rust.

## Highlights

- Split-pane editor with Monaco (LaTeX syntax highlighting) and live PDF preview
- One-click compilation with real-time error logs
- System requirement detection (pdflatex/MiKTeX) with helpful setup guidance
- Keyboard shortcuts (Ctrl+S/O/B) and unsaved changes warnings
- Built primarily for Windows

## Architecture

- **Frontend**: React 19 + TypeScript with Monaco Editor and split-pane layout
- **Backend**: Rust (Tauri 2) handling file ops, LaTeX compilation, and PDF rendering
- **Compilation**: Async pdflatex execution with build artifact management
- **State**: Shared Rust state for current file tracking; React hooks for UI state

## Tech Stack

- Tauri 2, React 19, TypeScript
- Tokio (async Rust), serde (serialization)
- Monaco Editor, Allotment (split panes)

## Local Development

1. Install deps: `npm i`
2. Start dev: `npm run dev`
3. Build: `npm run tauri build`

**Requirements**: TeX Live or MiKTeX (pdflatex) must be installed and in PATH.
