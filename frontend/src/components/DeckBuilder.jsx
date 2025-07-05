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
                      deckDetails.cards.map((deckCard) => (
                        <div key={deckCard.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{deckCard.quantity}x</span>
                            <span>{deckCard.card?.name || 'Unknown Card'}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {deckCard.card?.mana_cost || ''}
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