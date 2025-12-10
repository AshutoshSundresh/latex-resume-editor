import { useState, useCallback, useEffect } from 'react';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import './styles/theme.css';
import './App.css';
import { Toolbar } from './components/Toolbar';
import { EditorPane } from './components/EditorPane';
import { PdfPane } from './components/PdfPane';
import { StatusBar, BuildStatus } from './components/StatusBar';
import { CompilerLog } from './components/CompilerLog';
import { LandingPage } from './components/LandingPage';
import {
  openFile,
  saveFile,
  saveFileAs,
  initWorkspace,
  compileLatex,
  checkRequirements,
  debugPdflatex,
  readPdfAsDataUrl,
  RequirementsStatus,
} from './tauri/api';

function App() {
  // Landing page state
  const [showLanding, setShowLanding] = useState(true);
  const [requirements, setRequirements] = useState<RequirementsStatus | null>(null);
  const [checkingRequirements, setCheckingRequirements] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Editor state
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState('No file open');
  const [buildStatus, setBuildStatus] = useState<BuildStatus>('idle');
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [isDirty, setIsDirty] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | undefined>(undefined);
  const [compilerLog, setCompilerLog] = useState('');
  const [showLog, setShowLog] = useState(false);


  // Check requirements and initialize workspace on mount
  useEffect(() => {
    const init = async () => {
      try {
        await initWorkspace();
        const status = await checkRequirements();
        setRequirements(status);

        // Get debug info
        const debug = await debugPdflatex();
        setDebugInfo(debug);

        // If all requirements are satisfied, skip landing page
        if (status.all_satisfied) {
          setShowLanding(false);
        }
      } catch (error) {
        console.error('Failed to initialize:', error);
      } finally {
        setCheckingRequirements(false);
      }
    };
    init();
  }, []);

  const handleRecheck = useCallback(async () => {
    setCheckingRequirements(true);
    try {
      const status = await checkRequirements();
      setRequirements(status);
      if (status.all_satisfied) {
        setShowLanding(false);
      }
    } catch (error) {
      console.error('Failed to check requirements:', error);
    } finally {
      setCheckingRequirements(false);
    }
  }, []);

  const handleContinue = useCallback(() => {
    setShowLanding(false);
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
        // Clear PDF and log when opening new file
        setPdfUrl(undefined);
        setBuildStatus('idle');
        setCompilerLog('');
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
      setCompilerLog('Compiling...');

      const result = await compileLatex();

      // Store the raw log
      setCompilerLog(result.log || result.error_message || 'No output');

      if (result.success && result.pdf_path) {
        setBuildStatus('success');
        try {
          const dataUrl = await readPdfAsDataUrl(result.pdf_path);
          setPdfUrl(dataUrl);
        } catch (e) {
          console.error('Failed to read PDF:', e);
          setCompilerLog((prev) => prev + '\n\nFailed to load PDF preview.');
        }
      } else {
        setBuildStatus('error');
        setShowLog(true); // Show log on error
      }
    } catch (error) {
      setBuildStatus('error');
      setCompilerLog(`Compile error: ${error}`);
      setShowLog(true);
    }
  }, [filePath, content]);

  const handleToggleLog = useCallback(() => {
    setShowLog((prev) => !prev);
  }, []);

  const displayFileName = isDirty ? `${fileName} •` : fileName;

  // Show loading state while checking requirements
  if (checkingRequirements) {
    return (
      <div className="app-container loading" data-testid="app-loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  // Show landing page if requirements not satisfied or first launch
  if (showLanding && requirements) {
    return (
      <LandingPage
        requirements={requirements}
        onContinue={handleContinue}
        onRecheck={handleRecheck}
        debugInfo={debugInfo}
      />
    );
  }

  return (
    <div className="app-container" data-testid="app-container">
      <Toolbar
        onOpen={handleOpen}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onCompile={handleCompile}
        onToggleLog={handleToggleLog}
        logVisible={showLog}
      />
      <div className="main-content">
        <Allotment>
          <Allotment.Pane minSize={300}>
            <Allotment vertical>
              <Allotment.Pane minSize={200}>
                <EditorPane
                  content={content}
                  onChange={handleContentChange}
                  onCursorChange={handleCursorChange}
                />
              </Allotment.Pane>
              {showLog && (
                <Allotment.Pane minSize={80} preferredSize={150}>
                  <CompilerLog log={compilerLog} visible={true} />
                </Allotment.Pane>
              )}
            </Allotment>
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
