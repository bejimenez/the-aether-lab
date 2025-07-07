// src/hooks/useKeyboardShortcuts.js
import { useEffect, useCallback } from 'react';

export const useKeyboardShortcuts = (shortcuts = {}) => {
  const handleKeyDown = useCallback((event) => {
    // Don't trigger shortcuts if user is typing in an input, textarea, or contenteditable
    const activeElement = document.activeElement;
    const isInputFocused = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true'
    );

    // Allow certain shortcuts even when input is focused (like Escape)
    const allowedInInput = ['Escape', 'Tab'];
    if (isInputFocused && !allowedInInput.includes(event.key)) {
      return;
    }

    // Create a key combination string
    const modifiers = [];
    if (event.ctrlKey || event.metaKey) modifiers.push('ctrl');
    if (event.altKey) modifiers.push('alt');
    if (event.shiftKey) modifiers.push('shift');
    
    const key = event.key.toLowerCase();
    const combination = modifiers.length > 0 ? `${modifiers.join('+')}+${key}` : key;

    // Check if we have a handler for this combination
    const handler = shortcuts[combination];
    if (handler) {
      event.preventDefault();
      event.stopPropagation();
      handler(event);
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};

// Pre-defined shortcut combinations for common actions
export const SHORTCUTS = {
  // Navigation
  SEARCH_FOCUS: '/',
  ESCAPE: 'escape',
  
  // Tabs
  TAB_SEARCH: '1',
  TAB_COLLECTION: '2', 
  TAB_DECKS: '3',
  TAB_STATS: '4',
  
  // Collection actions
  ADD_TO_COLLECTION: 'a',
  REMOVE_FROM_COLLECTION: 'd',
  INCREMENT_QUANTITY: '+',
  DECREMENT_QUANTITY: '-',
  
  // Deck actions
  ADD_TO_DECK: 'ctrl+a',
  CREATE_NEW_DECK: 'ctrl+n',
  BUILD_AROUND_CARD: 'b',
  
  // Quick actions
  QUICK_SAVE: 'ctrl+s',
  REFRESH: 'r',
  CLEAR_SEARCH: 'ctrl+k',
};
