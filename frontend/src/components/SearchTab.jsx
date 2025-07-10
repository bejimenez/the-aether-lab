// File: frontend/src/components/SearchTab.jsx
// REPLACE the entire SearchTab component with this improved version

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import CardDisplay from './CardDisplay';
import { Search, X } from 'lucide-react';

const SearchTab = ({ 
  onSearch, 
  searchResults, 
  loading, 
  onAddCard, 
  onShowDetails, 
  collection = [], 
  searchInputRef,
  collectionUpdateTrigger 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const debounceTimerRef = useRef(null);

  // IMPROVED: Create a memoized collection lookup map for better performance
  const collectionMap = useMemo(() => {
    const map = new Map();
    collection.forEach(card => {
      map.set(card.scryfall_id, card);
    });
    return map;
  }, [collection, collectionUpdateTrigger]); // Include trigger to force rebuild

  // IMPROVED: Memoized function to find collection card
  const getCollectionCard = useCallback((searchCard) => {
    return collectionMap.get(searchCard.scryfall_id) || null;
  }, [collectionMap]);

  // Expose clear function via ref for parent component
  useEffect(() => {
    if (searchInputRef && searchInputRef.current) {
      searchInputRef.current.clearSearch = () => {
        setSearchQuery('');
      };
    }
  }, [searchInputRef]);

  // Debounced search effect
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Don't search for very short queries to avoid unnecessary API calls
    if (searchQuery.length < 2) {
      onSearch(''); // Clear results for short queries
      return;
    }

    // Set up new debounced search
    debounceTimerRef.current = setTimeout(() => {
      onSearch(searchQuery);
    }, 400); // 400ms delay to respect Scryfall rate limits

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, onSearch]);

  // Manual search handler (for button click)
  const handleManualSearch = useCallback(() => {
    // Cancel any pending debounced search
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Immediately trigger search
    onSearch(searchQuery);
  }, [searchQuery, onSearch]);

  // Clear search handler
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    // This will trigger the useEffect which will clear results for empty query
  }, []);

  // Handle input changes
  const handleInputChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  // Handle Enter key press for immediate search
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      // Cancel debounced search and search immediately
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      handleManualSearch();
    }
  }, [handleManualSearch]);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search for Magic cards..."
            value={searchQuery}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              onClick={handleClearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Button onClick={handleManualSearch} disabled={loading || searchQuery.length < 2}>
          Search
        </Button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Searching cards...</p>
        </div>
      )}

      {/* Search Results */}
      {!loading && searchResults.length > 0 && (
        <div>
          <p className="text-muted-foreground mb-4">
            Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
            {searchQuery && ` for "${searchQuery}"`}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {searchResults.map(card => {
              // IMPROVED: Use the memoized lookup function
              const collectionCard = getCollectionCard(card);
              
              return (
                <CardDisplay
                  key={card.scryfall_id || card.id}
                  card={card}
                  collectionCard={collectionCard}
                  onAdd={onAddCard}
                  onShowDetails={onShowDetails}
                  showCollectionBadge={true}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* No results message */}
      {!loading && searchQuery.length >= 2 && searchResults.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No cards found for "{searchQuery}"</p>
          <p className="text-sm mt-1">Try adjusting your search terms or checking the spelling</p>
        </div>
      )}

      {/* Help text */}
      {!searchQuery && !loading && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Start typing to search for Magic cards</p>
          <p className="text-sm mt-1">Search automatically triggers after a brief pause</p>
          <div className="mt-4 text-xs space-y-1">
            <p><kbd className="px-1 py-0.5 bg-muted rounded">Enter</kbd> when no card focused: Add first result</p>
            <p><kbd className="px-1 py-0.5 bg-muted rounded">A</kbd> or <kbd className="px-1 py-0.5 bg-muted rounded">Space</kbd> when card focused: Add/increment card</p>
            <p><kbd className="px-1 py-0.5 bg-muted rounded">Tab</kbd> to navigate between cards</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchTab;