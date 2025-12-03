import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBar } from '../StatusBar';

describe('StatusBar', () => {
  it('should render the status bar container', () => {
    render(<StatusBar />);
    expect(screen.getByTestId('status-bar')).toBeInTheDocument();
  });

  it('should show "Ready" status by default', () => {
    render(<StatusBar />);
    expect(screen.getByText(/ready/i)).toBeInTheDocument();
  });

  it('should show "Building..." when buildStatus is building', () => {
    render(<StatusBar buildStatus="building" />);
    expect(screen.getByText(/building/i)).toBeInTheDocument();
  });

  it('should show "Build succeeded" when buildStatus is success', () => {
    render(<StatusBar buildStatus="success" />);
    expect(screen.getByText(/succeeded/i)).toBeInTheDocument();
  });

  it('should show "Build failed" when buildStatus is error', () => {
    render(<StatusBar buildStatus="error" />);
    expect(screen.getByText(/failed/i)).toBeInTheDocument();
  });

  it('should display the file path', () => {
    render(<StatusBar filePath="resume.tex" />);
    expect(screen.getByText('resume.tex')).toBeInTheDocument();
  });

  it('should display line and column position', () => {
    render(<StatusBar line={10} column={25} />);
    expect(screen.getByText(/ln 10/i)).toBeInTheDocument();
    expect(screen.getByText(/col 25/i)).toBeInTheDocument();
  });

  it('should show default position when not provided', () => {
    render(<StatusBar />);
    expect(screen.getByText(/ln 1/i)).toBeInTheDocument();
    expect(screen.getByText(/col 1/i)).toBeInTheDocument();
  });
});
