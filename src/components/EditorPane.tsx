import './EditorPane.css';

interface EditorPaneProps {
  content?: string;
  onChange?: (value: string | undefined) => void;
}

export function EditorPane({ content = '', onChange }: EditorPaneProps) {
  return (
    <div className="editor-pane" data-testid="editor-pane">
      <div className="editor-placeholder">
        {/* Monaco editor will be added here */}
        <textarea
          className="editor-textarea"
          value={content}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="LaTeX editor - Monaco will be integrated here"
        />
      </div>
    </div>
  );
}
