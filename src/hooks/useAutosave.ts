import { useEffect, useRef, useCallback } from 'react';

interface UseAutosaveOptions {
  content: string;
  filePath: string | null;
  onSave: () => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

/**
 * Hook for debounced autosave functionality
 */
export function useAutosave({
  content,
  filePath,
  onSave,
  delay = 1000,
  enabled = true,
}: UseAutosaveOptions) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContentRef = useRef<string>(content);
  const isSavingRef = useRef<boolean>(false);

  const save = useCallback(async () => {
    if (isSavingRef.current) return;
    if (content === lastSavedContentRef.current) return;
    if (!filePath) return;

    isSavingRef.current = true;
    try {
      await onSave();
      lastSavedContentRef.current = content;
    } catch (error) {
      console.error('Autosave failed:', error);
    } finally {
      isSavingRef.current = false;
    }
  }, [content, filePath, onSave]);

  useEffect(() => {
    if (!enabled || !filePath) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for autosave
    timeoutRef.current = setTimeout(() => {
      save();
    }, delay);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, delay, enabled, filePath, save]);

  // Update lastSavedContent when file changes (new file opened)
  useEffect(() => {
    lastSavedContentRef.current = content;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filePath]);

  return { save };
}
