import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  callback: () => void;
  description?: string;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const metaMatch = shortcut.meta ? event.metaKey : !event.metaKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
          event.preventDefault();
          shortcut.callback();
          break;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

// Pre-defined shortcuts for common actions
export const useCommonShortcuts = (callbacks: {
  onSearch?: () => void;
  onRefresh?: () => void;
  onNew?: () => void;
  onClose?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
}) => {
  const shortcuts: KeyboardShortcut[] = [
    callbacks.onSearch && { key: 'k', ctrl: true, callback: callbacks.onSearch, description: 'Focus search' },
    callbacks.onRefresh && { key: 'r', ctrl: true, callback: callbacks.onRefresh, description: 'Refresh' },
    callbacks.onNew && { key: 'n', ctrl: true, callback: callbacks.onNew, description: 'New item' },
    callbacks.onClose && { key: 'Escape', callback: callbacks.onClose, description: 'Close' },
    callbacks.onSave && { key: 's', ctrl: true, callback: callbacks.onSave, description: 'Save' },
    callbacks.onDelete && { key: 'Delete', callback: callbacks.onDelete, description: 'Delete' },
  ].filter(Boolean) as KeyboardShortcut[];

  useKeyboardShortcuts(shortcuts);
};

