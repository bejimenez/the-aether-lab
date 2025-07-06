import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, X, SortAsc, SortDesc, Grid, List, ChevronLeft, ChevronRight } from 'lucide-react';
import CardDisplay from './CardDisplay';
import * as api from '../api/mtgApi';

const CollectionTab = ({
  collection = [], // This will be used only for initial load/stats
  onUpdateQuantity,
  onBuildAroundCard,
  userId
}) => {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCards, setTotalCards] = useState(0);
  const [perPage] = useState(20); // Fixed at 20 for optimal performance
  
  // Collection data
  const [displayedCards, setDisplayedCards] = useState([]);
  const [collectionIndex, setCollectionIndex] = useState([]); // Lightweight index for search
  const [loading, setLoading] = useState(false);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // Debounce timer for search
  const [searchDebounceTimer, setSearchDebounceTimer] = useState(null);

  // Load collection index on mount
  useEffect(() => {
    if (userId) {
      loadCollectionIndex();
    }
  }, [userId]);

  // Load collection page when filters change
  useEffect(() => {
    if (userId) {
      // Reset to page 1 when filters change
      setCurrentPage(1);
      loadCollectionPage(1);
    }
  }, [selectedColor, selectedType, selectedRarity, sortBy, sortOrder, userId]);

  // Debounced search
  useEffect(() => {
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }
    
    const timer = setTimeout(() => {
      setCurrentPage(1);
      loadCollectionPage(1);
    }, 300); // 300ms debounce
    
    setSearchDebounceTimer(timer);
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [searchQuery]);

  const loadCollectionIndex = async () => {
    try {
      const data = await api.fetchCollectionIndex(userId);
      setCollectionIndex(data.index || []);
    } catch (error) {
      console.error('Failed to load collection index:', error);
    }
  };

  const loadCollectionPage = async (page = currentPage) => {
    setLoading(true);
    try {
      const data = await api.fetchCollectionPage(userId, {
        page,
        perPage,
        search: searchQuery,
        colors: selectedColor !== 'all' ? [selectedColor] : [],
        type: selectedType !== 'all' ? selectedType : '',
        rarity: selectedRarity !== 'all' ? selectedRarity : '',
        sortBy,
        sortOrder
      });
      
      setDisplayedCards(data.collection_cards || []);
      setTotalCards(data.total || 0);
      setTotalPages(data.pages || 1);
      setCurrentPage(data.page || 1);
    } catch (error) {
      console.error('Failed to load collection:', error);
      setDisplayedCards([]);
    } finally {
      setLoading(false);
    }
  };

  // Derive filter options from collection index
  const filterOptions = useMemo(() => {
    const colors = new Set();
    const types = new Set();
    const rarities = new Set();
    
    collectionIndex.forEach(card => {
      if (card.colors?.length) {
        card.colors.forEach(c => colors.add(c));
      } else {
        colors.add('Colorless');
      }
      
      if (card.type_line) {
        const mainType = card.type_line.split(' — ')[0].split(' ')[0];
        types.add(mainType);
      }
      
      if (card.rarity) {
        rarities.add(card.rarity);
      }
    });
    
    return {
      colors: Array.from(colors).sort(),
      types: Array.from(types).sort(),
      rarities: Array.from(rarities).sort()
    };
  }, [collectionIndex]);

  // Search preview - show matching cards from index
  const searchPreview = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    
    const query = searchQuery.toLowerCase();
    return collectionIndex
      .filter(card => 
        card.name.toLowerCase().includes(query) ||
        (card.type_line && card.type_line.toLowerCase().includes(query))
      )
      .slice(0, 5); // Show top 5 matches
  }, [searchQuery, collectionIndex]);

  const hasActiveFilters = searchQuery || selectedColor !== 'all' || 
                          selectedType !== 'all' || selectedRarity !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedColor('all');
    setSelectedType('all');
    setSelectedRarity('all');
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      loadCollectionPage(newPage);
      // Scroll to top of collection
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Search your collection..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="pl-10" 
          />
          
          {/* Search Preview Dropdown */}
          {searchPreview.length > 0 && (
            <div className="absolute top-full mt-1 w-full bg-background border rounded-md shadow-lg z-10">
              {searchPreview.map(card => (
                <div 
                  key={card.id} 
                  className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                  onClick={() => setSearchQuery(card.name)}
                >
                  <div className="font-medium">{card.name}</div>
                  <div className="text-xs text-muted-foreground">{card.type_line}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="px-3">
            {totalCards} cards
          </Badge>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" /> Filters
          </Button>
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
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Color</label>
              <select 
                value={selectedColor} 
                onChange={e => setSelectedColor(e.target.value)} 
                className="w-full p-2 border rounded bg-background"
              >
                <option value="all">All Colors</option>
                {filterOptions.colors.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Type</label>
              <select 
                value={selectedType} 
                onChange={e => setSelectedType(e.target.value)} 
                className="w-full p-2 border rounded bg-background"
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
                onChange={e => setSelectedRarity(e.target.value)} 
                className="w-full p-2 border rounded bg-background"
              >
                <option value="all">All Rarities</option>
                {filterOptions.rarities.map(r => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Sort By</label>
              <div className="flex gap-2">
                <select 
                  value={sortBy} 
                  onChange={e => setSortBy(e.target.value)} 
                  className="w-full p-2 border rounded bg-background"
                >
                  <option value="name">Name</option>
                  <option value="cmc">Mana Cost</option>
                  <option value="quantity">Quantity</option>
                </select>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Collection Grid/List */}
      {!loading && displayedCards.length > 0 ? (
        <>
          <div className={`grid gap-4 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1 md:grid-cols-2'
          }`}>
            {displayedCards.map((collectionCard) => (
              <CardDisplay
                key={collectionCard.card.scryfall_id}
                card={collectionCard.card}
                collectionCard={collectionCard}
                onUpdateQuantity={onUpdateQuantity}
                onBuildAround={onBuildAroundCard}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-center items-center gap-4 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex items-center gap-2">
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={i}
                    variant={pageNum === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="w-10"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} • Showing {((currentPage - 1) * perPage) + 1}-{Math.min(currentPage * perPage, totalCards)} of {totalCards} cards
          </div>
        </>
      ) : !loading && (
        <div className="text-center py-16 text-muted-foreground">
          <p>{hasActiveFilters ? "No cards match your filters." : "Your collection is empty."}</p>
          {hasActiveFilters && (
            <Button variant="link" onClick={clearFilters}>Clear Filters</Button>
          )}
        </div>
      )}
    </div>
  );
};

export default CollectionTab;