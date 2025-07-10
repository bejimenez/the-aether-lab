// File: frontend/src/hooks/useKeyboardShortcuts.js
// REPLACE the entire file with this improved version

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

    // IMPROVED: Check if the event target has a tabindex (card is focused)
    const isCardFocused = activeElement && activeElement.hasAttribute('tabindex') && 
                         activeElement.getAttribute('tabindex') === '0';

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
      // IMPROVED: Pass more context to the handler
      const context = {
        isCardFocused,
        isInputFocused,
        activeElement,
        originalEvent: event
      };
      
      // Only prevent default if handler returns true or undefined
      const shouldPreventDefault = handler(event, context);
      if (shouldPreventDefault !== false) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [handleKeyDown]);
};

// Enhanced shortcut definitions
export const SHORTCUTS = {
  // Navigation
  SEARCH_FOCUS: '/',
  ESCAPE: 'escape',
  
  // Tabs
  TAB_SEARCH: '1',
  TAB_COLLECTION: '2', 
  TAB_DECKS: '3',
  TAB_STATS: '4',
  TAB_ACHIEVEMENTS: '5',
  
  // Collection actions (when card focused)
  ADD_TO_COLLECTION: 'a',
  QUICK_ADD: 'space', // Changed from 'enter' to avoid conflicts
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
  GLOBAL_ENTER: 'enter', // For global enter actions
};

// Helper function to check if any card is currently focused
export const isAnyCardFocused = () => {
  const activeElement = document.activeElement;
  return activeElement && 
         activeElement.hasAttribute('tabindex') && 
         activeElement.getAttribute('tabindex') === '0';
};