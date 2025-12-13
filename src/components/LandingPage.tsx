import './LandingPage.css';

interface RequirementsStatus {
  pdflatex_available: boolean;
  pdflatex_path: string | null;
  all_satisfied: boolean;
}

interface LandingPageProps {
  requirements: RequirementsStatus;
  onContinue: () => void;
  onRecheck: () => void;
  debugInfo?: string;
}

export function LandingPage({ requirements, onContinue, onRecheck, debugInfo }: LandingPageProps) {
  return (
    <div className="landing-page" data-testid="landing-page">
      <div className="landing-content">
        <div className="landing-logo">
          <h1>ResumeIDE</h1>
          <p className="tagline">LaTeX Resume Editor</p>
        </div>

        <div className="requirements-section">
          <h2>System Requirements</h2>

          <div className="requirement-items">
            <div
              className={`requirement-item ${requirements.pdflatex_available ? 'satisfied' : 'missing'}`}
            >
              <span className="requirement-icon">
                {requirements.pdflatex_available ? '✓' : '✗'}
              </span>
              <div className="requirement-info">
                <span className="requirement-name">pdflatex</span>
                {requirements.pdflatex_available ? (
                  <span className="requirement-status found">
                    Found: {requirements.pdflatex_path}
                  </span>
                ) : (
                  <span className="requirement-status missing">Not found</span>
                )}
              </div>
            </div>
          </div>

          {!requirements.all_satisfied && (
            <div className="install-instructions">
              <h3>Installation Instructions</h3>
              <p>ResumeIDE requires a LaTeX distribution to compile your documents.</p>

              <div className="install-option">
                <h4>Option 1: MiKTeX (Recommended for Windows)</h4>
                <ol>
                  <li>
                    Download MiKTeX from{' '}
                    <a href="https://miktex.org/download" target="_blank" rel="noopener noreferrer">
                      miktex.org/download
                    </a>
                  </li>
                  <li>Run the installer and follow the setup wizard</li>
                  <li>Restart ResumeIDE after installation</li>
                </ol>
              </div>

              <div className="install-option">
                <h4>Option 2: TeX Live</h4>
                <ol>
                  <li>
                    Download TeX Live from{' '}
                    <a
                      href="https://www.tug.org/texlive/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      tug.org/texlive
                    </a>
                  </li>
                  <li>Run the installer (this may take a while)</li>
                  <li>Restart ResumeIDE after installation</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        <div className="landing-actions">
          {requirements.all_satisfied ? (
            <button className="btn-primary" onClick={onContinue}>
              Get Started
            </button>
          ) : (
            <>
              <button className="btn-secondary" onClick={onRecheck}>
                Recheck Requirements
              </button>
              <button className="btn-text" onClick={onContinue}>
                Continue Anyway (Limited Functionality)
              </button>
            </>
          )}
        </div>
        {debugInfo && (
          <pre style={{ marginTop: 20, fontSize: '0.75em', opacity: 0.6, whiteSpace: 'pre-wrap' }}>
            {debugInfo}
          </pre>
        )}
      </div>
    </div>
  );
}
