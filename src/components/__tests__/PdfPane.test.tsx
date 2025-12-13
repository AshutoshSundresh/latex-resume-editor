import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PdfPane } from '../PdfPane';

describe('PdfPane', () => {
  it('should render the pdf pane container', () => {
    render(<PdfPane />);
    expect(screen.getByTestId('pdf-pane')).toBeInTheDocument();
  });

  it('should show empty state when no PDF is loaded', () => {
    render(<PdfPane />);
    expect(screen.getByText(/no pdf loaded/i)).toBeInTheDocument();
  });

  it('should show hint text in empty state', () => {
    render(<PdfPane />);
    expect(screen.getByText(/compile your latex/i)).toBeInTheDocument();
  });

  it('should render iframe when pdfUrl is provided', () => {
    const pdfUrl = 'file:///path/to/resume.pdf';
    render(<PdfPane pdfUrl={pdfUrl} />);

    const iframe = screen.getByTitle('PDF Preview');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('src', pdfUrl);
  });

  it('should not show empty state when pdfUrl is provided', () => {
    render(<PdfPane pdfUrl="file:///path/to/resume.pdf" />);
    expect(screen.queryByText(/no pdf loaded/i)).not.toBeInTheDocument();
  });
});
