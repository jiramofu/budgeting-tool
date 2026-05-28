import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  cmd?: boolean;
  callback: () => void;
  description?: string;
  preventDefault?: boolean;
}

const isMac = typeof window !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;

      // Don't trigger shortcuts when typing in inputs/textareas
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        // Allow Escape to close modals even in inputs
        if (event.key !== 'Escape') {
          return;
        }
      }

      shortcuts.forEach((shortcut) => {
        const cmdKey = isMac ? event.metaKey : event.ctrlKey;
        const isMatch =
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          (shortcut.ctrl ? event.ctrlKey : !shortcut.ctrl) &&
          (shortcut.shift ? event.shiftKey : !shortcut.shift) &&
          (shortcut.alt ? event.altKey : !shortcut.alt) &&
          (shortcut.cmd || shortcut.ctrl ? cmdKey : !cmdKey);

        if (isMatch) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.callback();
        }
      });
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};

// Common shortcuts
export const COMMON_SHORTCUTS = {
  // Format: Cmd+K on Mac, Ctrl+K on Windows
  search: (isMac ? '⌘' : 'Ctrl') + '+K',
  help: (isMac ? '⌘' : 'Ctrl') + '+/',
  newItem: (isMac ? '⌘' : 'Ctrl') + '+N',
  export: (isMac ? '⌘' : 'Ctrl') + '+E',
  esc: 'Esc',
};
