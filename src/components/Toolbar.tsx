import './Toolbar.css';

export function Toolbar() {
  return (
    <div className="toolbar" data-testid="toolbar">
      <div className="toolbar-group">
        <button className="toolbar-btn" title="Open File">
          Open
        </button>
        <button className="toolbar-btn" title="Save">
          Save
        </button>
        <button className="toolbar-btn" title="Save As">
          Save As
        </button>
      </div>
      <div className="toolbar-group">
        <button className="toolbar-btn toolbar-btn-primary" title="Compile LaTeX">
          Compile
        </button>
      </div>
      <div className="toolbar-group">
        <button className="toolbar-btn" title="Settings">
          Settings
        </button>
      </div>
    </div>
  );
}
