// frontend/src/components/DeckBuilder.jsx

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import * as api from '../api/mtgApi.js';

const DeckBuilder = ({ deck, currentUser, onClose }) => {
  const [deckDetails, setDeckDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDeckDetails();
  }, [deck.id]);

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

  const handleSave = async () => {
    // For now, just show a message - we'll implement saving later
    alert('Deck saved! (Feature coming in next step)');
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
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-lg min-w-[3rem]">{deckCard.quantity}x</span>
                            <div className="flex flex-col">
                              <span className="font-medium">{deckCard.card?.name || 'Unknown Card'}</span>
                              <span className="text-sm text-muted-foreground">
                                {deckCard.card?.type_line || ''}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-sm text-muted-foreground">
                              {deckCard.card?.mana_cost && (
                                <span className="font-mono bg-muted px-2 py-1 rounded">
                                  {deckCard.card.mana_cost}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              CMC: {deckCard.card?.cmc || 0}
                            </div>
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

            {/* Placeholder for future features */}
            <Card>
              <CardHeader>
                <CardTitle>Add Cards</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4 text-muted-foreground">
                  Card addition feature coming in Step 3!
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