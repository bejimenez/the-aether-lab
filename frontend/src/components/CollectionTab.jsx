// SAFER CollectionTab Component - Replace your current CollectionTabFixed with this
// Save this as frontend/src/components/CollectionTab.jsx

import React, { useState, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, X, SortAsc, SortDesc, Grid, List } from 'lucide-react';

const CollectionTabFixed = ({ 
  collection = [], // Default to empty array
  CardDisplay, 
  updateCardQuantity, 
  buildAroundCard, 
  selectedDeck, 
  addCardToDeck 
}) => {
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Safety check - if CardDisplay is not provided, create a simple fallback
  const SafeCardDisplay = CardDisplay || (({ card, collectionCard }) => (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-lg">{card?.name || 'Unknown Card'}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm">Quantity: {collectionCard?.quantity || 0}</p>
      </CardContent>
    </Card>
  ));

  // Derive filter options from collection with safety checks
  const filterOptions = useMemo(() => {
    const colors = new Set();
    const types = new Set();
    const rarities = new Set();

    if (Array.isArray(collection)) {
      collection.forEach(collectionCard => {
        const card = collectionCard?.card;
        
        if (!card) return; // Skip if no card data
        
        // Extract colors safely
        if (Array.isArray(card.colors) && card.colors.length > 0) {
          card.colors.forEach(color => colors.add(color));
        } else {
          colors.add('Colorless');
        }
        
        // Extract main card type safely
        if (card.type_line && typeof card.type_line === 'string') {
          const mainType = card.type_line.split(' — ')[0].split(' ')[0];
          if (mainType) types.add(mainType);
        }
        
        // Extract rarities safely
        if (card.rarity && typeof card.rarity === 'string') {
          rarities.add(card.rarity);
        }
      });
    }

    return {
      colors: Array.from(colors).sort(),
      types: Array.from(types).sort(),
      rarities: Array.from(rarities).sort()
    };
  }, [collection]);

  // Filter and sort collection with safety checks
  const filteredAndSortedCollection = useMemo(() => {
    if (!Array.isArray(collection)) return [];

    let filtered = collection.filter(collectionCard => {
      const card = collectionCard?.card;
      
      if (!card) return false; // Skip items without card data
      
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const nameMatch = card.name && card.name.toLowerCase().includes(searchLower);
        const typeMatch = card.type_line && card.type_line.toLowerCase().includes(searchLower);
        const textMatch = card.oracle_text && card.oracle_text.toLowerCase().includes(searchLower);
        
        if (!nameMatch && !typeMatch && !textMatch) {
          return false;
        }
      }
      
      // Color filter
      if (selectedColor !== 'all') {
        if (selectedColor === 'Colorless') {
          if (Array.isArray(card.colors) && card.colors.length > 0) return false;
        } else {
          if (!Array.isArray(card.colors) || !card.colors.includes(selectedColor)) return false;
        }
      }
      
      // Type filter
      if (selectedType !== 'all') {
        if (!card.type_line || !card.type_line.includes(selectedType)) return false;
      }
      
      // Rarity filter
      if (selectedRarity !== 'all') {
        if (card.rarity !== selectedRarity) return false;
      }
      
      return true;
    });

    // Sort collection safely
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      const cardA = a?.card;
      const cardB = b?.card;
      
      if (!cardA || !cardB) return 0; // Skip sorting if no card data
      
      switch (sortBy) {
        case 'name':
          aValue = (cardA.name || '').toLowerCase();
          bValue = (cardB.name || '').toLowerCase();
          break;
        case 'cmc':
          aValue = cardA.cmc || 0;
          bValue = cardB.cmc || 0;
          break;
        case 'rarity':
          const rarityOrder = { 'common': 1, 'uncommon': 2, 'rare': 3, 'mythic': 4 };
          aValue = rarityOrder[cardA.rarity] || 0;
          bValue = rarityOrder[cardB.rarity] || 0;
          break;
        case 'quantity':
          aValue = a.quantity || 0;
          bValue = b.quantity || 0;
          break;
        case 'type':
          aValue = cardA.type_line || '';
          bValue = cardB.type_line || '';
          break;
        default:
          aValue = (cardA.name || '').toLowerCase();
          bValue = (cardB.name || '').toLowerCase();
      }
      
      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [collection, searchQuery, selectedColor, selectedType, selectedRarity, sortBy, sortOrder]);

  // Check if any filters are active
  const hasActiveFilters = searchQuery || selectedColor !== 'all' || selectedType !== 'all' || selectedRarity !== 'all';

  // Clear all filters
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
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search your collection..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1">
                {(searchQuery ? 1 : 0) + (selectedColor !== 'all' ? 1 : 0) + (selectedType !== 'all' ? 1 : 0) + (selectedRarity !== 'all' ? 1 : 0)}
              </Badge>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="flex items-center gap-2"
          >
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Simple Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Filters</CardTitle>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Simple select dropdowns */}
              <div>
                <label className="text-sm font-medium mb-2 block">Color</label>
                <select 
                  value={selectedColor} 
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="all">All Colors</option>
                  {filterOptions.colors.map(color => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <select 
                  value={selectedType} 
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="all">All Types</option>
                  {filterOptions.types.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Rarity</label>
                <select 
                  value={selectedRarity} 
                  onChange={(e) => setSelectedRarity(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="all">All Rarities</option>
                  {filterOptions.rarities.map(rarity => (
                    <option key={rarity} value={rarity}>
                      {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Sort</label>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-2 border rounded mb-2"
                >
                  <option value="name">Name</option>
                  <option value="cmc">Mana Cost</option>
                  <option value="rarity">Rarity</option>
                  <option value="quantity">Quantity</option>
                  <option value="type">Type</option>
                </select>
                <Button
                  variant="outline"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="w-full flex items-center justify-center gap-2"
                  size="sm"
                >
                  {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  {sortOrder === 'asc' ? 'Asc' : 'Desc'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Collection Grid */}
      <div className={`grid gap-4 ${viewMode === 'grid' 
        ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
        : 'grid-cols-1 md:grid-cols-2'
      }`}>
        {filteredAndSortedCollection.map((collectionCard) => {
          // Safety check - ensure we have valid data
          if (!collectionCard?.card || !collectionCard.id) {
            return null; // Skip invalid entries
          }
          
          return (
            <SafeCardDisplay 
              key={collectionCard.id} 
              card={collectionCard.card} 
              collectionCard={collectionCard}
              showBuildAround={true}
              showAddToDeck={selectedDeck ? true : false}
              updateCardQuantity={updateCardQuantity}
              buildAroundCard={buildAroundCard}
              addCardToDeck={addCardToDeck}
              selectedDeck={selectedDeck}
            />
          );
        })}
      </div>

      {/* Empty State */}
      {filteredAndSortedCollection.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {hasActiveFilters
              ? "No cards found matching your filters."
              : "Your collection is empty. Add some cards to get started!"
            }
          </p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters} className="mt-4">
              Clear filters to show all cards
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default CollectionTabFixed;