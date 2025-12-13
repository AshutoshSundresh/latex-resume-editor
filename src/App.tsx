import { useState } from 'react';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import './styles/theme.css';
import './App.css';
import { Toolbar } from './components/Toolbar';
import { EditorPane } from './components/EditorPane';
import { PdfPane } from './components/PdfPane';
import { StatusBar, BuildStatus } from './components/StatusBar';

function App() {
  const [content, setContent] = useState('');
  const [buildStatus] = useState<BuildStatus>('idle');
  const [cursorPosition] = useState({ line: 1, column: 1 });

  const handleContentChange = (value: string | undefined) => {
    setContent(value || '');
  };

  return (
    <div className="app-container" data-testid="app-container">
      <Toolbar />
      <div className="main-content">
        <Allotment>
          <Allotment.Pane minSize={300}>
            <EditorPane content={content} onChange={handleContentChange} />
          </Allotment.Pane>
          <Allotment.Pane minSize={300}>
            <PdfPane />
          </Allotment.Pane>
        </Allotment>
      </div>
      <StatusBar
        buildStatus={buildStatus}
        filePath="No file open"
        line={cursorPosition.line}
        column={cursorPosition.column}
      />
    </div>
  );
}

export default App;
