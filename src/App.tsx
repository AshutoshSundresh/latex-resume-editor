import { useState, useCallback, useEffect } from 'react';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import './styles/theme.css';
import './App.css';
import { Toolbar } from './components/Toolbar';
import { EditorPane } from './components/EditorPane';
import { PdfPane } from './components/PdfPane';
import { StatusBar, BuildStatus } from './components/StatusBar';
import { openFile, saveFile, saveFileAs, initWorkspace } from './tauri/api';

function App() {
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState('No file open');
  const [buildStatus] = useState<BuildStatus>('idle');
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [isDirty, setIsDirty] = useState(false);

  // Initialize workspace on mount
  useEffect(() => {
    initWorkspace().catch(console.error);
  }, []);

  // Track dirty state
  useEffect(() => {
    setIsDirty(content !== originalContent);
  }, [content, originalContent]);

  const handleContentChange = useCallback((value: string | undefined) => {
    setContent(value || '');
  }, []);

  const handleCursorChange = useCallback((line: number, column: number) => {
    setCursorPosition({ line, column });
  }, []);

  const handleOpen = useCallback(async () => {
    try {
      const fileInfo = await openFile();
      if (fileInfo) {
        setContent(fileInfo.content);
        setOriginalContent(fileInfo.content);
        setFilePath(fileInfo.path);
        setFileName(fileInfo.name);
      }
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  }, []);

  const handleSave = useCallback(async () => {
    try {
      if (filePath) {
        await saveFile(content);
        setOriginalContent(content);
      } else {
        // No file open, use Save As
        await handleSaveAs();
      }
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  }, [filePath, content]);

  const handleSaveAs = useCallback(async () => {
    try {
      const fileInfo = await saveFileAs(content);
      if (fileInfo) {
        setOriginalContent(fileInfo.content);
        setFilePath(fileInfo.path);
        setFileName(fileInfo.name);
      }
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  }, [content]);

  const handleCompile = useCallback(() => {
    // TODO: Implement compile functionality
    console.log('Compile clicked');
  }, []);

  const handleSettings = useCallback(() => {
    // TODO: Implement settings
    console.log('Settings clicked');
  }, []);

  const displayFileName = isDirty ? `${fileName} •` : fileName;

  return (
    <div className="app-container" data-testid="app-container">
      <Toolbar
        onOpen={handleOpen}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onCompile={handleCompile}
        onSettings={handleSettings}
      />
      <div className="main-content">
        <Allotment>
          <Allotment.Pane minSize={300}>
            <EditorPane
              content={content}
              onChange={handleContentChange}
              onCursorChange={handleCursorChange}
            />
          </Allotment.Pane>
          <Allotment.Pane minSize={300}>
            <PdfPane />
          </Allotment.Pane>
        </Allotment>
      </div>
      <StatusBar
        buildStatus={buildStatus}
        filePath={displayFileName}
        line={cursorPosition.line}
        column={cursorPosition.column}
      />
    </div>
  );
}

export default App;
