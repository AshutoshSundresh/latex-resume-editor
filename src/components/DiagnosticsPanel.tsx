import type { Diagnostic } from '../tauri/api';
import './DiagnosticsPanel.css';

interface DiagnosticsPanelProps {
  diagnostics: Diagnostic[];
  onDiagnosticClick?: (diagnostic: Diagnostic) => void;
}

export function DiagnosticsPanel({ diagnostics, onDiagnosticClick }: DiagnosticsPanelProps) {
  const errorCount = diagnostics.filter((d) => d.severity === 'error').length;
  const warningCount = diagnostics.filter((d) => d.severity === 'warning').length;

  const handleClick = (diagnostic: Diagnostic) => {
    onDiagnosticClick?.(diagnostic);
  };

  return (
    <div className="diagnostics-panel" data-testid="diagnostics-panel">
      <div className="diagnostics-header">
        <span className="diagnostics-title">Problems</span>
        <div className="diagnostics-counts">
          {errorCount > 0 && <span className="count-error">{errorCount} errors</span>}
          {warningCount > 0 && <span className="count-warning">{warningCount} warnings</span>}
        </div>
      </div>
      <div className="diagnostics-list">
        {diagnostics.length === 0 ? (
          <div className="diagnostics-empty">No issues found</div>
        ) : (
          diagnostics.map((diagnostic, index) => (
            <button
              key={index}
              className={`diagnostic-item diagnostic-${diagnostic.severity}`}
              data-testid={`diagnostic-${diagnostic.severity}`}
              onClick={() => handleClick(diagnostic)}
            >
              <span className={`diagnostic-icon icon-${diagnostic.severity}`}>
                {diagnostic.severity === 'error'
                  ? '✕'
                  : diagnostic.severity === 'warning'
                    ? '⚠'
                    : 'ℹ'}
              </span>
              <span className="diagnostic-message">{diagnostic.message}</span>
              {diagnostic.line && (
                <span className="diagnostic-location">
                  {diagnostic.file && `${diagnostic.file}:`}Line {diagnostic.line}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
