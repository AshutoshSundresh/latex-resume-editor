import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../../App';

describe('App', () => {
  it('should render the main application layout', () => {
    render(<App />);
    expect(screen.getByTestId('app-container')).toBeInTheDocument();
  });

  it('should contain the Toolbar component', () => {
    render(<App />);
    expect(screen.getByTestId('toolbar')).toBeInTheDocument();
  });

  it('should contain the EditorPane component', () => {
    render(<App />);
    expect(screen.getByTestId('editor-pane')).toBeInTheDocument();
  });

  it('should contain the PdfPane component', () => {
    render(<App />);
    expect(screen.getByTestId('pdf-pane')).toBeInTheDocument();
  });

  it('should contain the StatusBar component', () => {
    render(<App />);
    expect(screen.getByTestId('status-bar')).toBeInTheDocument();
  });
});
