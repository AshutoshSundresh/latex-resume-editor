import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CompilerLog } from '../CompilerLog';

describe('CompilerLog', () => {
  it('should render when visible', () => {
    render(<CompilerLog log="Test log output" visible={true} />);
    expect(screen.getByTestId('compiler-log')).toBeInTheDocument();
  });

  it('should not render when not visible', () => {
    render(<CompilerLog log="Test log output" visible={false} />);
    expect(screen.queryByTestId('compiler-log')).not.toBeInTheDocument();
  });

  it('should display the log content', () => {
    render(<CompilerLog log="This is a test log" visible={true} />);
    expect(screen.getByText('This is a test log')).toBeInTheDocument();
  });

  it('should display placeholder when log is empty', () => {
    render(<CompilerLog log="" visible={true} />);
    expect(screen.getByText(/No output yet/)).toBeInTheDocument();
  });

  it('should display header', () => {
    render(<CompilerLog log="test" visible={true} />);
    expect(screen.getByText('Compiler Output')).toBeInTheDocument();
  });
});
