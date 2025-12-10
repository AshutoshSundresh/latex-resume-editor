import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../../App';

describe('App', () => {
  it('should show loading state initially', () => {
    render(<App />);
    expect(screen.getByTestId('app-loading')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render the main application layout after loading', async () => {
    render(<App />);
    // Wait for async initialization to complete
    // Since mocks return satisfied requirements, it should skip landing page
    await waitFor(() => {
      expect(screen.getByTestId('app-container')).toBeInTheDocument();
    });
  });

  it('should contain the Toolbar component after loading', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('toolbar')).toBeInTheDocument();
    });
  });

  it('should contain the EditorPane component after loading', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('editor-pane')).toBeInTheDocument();
    });
  });

  it('should contain the PdfPane component after loading', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('pdf-pane')).toBeInTheDocument();
    });
  });

  it('should contain the StatusBar component after loading', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('status-bar')).toBeInTheDocument();
    });
  });

  it('should display "No file open" initially in status bar', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('No file open')).toBeInTheDocument();
    });
  });

  it('should display line and column info in status bar', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/Ln.*Col/)).toBeInTheDocument();
    });
  });
});

describe('App loading states', () => {
  it('should have loading class on loading container', () => {
    render(<App />);
    const loadingContainer = screen.getByTestId('app-loading');
    expect(loadingContainer).toHaveClass('loading');
  });
});
