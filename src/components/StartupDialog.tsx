import './StartupDialog.css';

interface StartupDialogProps {
  onBlankFile: () => void;
  onOpenFile: () => void;
  onLoadTemplate: () => void;
}

export function StartupDialog({ onBlankFile, onOpenFile, onLoadTemplate }: StartupDialogProps) {
  return (
    <div className="startup-dialog-overlay" data-testid="startup-dialog">
      <div className="startup-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="startup-dialog-header">
          <h2>Welcome to ResumeIDE</h2>
          <p className="startup-dialog-subtitle">Get started by choosing an option below</p>
        </div>
        <div className="startup-dialog-options">
          <button className="startup-option" onClick={onBlankFile} data-testid="startup-blank">
            <div className="startup-option-icon">📄</div>
            <div className="startup-option-content">
              <h3>Blank File</h3>
              <p>Start with an empty LaTeX document</p>
            </div>
          </button>
          <button className="startup-option" onClick={onOpenFile} data-testid="startup-open">
            <div className="startup-option-icon">📂</div>
            <div className="startup-option-content">
              <h3>Open File</h3>
              <p>Open an existing LaTeX file</p>
            </div>
          </button>
          <button className="startup-option" onClick={onLoadTemplate} data-testid="startup-template">
            <div className="startup-option-icon">📝</div>
            <div className="startup-option-content">
              <h3>Jake's Resume Template</h3>
              <p>Start with a professional resume template</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

