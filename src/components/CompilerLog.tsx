import './CompilerLog.css';

interface CompilerLogProps {
  log: string;
  visible: boolean;
}

export function CompilerLog({ log, visible }: CompilerLogProps) {
  if (!visible) return null;

  return (
    <div className="compiler-log" data-testid="compiler-log">
      <div className="compiler-log-header">Compiler Output</div>
      <pre className="compiler-log-content">
        {log || 'No output yet. Click Compile to build your document.'}
      </pre>
    </div>
  );
}
