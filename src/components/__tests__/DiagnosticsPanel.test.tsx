import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DiagnosticsPanel } from '../DiagnosticsPanel';
import type { Diagnostic } from '../../tauri/api';

describe('DiagnosticsPanel', () => {
  const mockDiagnostics: Diagnostic[] = [
    {
      severity: 'error',
      message: 'Undefined control sequence',
      file: 'resume.tex',
      line: 15,
      column: null,
    },
    {
      severity: 'warning',
      message: 'Citation undefined',
      file: 'resume.tex',
      line: 42,
      column: null,
    },
    { severity: 'error', message: 'Missing $ inserted', file: null, line: 10, column: null },
  ];

  it('should render the diagnostics panel container', () => {
    render(<DiagnosticsPanel diagnostics={[]} />);
    expect(screen.getByTestId('diagnostics-panel')).toBeInTheDocument();
  });

  it('should show empty state when no diagnostics', () => {
    render(<DiagnosticsPanel diagnostics={[]} />);
    expect(screen.getByText(/no issues/i)).toBeInTheDocument();
  });

  it('should render error diagnostics', () => {
    render(<DiagnosticsPanel diagnostics={mockDiagnostics} />);
    expect(screen.getByText(/undefined control sequence/i)).toBeInTheDocument();
  });

  it('should render warning diagnostics', () => {
    render(<DiagnosticsPanel diagnostics={mockDiagnostics} />);
    expect(screen.getByText(/citation undefined/i)).toBeInTheDocument();
  });

  it('should show line number when available', () => {
    render(<DiagnosticsPanel diagnostics={mockDiagnostics} />);
    expect(screen.getByText(/line 15/i)).toBeInTheDocument();
  });

  it('should call onDiagnosticClick when clicking a diagnostic', async () => {
    const user = userEvent.setup();
    const onDiagnosticClick = vi.fn();

    render(
      <DiagnosticsPanel diagnostics={mockDiagnostics} onDiagnosticClick={onDiagnosticClick} />
    );

    const errorItem = screen.getByText(/undefined control sequence/i).closest('button');
    await user.click(errorItem!);

    expect(onDiagnosticClick).toHaveBeenCalledWith(mockDiagnostics[0]);
  });

  it('should display error count', () => {
    render(<DiagnosticsPanel diagnostics={mockDiagnostics} />);
    // 2 errors in mockDiagnostics
    expect(screen.getByText(/2 errors/i)).toBeInTheDocument();
  });

  it('should display warning count', () => {
    render(<DiagnosticsPanel diagnostics={mockDiagnostics} />);
    // 1 warning in mockDiagnostics
    expect(screen.getByText(/1 warning/i)).toBeInTheDocument();
  });

  it('should style errors differently from warnings', () => {
    render(<DiagnosticsPanel diagnostics={mockDiagnostics} />);

    const errorItems = screen.getAllByTestId('diagnostic-error');
    const warningItems = screen.getAllByTestId('diagnostic-warning');

    expect(errorItems.length).toBe(2);
    expect(warningItems.length).toBe(1);
  });
});
