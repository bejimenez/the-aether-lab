import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import CardDisplay from './CardDisplay';
import { Search } from 'lucide-react';

const SearchTab = ({ onSearch, searchResults, loading, onAddCard }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    onSearch(searchQuery);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search for Magic cards..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1"
        />
        <Button onClick={handleSearch} disabled={loading}>
          <Search className="w-4 h-4 mr-2" />
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </div>

      {searchResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {searchResults.map(card => (
            <CardDisplay
              key={card.scryfall_id || card.id}
              card={card}
              onAdd={onAddCard}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchTab;