import React, { useState, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, X, SortAsc, SortDesc, Grid, List } from 'lucide-react';
import CardDisplay from './CardDisplay'; // Import CardDisplay directly

const CollectionTab = ({
  collection = [], // Default to empty array
  onUpdateQuantity,
  onBuildAroundCard,
}) => {
  // State for search, filters, and view
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Derive filter options from the collection
  const filterOptions = useMemo(() => {
    const colors = new Set();
    const types = new Set();
    const rarities = new Set();
    if (Array.isArray(collection)) {
      collection.forEach(({ card }) => {
        if (!card) return;
        if (card.colors?.length) card.colors.forEach(c => colors.add(c));
        else colors.add('Colorless');
        if (card.type_line) types.add(card.type_line.split(' — ')[0].split(' ')[0]);
        if (card.rarity) rarities.add(card.rarity);
      });
    }
    return {
      colors: Array.from(colors).sort(),
      types: Array.from(types).sort(),
      rarities: Array.from(rarities).sort()
    };
  }, [collection]);

  // Filter and sort the collection based on state
  const filteredAndSortedCollection = useMemo(() => {
  if (!Array.isArray(collection)) return [];

  let filtered = collection.filter((collectionCard) => {
    // Handle the nested structure properly
    const card = collectionCard.card;
    if (!card) return false;
    
    if (searchQuery && !card.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedColor !== 'all') {
      if (selectedColor === 'Colorless') {
        if (card.colors && card.colors.length > 0) return false;
      } else {
        if (!card.colors || !card.colors.includes(selectedColor)) return false;
      }
    }
    if (selectedType !== 'all' && !card.type_line.includes(selectedType)) return false;
    if (selectedRarity !== 'all' && card.rarity !== selectedRarity) return false;
    return true;
  });

  return filtered.sort((a, b) => {
    const cardA = a.card;
    const cardB = b.card;
    let aValue, bValue;
    
    switch (sortBy) {
      case 'cmc': 
        aValue = cardA.cmc || 0; 
        bValue = cardB.cmc || 0; 
        break;
      case 'quantity': 
        aValue = a.quantity || 0; 
        bValue = b.quantity || 0; 
        break;
      default: 
        aValue = (cardA.name || '').toLowerCase(); 
        bValue = (cardB.name || '').toLowerCase();
    }
    
    return sortOrder === 'asc' ? (aValue < bValue ? -1 : 1) : (aValue > bValue ? -1 : 1);
  });
}, [collection, searchQuery, selectedColor, selectedType, selectedRarity, sortBy, sortOrder]);

  const hasActiveFilters = searchQuery || selectedColor !== 'all' || selectedType !== 'all' || selectedRarity !== 'all';
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedColor('all');
    setSelectedType('all');
    setSelectedRarity('all');
  };

  return (
    <div className="space-y-4">
      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Search your collection..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}><Filter className="h-4 w-4 mr-2" /> Filters</Button>
          <Button variant="outline" onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}>
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Filters</CardTitle>
              {hasActiveFilters && <Button variant="ghost" size="sm" onClick={clearFilters}><X className="h-4 w-4 mr-2" />Clear All</Button>}
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Filter Selects */}
            <div>
              <label className="text-sm font-medium mb-2 block">Color</label>
              <select value={selectedColor} onChange={e => setSelectedColor(e.target.value)} className="w-full p-2 border rounded bg-background">
                <option value="all">All</option>
                {filterOptions.colors.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {/* ... other filters ... */}
             <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="w-full p-2 border rounded bg-background">
                  <option value="all">All Types</option>
                  {filterOptions.types.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Rarity</label>
                <select value={selectedRarity} onChange={(e) => setSelectedRarity(e.target.value)} className="w-full p-2 border rounded bg-background">
                  <option value="all">All Rarities</option>
                  {filterOptions.rarities.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
            {/* Sorting */}
            <div>
                <label className="text-sm font-medium mb-2 block">Sort By</label>
                <div className="flex gap-2">
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full p-2 border rounded bg-background">
                        <option value="name">Name</option>
                        <option value="cmc">Mana Cost</option>
                        <option value="quantity">Quantity</option>
                    </select>
                    <Button variant="outline" size="icon" onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}>
                        {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Collection Grid/List */}
      {filteredAndSortedCollection.length > 0 ? (
        <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 md:grid-cols-2'}`}>
          {filteredAndSortedCollection.map((collectionCard) => (
            <CardDisplay
              key={collectionCard.card.scryfall_id}
              card={collectionCard.card}
              collectionCard={collectionCard}  // Pass the full collection card object
              onUpdateQuantity={onUpdateQuantity}
              onBuildAround={onBuildAroundCard}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <p>{hasActiveFilters ? "No cards match your filters." : "Your collection is empty."}</p>
          {hasActiveFilters && <Button variant="link" onClick={clearFilters}>Clear Filters</Button>}
        </div>
      )}
    </div>
  );
};

export default CollectionTab;