import { forwardRef, useImperativeHandle, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import './EditorPane.css';

interface EditorPaneProps {
  content?: string;
  onChange?: (value: string | undefined) => void;
  onCursorChange?: (line: number, column: number) => void;
}

export interface EditorPaneRef {
  jumpToLine: (line: number) => void;
}

// Monaco editor type (simplified)
interface MonacoEditor {
  onDidChangeCursorPosition: (
    cb: (e: { position: { lineNumber: number; column: number } }) => void
  ) => void;
  revealLineInCenter: (line: number) => void;
  setPosition: (position: { lineNumber: number; column: number }) => void;
  focus: () => void;
}

export const EditorPane = forwardRef<EditorPaneRef, EditorPaneProps>(
  ({ content = '', onChange, onCursorChange }, ref) => {
    const editorRef = useRef<MonacoEditor | null>(null);

    useImperativeHandle(ref, () => ({
      jumpToLine: (line: number) => {
        if (editorRef.current) {
          editorRef.current.revealLineInCenter(line);
          editorRef.current.setPosition({ lineNumber: line, column: 1 });
          editorRef.current.focus();
        }
      },
    }));

    const handleEditorMount: OnMount = (editor) => {
      editorRef.current = editor as unknown as MonacoEditor;

      editor.onDidChangeCursorPosition((e) => {
        onCursorChange?.(e.position.lineNumber, e.position.column);
      });
    };

    return (
      <div className="editor-pane" data-testid="editor-pane">
        <Editor
          height="100%"
          defaultLanguage="latex"
          language="latex"
          theme="vs-dark"
          value={content}
          onChange={onChange}
          onMount={handleEditorMount}
          data-testid="monaco-editor-mock"
          options={{
            fontSize: 14,
            fontFamily: "'Cascadia Code', 'JetBrains Mono', Consolas, monospace",
            lineNumbers: 'on',
            minimap: { enabled: true },
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            padding: { top: 12 },
            renderWhitespace: 'selection',
            bracketPairColorization: { enabled: true },
            tabSize: 2,
          }}
        />
      </div>
    );
  }
);

EditorPane.displayName = 'EditorPane';
