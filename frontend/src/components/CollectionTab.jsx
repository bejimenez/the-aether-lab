import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CardDisplay from './CardDisplay';
import CardDetailsModal from './CardDetailsModal';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  X, 
  SortAsc, 
  SortDesc, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';

const CollectionTab = ({ 
  collection, 
  onUpdateQuantity, 
  onBuildAroundCard,
  loading = false 
}) => {
  // State for modal
  const [selectedCard, setSelectedCard] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Existing state
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedColor, setSelectedColor] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 20;

  // Generate filter options from collection
  const filterOptions = useMemo(() => {
    if (!collection || collection.length === 0) {
      return { colors: [], types: [], rarities: [] };
    }

    const colors = new Set();
    const types = new Set();
    const rarities = new Set();

    collection.forEach(collectionCard => {
      const card = collectionCard.card;
      if (card.colors) {
        card.colors.forEach(color => colors.add(color));
      }
      if (card.type_line) {
        card.type_line.split(' ').forEach(type => {
          if (type && type !== '—') types.add(type);
        });
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
  }, [collection]);

  // Filter and sort collection
  const filteredCards = useMemo(() => {
    if (!collection) return [];

    let filtered = collection.filter(collectionCard => {
      const card = collectionCard.card;
      
      // Search filter
      if (searchQuery && !card.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Color filter
      if (selectedColor !== 'all') {
        if (!card.colors || !card.colors.includes(selectedColor)) {
          return false;
        }
      }
      
      // Type filter
      if (selectedType !== 'all') {
        if (!card.type_line || !card.type_line.toLowerCase().includes(selectedType.toLowerCase())) {
          return false;
        }
      }
      
      // Rarity filter
      if (selectedRarity !== 'all') {
        if (card.rarity !== selectedRarity) {
          return false;
        }
      }
      
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      const cardA = a.card;
      const cardB = b.card;
      let valueA, valueB;

      switch (sortBy) {
        case 'name':
          valueA = cardA.name.toLowerCase();
          valueB = cardB.name.toLowerCase();
          break;
        case 'cmc':
          valueA = cardA.cmc || 0;
          valueB = cardB.cmc || 0;
          break;
        case 'quantity':
          valueA = a.quantity;
          valueB = b.quantity;
          break;
        default:
          return 0;
      }

      if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [collection, searchQuery, selectedColor, selectedType, selectedRarity, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredCards.length / cardsPerPage);
  const displayedCards = filteredCards.slice(
    (currentPage - 1) * cardsPerPage,
    currentPage * cardsPerPage
  );

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedColor, selectedType, selectedRarity]);

  // Event handlers
  const handleShowDetails = (card) => {
    setSelectedCard(card);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCard(null);
  };

  const handlePageChange = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const clearFilters = () => {
    setSelectedColor('all');
    setSelectedType('all');
    setSelectedRarity('all');
    setSearchQuery('');
  };

  const hasActiveFilters = selectedColor !== 'all' || selectedType !== 'all' || 
                          selectedRarity !== 'all' || searchQuery.trim() !== '';

  const totalCards = collection?.reduce((sum, collectionCard) => sum + collectionCard.quantity, 0) || 0;

  if (!collection || collection.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground mb-4">Your collection is empty</p>
        <p className="text-sm text-muted-foreground">
          Search for cards and add them to your collection to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Search your collection..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="pl-10" 
          />
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
            {displayedCards.map((collectionCard) => {
              const card = collectionCard.card;
              return (
                <CardDisplay
                  key={card.scryfall_id}
                  card={card}
                  collectionCard={collectionCard}
                  onUpdateQuantity={onUpdateQuantity}
                  onBuildAround={onBuildAroundCard}
                  onShowDetails={handleShowDetails}
                />
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
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
                      className="w-8 h-8 p-0"
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
          )}
        </>
      ) : !loading && filteredCards.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-lg text-muted-foreground mb-2">No cards found</p>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or filters
          </p>
        </div>
      ) : null}

      {/* Card Details Modal */}
      {selectedCard && (
        <CardDetailsModal
          card={selectedCard}
          collectionCard={collection.find(cc => cc.card.scryfall_id === selectedCard.scryfall_id)}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onBuildAround={onBuildAroundCard}
          onUpdateQuantity={onUpdateQuantity}
        />
      )}
    </div>
  );
};

export default CollectionTab;