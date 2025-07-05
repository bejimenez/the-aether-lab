// Fixed Collection Component that works with your existing UI components
// Replace your collection TabsContent in App.jsx with this

import React, { useState, useEffect, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectOption } from "@/components/ui/select"; // Using your existing Select component
import { Search, Filter, X, SortAsc, SortDesc, Grid, List } from 'lucide-react';

const CollectionTabFixed = ({ 
  collection, 
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

  // Derive filter options from collection
  const filterOptions = useMemo(() => {
    const colors = new Set();
    const types = new Set();
    const rarities = new Set();

    collection.forEach(collectionCard => {
      const card = collectionCard.card;
      
      // Extract colors
      if (card.colors && card.colors.length > 0) {
        card.colors.forEach(color => colors.add(color));
      } else {
        colors.add('Colorless');
      }
      
      // Extract main card type
      if (card.type_line) {
        const mainType = card.type_line.split(' — ')[0].split(' ')[0];
        types.add(mainType);
      }
      
      // Extract rarities
      if (card.rarity) {
        rarities.add(card.rarity);
      }
    });

    return {
      colors: Array.from(colors).sort(),
      types: Array.from(types).sort(),
      rarities: Array.from(rarities).sort()
    };
  }, [collection]);

  // Filter and sort collection
  const filteredAndSortedCollection = useMemo(() => {
    let filtered = collection.filter(collectionCard => {
      const card = collectionCard.card;
      
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const nameMatch = card.name.toLowerCase().includes(searchLower);
        const typeMatch = card.type_line && card.type_line.toLowerCase().includes(searchLower);
        const textMatch = card.oracle_text && card.oracle_text.toLowerCase().includes(searchLower);
        
        if (!nameMatch && !typeMatch && !textMatch) {
          return false;
        }
      }
      
      // Color filter
      if (selectedColor !== 'all') {
        if (selectedColor === 'Colorless') {
          if (card.colors && card.colors.length > 0) return false;
        } else {
          if (!card.colors || !card.colors.includes(selectedColor)) return false;
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

    // Sort collection
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.card.name.toLowerCase();
          bValue = b.card.name.toLowerCase();
          break;
        case 'cmc':
          aValue = a.card.cmc || 0;
          bValue = b.card.cmc || 0;
          break;
        case 'rarity':
          const rarityOrder = { 'common': 1, 'uncommon': 2, 'rare': 3, 'mythic': 4 };
          aValue = rarityOrder[a.card.rarity] || 0;
          bValue = rarityOrder[b.card.rarity] || 0;
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'type':
          aValue = a.card.type_line || '';
          bValue = b.card.type_line || '';
          break;
        default:
          aValue = a.card.name.toLowerCase();
          bValue = b.card.name.toLowerCase();
      }
      
      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [collection, searchQuery, selectedColor, selectedType, selectedRarity, sortBy, sortOrder]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedColor('all');
    setSelectedType('all');
    setSelectedRarity('all');
    setSortBy('name');
    setSortOrder('asc');
  };

  // Check if any filters are active
  const hasActiveFilters = searchQuery || selectedColor !== 'all' || selectedType !== 'all' || selectedRarity !== 'all';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">My Collection</h2>
        <div className="flex items-center gap-4">
          <Badge variant="secondary">
            {filteredAndSortedCollection.length} of {collection.length} cards
          </Badge>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cards by name, type, or text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
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

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Filter & Sort</CardTitle>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Color Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Color</label>
                <Select 
                  value={selectedColor} 
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-full"
                >
                  <SelectOption value="all">All Colors</SelectOption>
                  {filterOptions.colors.map(color => (
                    <SelectOption key={color} value={color}>
                      {color}
                    </SelectOption>
                  ))}
                </Select>
              </div>

              {/* Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select 
                  value={selectedType} 
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full"
                >
                  <SelectOption value="all">All Types</SelectOption>
                  {filterOptions.types.map(type => (
                    <SelectOption key={type} value={type}>
                      {type}
                    </SelectOption>
                  ))}
                </Select>
              </div>

              {/* Rarity Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Rarity</label>
                <Select 
                  value={selectedRarity} 
                  onChange={(e) => setSelectedRarity(e.target.value)}
                  className="w-full"
                >
                  <SelectOption value="all">All Rarities</SelectOption>
                  {filterOptions.rarities.map(rarity => (
                    <SelectOption key={rarity} value={rarity}>
                      {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                    </SelectOption>
                  ))}
                </Select>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Sort By</label>
                <Select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full"
                >
                  <SelectOption value="name">Name</SelectOption>
                  <SelectOption value="cmc">Mana Cost</SelectOption>
                  <SelectOption value="rarity">Rarity</SelectOption>
                  <SelectOption value="quantity">Quantity</SelectOption>
                  <SelectOption value="type">Type</SelectOption>
                </Select>
              </div>

              {/* Sort Order */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Order</label>
                <Button
                  variant="outline"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Collection Grid */}
      <div className={`grid gap-4 ${viewMode === 'grid' 
        ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
        : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      }`}>
        {filteredAndSortedCollection.map((collectionCard) => (
          <CardDisplay 
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
        ))}
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