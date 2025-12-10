import { useState } from 'react';
import './Toolbar.css';
import { HelpDialog } from './HelpDialog';

interface ToolbarProps {
  onOpen?: () => void;
  onSave?: () => void;
  onSaveAs?: () => void;
  onCompile?: () => void;
  onToggleLog?: () => void;
  logVisible?: boolean;
}

export function Toolbar({
  onOpen,
  onSave,
  onSaveAs,
  onCompile,
  onToggleLog,
  logVisible,
}: ToolbarProps) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="toolbar" data-testid="toolbar">
      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          title="Open File"
          onClick={onOpen}
          data-testid="toolbar-open"
        >
          Open
        </button>
        <button className="toolbar-btn" title="Save" onClick={onSave} data-testid="toolbar-save">
          Save
        </button>
        <button
          className="toolbar-btn"
          title="Save As"
          onClick={onSaveAs}
          data-testid="toolbar-save-as"
        >
          Save As
        </button>
      </div>
      <div className="toolbar-group">
        <button
          className="toolbar-btn toolbar-btn-primary"
          title="Compile LaTeX"
          onClick={onCompile}
          data-testid="toolbar-compile"
        >
          Compile
        </button>
      </div>
      <div className="toolbar-group">
        <button
          className={`toolbar-btn toolbar-btn-icon ${logVisible ? 'toolbar-btn-active' : ''}`}
          title="Toggle Compiler Log"
          onClick={onToggleLog}
          data-testid="toolbar-log"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 3h12v1H2V3zm0 3h12v1H2V6zm0 3h8v1H2V9zm0 3h10v1H2v-1z" />
          </svg>
        </button>
      </div>
      <div className="toolbar-spacer" />
      <div className="toolbar-group">
        <button
          className="toolbar-btn toolbar-btn-icon"
          title="Help & Info"
          onClick={() => setShowHelp(true)}
          data-testid="toolbar-help"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM0 8a8 8 0 1116 0A8 8 0 010 8z" />
            <path d="M5.3 6.2c.2-1.5 1.4-2.2 2.7-2.2 1.5 0 2.7.9 2.7 2.3 0 1.1-.8 1.7-1.5 2.1-.6.4-.9.7-.9 1.3v.3H7v-.4c0-.9.5-1.4 1.1-1.8.5-.3.9-.6.9-1.2 0-.6-.5-1-1.2-1-.8 0-1.2.5-1.3 1.2l-1.2-.3zM7 11h1.5v1.5H7V11z" />
          </svg>
        </button>
      </div>
      {showHelp && <HelpDialog onClose={() => setShowHelp(false)} />}
    </div>
  );
}
