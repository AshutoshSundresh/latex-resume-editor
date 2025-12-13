import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutosave } from '../useAutosave';

describe('useAutosave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not call onSave when content has not changed', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    renderHook(() =>
      useAutosave({
        content: 'initial content',
        filePath: '/path/to/file.tex',
        onSave,
        delay: 1000,
        enabled: true,
      })
    );

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(onSave).not.toHaveBeenCalled();
  });

  it('should call onSave after delay when content changes', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    const { rerender } = renderHook(
      ({ content }) =>
        useAutosave({
          content,
          filePath: '/path/to/file.tex',
          onSave,
          delay: 1000,
          enabled: true,
        }),
      { initialProps: { content: 'initial' } }
    );

    // Change content
    rerender({ content: 'updated content' });

    // Should not have been called yet
    expect(onSave).not.toHaveBeenCalled();

    // Advance timers past the delay
    await act(async () => {
      vi.advanceTimersByTime(1100);
    });

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('should not call onSave when disabled', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    const { rerender } = renderHook(
      ({ content }) =>
        useAutosave({
          content,
          filePath: '/path/to/file.tex',
          onSave,
          delay: 1000,
          enabled: false,
        }),
      { initialProps: { content: 'initial' } }
    );

    rerender({ content: 'updated content' });

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(onSave).not.toHaveBeenCalled();
  });

  it('should not call onSave when filePath is null', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    const { rerender } = renderHook(
      ({ content }) =>
        useAutosave({
          content,
          filePath: null,
          onSave,
          delay: 1000,
          enabled: true,
        }),
      { initialProps: { content: 'initial' } }
    );

    rerender({ content: 'updated content' });

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(onSave).not.toHaveBeenCalled();
  });

  it('should debounce multiple rapid changes', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    const { rerender } = renderHook(
      ({ content }) =>
        useAutosave({
          content,
          filePath: '/path/to/file.tex',
          onSave,
          delay: 1000,
          enabled: true,
        }),
      { initialProps: { content: 'initial' } }
    );

    // Make multiple rapid changes
    rerender({ content: 'change 1' });
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    rerender({ content: 'change 2' });
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    rerender({ content: 'change 3' });
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    // Should not have been called yet (still within debounce)
    expect(onSave).not.toHaveBeenCalled();

    // Now wait for the full delay
    await act(async () => {
      vi.advanceTimersByTime(1100);
    });

    // Should only be called once with the final content
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('should use custom delay', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    const { rerender } = renderHook(
      ({ content }) =>
        useAutosave({
          content,
          filePath: '/path/to/file.tex',
          onSave,
          delay: 500,
          enabled: true,
        }),
      { initialProps: { content: 'initial' } }
    );

    rerender({ content: 'updated' });

    // Should not be called before 500ms
    await act(async () => {
      vi.advanceTimersByTime(400);
    });
    expect(onSave).not.toHaveBeenCalled();

    // Should be called after 500ms
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
