import { useState, useCallback, useEffect } from 'react';
import { Allotment } from 'allotment';
import { convertFileSrc } from '@tauri-apps/api/core';
import 'allotment/dist/style.css';
import './styles/theme.css';
import './App.css';
import { Toolbar } from './components/Toolbar';
import { EditorPane } from './components/EditorPane';
import { PdfPane } from './components/PdfPane';
import { StatusBar, BuildStatus } from './components/StatusBar';
import { openFile, saveFile, saveFileAs, initWorkspace, compileLatex } from './tauri/api';
import { useAutosave } from './hooks/useAutosave';

function App() {
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState('No file open');
  const [buildStatus, setBuildStatus] = useState<BuildStatus>('idle');
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [isDirty, setIsDirty] = useState(false);
  const [autosaveEnabled] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string | undefined>(undefined);
  const [buildLog, setBuildLog] = useState<string>('');

  // Initialize workspace on mount
  useEffect(() => {
    initWorkspace().catch(console.error);
  }, []);

  // Autosave hook
  const handleAutosave = useCallback(async () => {
    if (filePath) {
      await saveFile(content);
      setOriginalContent(content);
    }
  }, [filePath, content]);

  useAutosave({
    content,
    filePath,
    onSave: handleAutosave,
    delay: 1000,
    enabled: autosaveEnabled,
  });

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
        // Clear PDF when opening new file
        setPdfUrl(undefined);
        setBuildStatus('idle');
      }
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  }, []);

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
  }, [filePath, content, handleSaveAs]);

  const handleCompile = useCallback(async () => {
    if (!filePath) {
      console.error('No file open to compile');
      return;
    }

    try {
      // Save before compiling
      await saveFile(content);
      setOriginalContent(content);

      setBuildStatus('building');
      setBuildLog('');

      const result = await compileLatex();

      setBuildLog(result.log);

      if (result.success && result.pdf_path) {
        setBuildStatus('success');
        // Convert file path to URL for iframe with cache-busting
        const url = convertFileSrc(result.pdf_path) + `?t=${Date.now()}`;
        setPdfUrl(url);
      } else {
        setBuildStatus('error');
        console.error('Compilation failed:', result.error_message);
      }
    } catch (error) {
      setBuildStatus('error');
      console.error('Compile error:', error);
    }
  }, [filePath, content]);

  const handleSettings = useCallback(() => {
    // TODO: Implement settings
    console.log('Settings clicked');
    console.log('Build log:', buildLog);
  }, [buildLog]);

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
            <PdfPane pdfUrl={pdfUrl} />
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
