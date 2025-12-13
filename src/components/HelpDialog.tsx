import './HelpDialog.css';

interface HelpDialogProps {
  onClose: () => void;
}

export function HelpDialog({ onClose }: HelpDialogProps) {
  return (
    <div className="help-overlay" onClick={onClose} data-testid="help-dialog">
      <div className="help-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="help-header">
          <h2>ResumeIDE</h2>
          <button className="help-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="help-content">
          <p className="help-version">Version 0.1.0</p>

          <section className="help-section">
            <h3>About</h3>
            <p>
              A lightweight LaTeX IDE designed specifically for resume editing. Write your resume in
              LaTeX and see the PDF output instantly.
            </p>
          </section>

          <section className="help-section">
            <h3>Keyboard Shortcuts</h3>
            <div className="help-shortcuts">
              <div className="shortcut-row">
                <kbd>Ctrl</kbd> + <kbd>S</kbd>
                <span>Save file</span>
              </div>
              <div className="shortcut-row">
                <kbd>Ctrl</kbd> + <kbd>O</kbd>
                <span>Open file</span>
              </div>
            </div>
          </section>

          <section className="help-section">
            <h3>Requirements</h3>
            <p>
              Requires <strong>pdflatex</strong> to compile documents. Install via{' '}
              <a href="https://miktex.org" target="_blank" rel="noopener noreferrer">
                MiKTeX
              </a>{' '}
              or{' '}
              <a href="https://www.tug.org/texlive/" target="_blank" rel="noopener noreferrer">
                TeX Live
              </a>
              .
            </p>
          </section>

          <section className="help-section">
            <h3>Tips</h3>
            <ul>
              <li>
                Click <strong>Compile</strong> to generate your PDF
              </li>
              <li>Use the log button to view compiler output</li>
              <li>Your .tex file is auto-saved before each compile</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
