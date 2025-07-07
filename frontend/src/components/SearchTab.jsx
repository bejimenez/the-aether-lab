import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import CardDisplay from './CardDisplay';
import { Search, X } from 'lucide-react';

const SearchTab = ({ onSearch, searchResults, loading, onAddCard, onShowDetails, collection = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const debounceTimerRef = useRef(null);

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
  const handleManualSearch = () => {
    // Cancel any pending debounced search
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Immediately trigger search
    onSearch(searchQuery);
  };

  // Clear search handler
  const handleClearSearch = () => {
    setSearchQuery('');
    // This will trigger the useEffect which will clear results for empty query
  };

  // Handle input changes
  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle Enter key press for immediate search
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      // Cancel debounced search and search immediately
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      onSearch(searchQuery);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            placeholder="Search for Magic cards... (type to search automatically)"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="pr-8"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <Button onClick={handleManualSearch} disabled={loading}>
          <Search className="w-4 h-4 mr-2" />
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </div>

      {/* Loading indicator for debounced searches */}
      {loading && (
        <div className="text-center py-4 text-muted-foreground">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            Searching for "{searchQuery}"...
          </div>
        </div>
      )}

      {/* Search results */}
      {searchResults.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Found {searchResults.length} card{searchResults.length !== 1 ? 's' : ''}
            {searchQuery && ` for "${searchQuery}"`}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {searchResults.map(card => (
              <CardDisplay
                key={card.scryfall_id || card.id}
                card={card}
                collectionCard={collection.find(cc => cc.card.scryfall_id === card.scryfall_id)}
                onAdd={onAddCard}
                onShowDetails={onShowDetails}
                showCollectionBadge={true}
              />
            ))}
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
        </div>
      )}
    </div>
  );
};

export default SearchTab;