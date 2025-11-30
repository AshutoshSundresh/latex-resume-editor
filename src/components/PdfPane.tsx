import './PdfPane.css';

interface PdfPaneProps {
  pdfUrl?: string;
}

export function PdfPane({ pdfUrl }: PdfPaneProps) {
  return (
    <div className="pdf-pane" data-testid="pdf-pane">
      {pdfUrl ? (
        <iframe src={pdfUrl} className="pdf-viewer" title="PDF Preview" />
      ) : (
        <div className="pdf-empty-state">
          <div className="pdf-empty-icon">📄</div>
          <p className="pdf-empty-text">No PDF loaded</p>
          <p className="pdf-empty-hint">Compile your LaTeX to see the preview</p>
        </div>
      )}
    </div>
  );
}
