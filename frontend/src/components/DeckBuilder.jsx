// Create this as: frontend/src/components/DeckBuilder.jsx

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Plus, Search, Minus, Trash2 } from 'lucide-react';
import * as api from '../api/mtgApi.js';
import ManaCost from './ManaCost';

const DeckBuilder = ({ deck, currentUser, onClose }) => {
  const [deckDetails, setDeckDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Collection search state
  const [collection, setCollection] = useState([]);
  const [collectionSearch, setCollectionSearch] = useState('');
  const [filteredCollection, setFilteredCollection] = useState([]);
  const [collectionLoading, setCollectionLoading] = useState(false);
  const [addingCard, setAddingCard] = useState(null); // Track which card is being added
  const [updatingCard, setUpdatingCard] = useState(null); // Track which deck card is being updated
  const [addingBasicLand, setAddingBasicLand] = useState(null); // Track which basic land is being added

  useEffect(() => {
    loadDeckDetails();
    loadCollection();
  }, [deck.id]);

  // Filter collection based on search
  useEffect(() => {
    if (collectionSearch.trim() === '') {
      setFilteredCollection(collection);
    } else {
      const filtered = collection.filter(item => {
        const cardName = item.card?.name || item.name || '';
        const cardType = item.card?.type_line || item.type_line || '';
        
        return cardName.toLowerCase().includes(collectionSearch.toLowerCase()) ||
               cardType.toLowerCase().includes(collectionSearch.toLowerCase());
      });
      
      setFilteredCollection(filtered);
    }
  }, [collection, collectionSearch]);

  const loadDeckDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await api.fetchDeckDetails(deck.id);
      setDeckDetails(data);
    } catch (err) {
      console.error('Error loading deck details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCollection = async () => {
    try {
      setCollectionLoading(true);
      const data = await api.fetchCollection(currentUser);
      
      // Handle the actual API response structure
      let collectionCards = [];
      if (data.collection_cards) {
        collectionCards = data.collection_cards;
      } else if (data.cards) {
        collectionCards = data.cards;
      } else if (data.collection) {
        collectionCards = data.collection;
      } else if (Array.isArray(data)) {
        collectionCards = data;
      }
      
      setCollection(collectionCards);
      setFilteredCollection(collectionCards);
    } catch (err) {
      console.error('Error loading collection:', err);
      // Don't set error state, just log it - collection loading failure shouldn't break the deck builder
    } finally {
      setCollectionLoading(false);
    }
  };

  const handleAddCardToDeck = async (collectionCard) => {
    try {
      const cardId = collectionCard.id || collectionCard.card?.id || collectionCard.card?.scryfall_id;
      const card = collectionCard.card || collectionCard;
      const scryfallId = card.scryfall_id || card.id;
      
      setAddingCard(cardId);
      await api.addCardToDeck(deck.id, scryfallId);
      // Reload deck details to show the new card
      await loadDeckDetails();
    } catch (err) {
      console.error('Error adding card to deck:', err);
      alert('Failed to add card to deck. Please try again.');
    } finally {
      setAddingCard(null);
    }
  };

  const handleUpdateDeckCardQuantity = async (deckCard, newQuantity) => {
    try {
      setUpdatingCard(deckCard.id);
      
      // Use updateDeckCard for all quantity changes (including removal when quantity is 0)
      await api.updateDeckCard(deck.id, deckCard.id, newQuantity);
      
      // Reload deck details to show the updated quantities
      await loadDeckDetails();
    } catch (err) {
      console.error('Error updating card quantity:', err);
      alert('Failed to update card quantity. Please try again.');
    } finally {
      setUpdatingCard(null);
    }
  };

  // Basic lands data
  const basicLands = [
    { name: 'Plains', color: 'W' },
    { name: 'Island', color: 'U' },
    { name: 'Swamp', color: 'B' },
    { name: 'Mountain', color: 'R' },
    { name: 'Forest', color: 'G' }
  ];

  const handleAddBasicLand = async (basicLand) => {
    try {
      setAddingBasicLand(basicLand.name);
      
      // Use the new API function to add basic land
      await api.addBasicLandToDeck(deck.id, basicLand.name);
      
      // Reload deck details to show the new card
      await loadDeckDetails();
    } catch (err) {
      console.error('Error adding basic land:', err);
      alert(`Failed to add ${basicLand.name}. Please try again.`);
    } finally {
      setAddingBasicLand(null);
    }
  };

  const handleSave = async () => {
    // For UX purposes - data is already saved automatically
    alert('Deck saved successfully!');
  };

  // Helper function to sort cards by mana cost, then by name
  const sortCardsByManaAndName = (cards) => {
    return cards.sort((a, b) => {
      const cmcA = a.card?.cmc || 0;
      const cmcB = b.card?.cmc || 0;
      
      if (cmcA !== cmcB) {
        return cmcA - cmcB;
      }
      
      const nameA = a.card?.name || '';
      const nameB = b.card?.name || '';
      return nameA.localeCompare(nameB);
    });
  };

  // Helper function to check if a card is already in the deck
  const isCardInDeck = (scryfallId) => {
    return deckDetails?.cards?.some(deckCard => deckCard.card?.scryfall_id === scryfallId);
  };

  // Helper function to get card quantity in deck
  const getCardQuantityInDeck = (scryfallId) => {
    const deckCard = deckDetails?.cards?.find(deckCard => deckCard.card?.scryfall_id === scryfallId);
    return deckCard?.quantity || 0;
  };

  // Helper function to check if a basic land is in the deck (by name)
  const isBasicLandInDeck = (landName) => {
    return deckDetails?.cards?.some(deckCard => 
      deckCard.card?.name === landName && 
      deckCard.card?.type_line?.includes('Basic Land')
    );
  };

  // Helper function to get basic land quantity in deck (by name)
  const getBasicLandQuantityInDeck = (landName) => {
    const deckCard = deckDetails?.cards?.find(deckCard => 
      deckCard.card?.name === landName && 
      deckCard.card?.type_line?.includes('Basic Land')
    );
    return deckCard?.quantity || 0;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading deck...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-destructive mb-4">Error Loading Deck</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={onClose}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Decks
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-auto">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onClose}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Decks
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{deck.name}</h1>
              <p className="text-muted-foreground">
                {deck.description || 'No description'} • Format: {deck.format}
              </p>
            </div>
          </div>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Deck
          </Button>
        </div>

        {/* Deck Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Deck Area */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Deck Cards</CardTitle>
                <CardDescription>
                  {deckDetails ? 
                    `${deckDetails.statistics?.total_cards || 0} cards total` : 
                    'Loading deck cards...'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {deckDetails ? (
                  <div className="space-y-2">
                    {deckDetails.cards?.length > 0 ? (
                      sortCardsByManaAndName(deckDetails.cards).map((deckCard) => (
                        <div key={deckCard.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateDeckCardQuantity(deckCard, deckCard.quantity - 1)}
                                disabled={updatingCard === deckCard.id}
                                className="h-8 w-8 p-0"
                              >
                                {updatingCard === deckCard.id ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                                ) : (
                                  <Minus className="w-3 h-3" />
                                )}
                              </Button>
                              <span className="font-bold text-lg min-w-[3rem] text-center">{deckCard.quantity}x</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateDeckCardQuantity(deckCard, deckCard.quantity + 1)}
                                disabled={updatingCard === deckCard.id}
                                className="h-8 w-8 p-0"
                              >
                                {updatingCard === deckCard.id ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                                ) : (
                                  <Plus className="w-3 h-3" />
                                )}
                              </Button>
                            </div>
                            <div className="flex flex-col flex-1">
                              <span className="font-medium">{deckCard.card?.name || 'Unknown Card'}</span>
                              <span className="text-sm text-muted-foreground">
                                {deckCard.card?.type_line || ''}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-sm text-muted-foreground">
                              {deckCard.card?.mana_cost && (
                                <div className="flex items-center gap-2 bg-muted px-2 py-1 rounded">
                                  <ManaCost 
                                    manaCost={deckCard.card.mana_cost} 
                                    size="sm" 
                                  />
                                </div>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              CMC: {deckCard.card?.cmc || 0}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateDeckCardQuantity(deckCard, 0)}
                              disabled={updatingCard === deckCard.id}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              title="Remove card from deck"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No cards in this deck yet. Add some cards to get started!
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading deck cards...
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Deck Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Deck Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                {deckDetails?.statistics ? (
                  <div className="space-y-4">
                    {/* Card Counts */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Cards:</span>
                        <span className="font-medium">{deckDetails.statistics.total_cards}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Mainboard:</span>
                        <span className="font-medium">{deckDetails.statistics.mainboard_cards}</span>
                      </div>
                      {deckDetails.statistics.sideboard_cards > 0 && (
                        <div className="flex justify-between">
                          <span>Sideboard:</span>
                          <span className="font-medium">{deckDetails.statistics.sideboard_cards}</span>
                        </div>
                      )}
                    </div>

                    {/* Mana Curve */}
                    {deckDetails.statistics.mana_curve && Object.keys(deckDetails.statistics.mana_curve).length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Mana Curve</h4>
                        <div className="space-y-1">
                          {Object.entries(deckDetails.statistics.mana_curve)
                            .sort(([a], [b]) => parseInt(a) - parseInt(b))
                            .map(([cmc, count]) => (
                              <div key={cmc} className="flex items-center gap-2">
                                <span className="text-sm w-8">{cmc}:</span>
                                <div className="flex-1 bg-muted rounded-full h-2">
                                  <div 
                                    className="bg-primary rounded-full h-2 transition-all duration-300"
                                    style={{ 
                                      width: `${Math.min(100, (count / Math.max(...Object.values(deckDetails.statistics.mana_curve))) * 100)}%` 
                                    }}
                                  />
                                </div>
                                <span className="text-sm w-8 text-right">{count}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Color Distribution */}
                    {deckDetails.statistics.color_distribution && Object.keys(deckDetails.statistics.color_distribution).length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Color Distribution</h4>
                        <div className="space-y-1">
                          {Object.entries(deckDetails.statistics.color_distribution)
                            .sort(([,a], [,b]) => b - a)
                            .map(([color, count]) => {
                              const colorNames = {
                                'W': 'White',
                                'U': 'Blue', 
                                'B': 'Black',
                                'R': 'Red',
                                'G': 'Green',
                                'C': 'Colorless'
                              };
                              const colorClasses = {
                                'W': 'bg-yellow-200',
                                'U': 'bg-blue-200',
                                'B': 'bg-gray-800',
                                'R': 'bg-red-200',
                                'G': 'bg-green-200',
                                'C': 'bg-gray-200'
                              };
                              return (
                                <div key={color} className="flex items-center gap-2">
                                  <div className={`w-4 h-4 rounded-full ${colorClasses[color] || 'bg-gray-200'}`} />
                                  <span className="text-sm flex-1">{colorNames[color] || color}</span>
                                  <span className="text-sm font-medium">{count}</span>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-muted-foreground">Loading statistics...</div>
                )}
              </CardContent>
            </Card>

            {/* Add Cards from Collection */}
            <Card>
              <CardHeader>
                <CardTitle>Add Cards from Collection</CardTitle>
                <CardDescription>Search your collection to add cards to this deck</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search your collection..."
                      value={collectionSearch}
                      onChange={(e) => setCollectionSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Collection Results */}
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {collectionLoading ? (
                      <div className="text-center py-4 text-muted-foreground">
                        Loading collection...
                      </div>
                    ) : filteredCollection.length > 0 ? (
                      filteredCollection.slice(0, 20).map((collectionCard) => {
                        // Handle different possible data structures
                        const card = collectionCard.card || collectionCard;
                        const quantity = collectionCard.quantity || 1;
                        const cardId = collectionCard.id || collectionCard.card?.id || card.id;
                        
                        const inDeck = isCardInDeck(card?.scryfall_id);
                        const deckQuantity = getCardQuantityInDeck(card?.scryfall_id);
                        
                        return (
                          <div key={cardId} className="flex items-center justify-between p-2 border rounded hover:bg-muted/50 transition-colors">
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="font-medium truncate">{card?.name || 'Unknown Card'}</span>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Owned: {quantity}</span>
                                {inDeck && (
                                  <span className="text-primary font-medium">In Deck: {deckQuantity}</span>
                                )}
                                {card?.mana_cost && (
                                  <span className="font-mono bg-muted px-1 rounded text-xs">
                                    {card.mana_cost}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant={inDeck ? "default" : "outline"}
                              onClick={() => handleAddCardToDeck(collectionCard)}
                              className="ml-2"
                              disabled={addingCard === cardId}
                            >
                              {addingCard === cardId ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                              ) : (
                                <Plus className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        {collectionSearch ? 'No cards found matching your search.' : 'Your collection is empty.'}
                      </div>
                    )}
                    
                    {/* Show message if results are truncated */}
                    {filteredCollection.length > 20 && (
                      <div className="text-center py-2 text-sm text-muted-foreground">
                        Showing first 20 results. Use search to narrow down.
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Basic Lands */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Lands</CardTitle>
                <CardDescription>Add basic lands to your deck (unlimited supply)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {basicLands.map((basicLand) => {
                    const inDeck = isBasicLandInDeck(basicLand.name);
                    const deckQuantity = getBasicLandQuantityInDeck(basicLand.name);
                    
                    const colorClasses = {
                      'W': 'bg-yellow-100 text-yellow-800 border-yellow-300',
                      'U': 'bg-blue-100 text-blue-800 border-blue-300',
                      'B': 'bg-gray-100 text-gray-800 border-gray-300',
                      'R': 'bg-red-100 text-red-800 border-red-300',
                      'G': 'bg-green-100 text-green-800 border-green-300'
                    };
                    
                    return (
                      <div key={basicLand.name} className={`flex items-center justify-between p-2 border rounded hover:bg-muted/50 transition-colors ${colorClasses[basicLand.color]}`}>
                        <div className="flex flex-col flex-1">
                          <span className="font-medium">{basicLand.name}</span>
                          <div className="flex items-center gap-2 text-sm">
                            <span>Basic Land</span>
                            {inDeck && (
                              <span className="font-medium">In Deck: {deckQuantity}</span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={inDeck ? "default" : "outline"}
                          onClick={() => handleAddBasicLand(basicLand)}
                          disabled={addingBasicLand === basicLand.name}
                        >
                          {addingBasicLand === basicLand.name ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeckBuilder;