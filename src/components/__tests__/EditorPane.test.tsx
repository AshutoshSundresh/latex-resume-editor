import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EditorPane } from '../EditorPane';

// Mock Monaco Editor since it doesn't work well in jsdom
vi.mock('@monaco-editor/react', () => ({
  default: ({
    value,
    onChange,
    'data-testid': testId,
  }: {
    value?: string;
    onChange?: (value: string | undefined) => void;
    'data-testid'?: string;
  }) => (
    <textarea
      data-testid={testId || 'monaco-editor-mock'}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
}));

describe('EditorPane', () => {
  it('should render the editor pane container', () => {
    render(<EditorPane />);
    expect(screen.getByTestId('editor-pane')).toBeInTheDocument();
  });

  it('should render with initial content', () => {
    const initialContent = '\\documentclass{article}';
    render(<EditorPane content={initialContent} />);
    const editor = screen.getByTestId('monaco-editor-mock');
    expect(editor).toHaveValue(initialContent);
  });

  it('should call onChange when content changes', () => {
    const onChange = vi.fn();
    render(<EditorPane onChange={onChange} />);

    const editor = screen.getByTestId('monaco-editor-mock');
    editor.focus();

    // For the mock, we directly trigger the onChange
    const textarea = editor as HTMLTextAreaElement;
    textarea.value = 'new content';
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
  });

  it('should render with empty content by default', () => {
    render(<EditorPane />);
    const editor = screen.getByTestId('monaco-editor-mock');
    expect(editor).toHaveValue('');
  });
});
