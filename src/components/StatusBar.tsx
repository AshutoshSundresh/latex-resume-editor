import './StatusBar.css';

export type BuildStatus = 'idle' | 'building' | 'success' | 'error';

interface StatusBarProps {
  buildStatus?: BuildStatus;
  filePath?: string;
  line?: number;
  column?: number;
}

export function StatusBar({
  buildStatus = 'idle',
  filePath = 'No file open',
  line = 1,
  column = 1,
}: StatusBarProps) {
  const getStatusText = () => {
    switch (buildStatus) {
      case 'building':
        return '⏳ Building...';
      case 'success':
        return '✓ Build succeeded';
      case 'error':
        return '✗ Build failed';
      default:
        return 'Ready';
    }
  };

  const getStatusClass = () => {
    switch (buildStatus) {
      case 'building':
        return 'status-building';
      case 'success':
        return 'status-success';
      case 'error':
        return 'status-error';
      default:
        return '';
    }
  };

  return (
    <div className="status-bar" data-testid="status-bar">
      <div className="status-left">
        <span className={`status-indicator ${getStatusClass()}`}>{getStatusText()}</span>
      </div>
      <div className="status-right">
        <span className="status-item">{filePath}</span>
        <span className="status-item status-position">
          Ln {line}, Col {column}
        </span>
      </div>
    </div>
  );
}
