import './Toolbar.css';

interface ToolbarProps {
  onOpen?: () => void;
  onSave?: () => void;
  onSaveAs?: () => void;
  onCompile?: () => void;
  onSettings?: () => void;
}

export function Toolbar({ onOpen, onSave, onSaveAs, onCompile, onSettings }: ToolbarProps) {
  return (
    <div className="toolbar" data-testid="toolbar">
      <div className="toolbar-group">
        <button className="toolbar-btn" title="Open File" onClick={onOpen}>
          Open
        </button>
        <button className="toolbar-btn" title="Save" onClick={onSave}>
          Save
        </button>
        <button className="toolbar-btn" title="Save As" onClick={onSaveAs}>
          Save As
        </button>
      </div>
      <div className="toolbar-group">
        <button
          className="toolbar-btn toolbar-btn-primary"
          title="Compile LaTeX"
          onClick={onCompile}
        >
          Compile
        </button>
      </div>
      <div className="toolbar-group">
        <button className="toolbar-btn" title="Settings" onClick={onSettings}>
          Settings
        </button>
      </div>
    </div>
  );
}
