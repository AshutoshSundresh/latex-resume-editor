import { useState, useCallback, useEffect, useRef } from 'react';
import { Allotment } from 'allotment';
import toast from 'react-hot-toast';
import { ask } from '@tauri-apps/plugin-dialog';
import jakesResumeTemplate from './templates/jakes-resume.tex?raw';
import 'allotment/dist/style.css';
import './styles/theme.css';
import './App.css';
import { Toolbar } from './components/Toolbar';
import { EditorPane } from './components/EditorPane';
import { PdfPane } from './components/PdfPane';
import { StatusBar, BuildStatus } from './components/StatusBar';
import { CompilerLog } from './components/CompilerLog';
import { LandingPage } from './components/LandingPage';
import { StartupDialog } from './components/StartupDialog';
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
  const [showStartupDialog, setShowStartupDialog] = useState(false);

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
  const isDirtyRef = useRef(false);


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

        // If all requirements are satisfied, skip landing page and show startup dialog
        if (status.all_satisfied) {
          setShowLanding(false);
          setShowStartupDialog(true);
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
    // Show startup dialog when continuing from landing page
    setShowStartupDialog(true);
  }, []);

  // Track dirty state
  useEffect(() => {
    const dirty = content !== originalContent;
    setIsDirty(dirty);
    isDirtyRef.current = dirty;
  }, [content, originalContent]);

  const handleContentChange = useCallback((value: string | undefined) => {
    setContent(value || '');
  }, []);

  const handleCursorChange = useCallback((line: number, column: number) => {
    setCursorPosition({ line, column });
  }, []);

  const handleOpen = useCallback(async () => {
    // Check for unsaved changes before opening a new file
    if (isDirtyRef.current) {
      const shouldProceed = await ask(
        'You have unsaved changes. Do you want to discard them and open a new file?',
        {
          title: 'Unsaved Changes',
          kind: 'warning',
          okLabel: 'Discard Changes',
          cancelLabel: 'Cancel',
        }
      );

      if (!shouldProceed) {
        return; // User cancelled, don't open new file
      }
    }

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
        setShowStartupDialog(false);
        toast.success(`Opened ${fileInfo.name}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to open file';
      toast.error(errorMessage);
      console.error('Failed to open file:', error);
    }
  }, []);

  const handleLoadTemplate = useCallback(() => {
    setContent(jakesResumeTemplate);
    setOriginalContent(jakesResumeTemplate);
    setFilePath(null);
    setShowStartupDialog(false);
    toast.success('Loaded Jake\'s Resume Template');
  }, []);

  const handleBlankFile = useCallback(() => {
    setShowStartupDialog(false);
  }, []);

  const handleSaveAs = useCallback(async () => {
    try {
      const fileInfo = await saveFileAs(content);
      if (fileInfo) {
        setOriginalContent(fileInfo.content);
        setFilePath(fileInfo.path);
        setFileName(fileInfo.name);
        toast.success(`Saved as ${fileInfo.name}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save file';
      toast.error(errorMessage);
      console.error('Failed to save file:', error);
    }
  }, [content]);

  const handleSave = useCallback(async () => {
    try {
      if (filePath) {
        await saveFile(content);
        setOriginalContent(content);
        toast.success('File saved');
      } else {
        await handleSaveAs();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save file';
      toast.error(errorMessage);
      console.error('Failed to save file:', error);
    }
  }, [filePath, content, handleSaveAs]);

  const handleCompile = useCallback(async () => {
    if (!filePath) {
      toast.error('No file open to compile (did you save the file yet?)');
      return;
    }

    try {
      // Save before compiling
      await saveFile(content);
      setOriginalContent(content);

      setBuildStatus('building');
      setCompilerLog('Compiling...');
      const loadingToast = toast.loading('Compiling LaTeX...');

      const result = await compileLatex();
      toast.dismiss(loadingToast);

      // Store the raw log
      setCompilerLog(result.log || result.error_message || 'No output');

      if (result.success && result.pdf_path) {
        setBuildStatus('success');
        toast.success('Compilation successful!');
        try {
          const dataUrl = await readPdfAsDataUrl(result.pdf_path);
          setPdfUrl(dataUrl);
        } catch (e) {
          const errorMessage = e instanceof Error ? e.message : 'Failed to read PDF';
          toast.error(`Compilation succeeded but failed to load PDF: ${errorMessage}`);
          setCompilerLog((prev) => prev + '\n\nFailed to load PDF preview.');
          console.error('Failed to read PDF:', e);
        }
      } else {
        setBuildStatus('error');
        const errorMsg = result.error_message || 'Compilation failed. Check the compiler log for details.';
        toast.error(errorMsg);
        setShowLog(true); // Show log on error
      }
    } catch (error) {
      setBuildStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Compilation error occurred';
      toast.error(errorMessage);
      setCompilerLog(`Compile error: ${error}`);
      setShowLog(true);
    }
  }, [filePath, content]);

  const handleToggleLog = useCallback(() => {
    setShowLog((prev) => !prev);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      // Ctrl+O or Cmd+O: Open
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        handleOpen();
      }
      // Ctrl+B or Cmd+B: Compile
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        handleCompile();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleSave, handleOpen, handleCompile]);

  const displayFileName = isDirty ? `${fileName} (not saved)` : fileName;

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
      {showStartupDialog && (
        <StartupDialog
          onBlankFile={handleBlankFile}
          onOpenFile={handleOpen}
          onLoadTemplate={handleLoadTemplate}
        />
      )}
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
