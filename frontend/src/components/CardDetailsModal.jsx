import React, { useState, useEffect, useRef } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Hammer, 
  ChevronDown, 
  ChevronRight, 
  DollarSign,
  BookOpen,
  Loader2,
  Plus,
  Minus
} from 'lucide-react';

const CardDetailsModal = ({ 
  card, 
  collectionCard, 
  isOpen, 
  onClose, 
  onBuildAround,
  onUpdateQuantity 
}) => {
  const [pricingExpanded, setPricingExpanded] = useState(false);
  const [rulingsExpanded, setRulingsExpanded] = useState(false);
  const [pricingData, setPricingData] = useState(null);
  const [rulingsData, setRulingsData] = useState(null);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [loadingRulings, setLoadingRulings] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  // Rate limiting: Track last API call time to respect Scryfall's 50-100ms between requests
  const lastApiCallRef = useRef(0);
  const API_RATE_LIMIT_MS = 100; // Conservative 100ms between calls

  // Fetch both pricing and rulings data when modal opens
  useEffect(() => {
    if (isOpen && card?.scryfall_id && !initialDataLoaded) {
      fetchInitialData();
    }
  }, [isOpen, card, initialDataLoaded]);

  // Reset state when modal closes or card changes
  useEffect(() => {
    if (!isOpen || !card) {
      setPricingData(null);
      setRulingsData(null);
      setInitialDataLoaded(false);
      setPricingExpanded(false);
      setRulingsExpanded(false);
    }
  }, [isOpen, card]);

  const rateLimitedFetch = async (url) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCallRef.current;
    
    if (timeSinceLastCall < API_RATE_LIMIT_MS) {
      await new Promise(resolve => setTimeout(resolve, API_RATE_LIMIT_MS - timeSinceLastCall));
    }
    
    lastApiCallRef.current = Date.now();
    return fetch(url);
  };

  const fetchInitialData = async () => {
    setLoadingPricing(true);
    setLoadingRulings(true);
    
    try {
      // Fetch pricing data first
      const pricingResponse = await rateLimitedFetch(`https://api.scryfall.com/cards/${card.scryfall_id}`);
      if (pricingResponse.ok) {
        const pricingResult = await pricingResponse.json();
        setPricingData(pricingResult.prices || {});
      } else {
        setPricingData({});
      }
      setLoadingPricing(false);

      // Fetch rulings data with rate limiting
      const rulingsResponse = await rateLimitedFetch(`https://api.scryfall.com/cards/${card.scryfall_id}/rulings`);
      if (rulingsResponse.ok) {
        const rulingsResult = await rulingsResponse.json();
        setRulingsData(rulingsResult.data || []);
      } else {
        setRulingsData([]);
      }
      setLoadingRulings(false);
      
      setInitialDataLoaded(true);
    } catch (error) {
      console.error('Failed to fetch card data:', error);
      setPricingData({});
      setRulingsData([]);
      setLoadingPricing(false);
      setLoadingRulings(false);
      setInitialDataLoaded(true);
    }
  };

  const formatManaSymbols = (manaCost) => {
    if (!manaCost) return '';
    // Enhanced mana symbol formatting - you can improve this further with actual mana symbol components
    return manaCost.replace(/[{}]/g, '').replace(/([WUBRG])/g, '($1)');
  };

  const formatPrice = (price) => {
    if (!price || price === null) return 'N/A';
    return `${parseFloat(price).toFixed(2)}`;
  };

  if (!card) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-2xl font-bold">
            {card.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Left Column - Card Image (spans 4 columns on xl screens) */}
            <div className="xl:col-span-4 space-y-4">
              {/* Prominent Card Image */}
              {card.image_uri && (
                <div className="w-full flex justify-center">
                  <img 
                    src={card.image_uri} 
                    alt={card.name}
                    className="w-full max-w-[300px] rounded-lg shadow-xl border"
                  />
                </div>
              )}
              
              {/* Action Buttons - Always visible and prominent */}
              <div className="space-y-3">
                {onBuildAround && (
                  <Button 
                    onClick={() => onBuildAround(card)} 
                    className="w-full h-12 text-base"
                    size="lg"
                  >
                    <Hammer className="w-5 h-5 mr-2" />
                    Build Deck Around This
                  </Button>
                )}
                
                {collectionCard && onUpdateQuantity && (
                  <div className="bg-muted rounded-lg p-4">
                    <div className="text-sm font-medium text-center mb-2">In Collection</div>
                    <div className="flex items-center justify-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateQuantity(card.scryfall_id, collectionCard.quantity - 1)}
                        disabled={collectionCard.quantity <= 0}
                        className="h-10 w-10 p-0"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="px-4 py-2 bg-background rounded text-lg font-bold min-w-[4rem] text-center">
                        {collectionCard.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateQuantity(card.scryfall_id, collectionCard.quantity + 1)}
                        className="h-10 w-10 p-0"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Columns - Card Details (spans 8 columns on xl screens) */}
            <div className="xl:col-span-8 space-y-4">
              {/* Basic Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Card Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground block mb-1">Mana Cost</span>
                        <div className="font-mono text-xl bg-muted px-3 py-2 rounded">
                          {formatManaSymbols(card.mana_cost) || 'No Cost'}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground block mb-1">Converted Mana Cost</span>
                        <div className="text-2xl font-bold">{card.cmc || 0}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground block mb-1">Type Line</span>
                        <div className="text-lg font-medium">{card.type_line}</div>
                      </div>
                      
                      {card.power && card.toughness && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground block mb-1">Power/Toughness</span>
                          <div className="text-2xl font-bold">{card.power}/{card.toughness}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Badges Section */}
                  <div className="flex gap-2 flex-wrap pt-2 border-t">
                    <Badge variant="default" className="text-sm px-3 py-1">
                      {card.rarity?.charAt(0).toUpperCase() + card.rarity?.slice(1)}
                    </Badge>
                    {card.colors && card.colors.length > 0 && (
                      <Badge variant="secondary" className="text-sm px-3 py-1">
                        Colors: {card.colors.join(', ')}
                      </Badge>
                    )}
                    {card.set_code && (
                      <Badge variant="outline" className="text-sm px-3 py-1">
                        {card.set_name} ({card.set_code.toUpperCase()})
                      </Badge>
                    )}
                    {/* Collection quantity badge - only show when opened from search */}
                    {card._modalContext === 'search' && (
                      <Badge variant="destructive" className="text-sm px-3 py-1 bg-green-600 hover:bg-green-700">
                        {collectionCard ? `${collectionCard.quantity} in Collection` : '0 in Collection'}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Oracle Text */}
              {card.oracle_text && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Oracle Text</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-base leading-relaxed whitespace-pre-line bg-muted p-4 rounded-lg">
                      {card.oracle_text}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Keywords */}
              {card.keywords && card.keywords.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Keywords & Mechanics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {card.keywords.map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-sm px-3 py-1">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Expandable Sections */}
              <div className="space-y-3">
                {/* Pricing Data */}
                <Card>
                  <CardContent className="p-4">
                    <Button 
                      variant="ghost" 
                      onClick={() => setPricingExpanded(!pricingExpanded)}
                      className="w-full justify-between p-3 h-auto hover:bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5" />
                        <span className="text-lg font-medium">Pricing Data</span>
                      </div>
                      {loadingPricing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : pricingExpanded ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </Button>
                    
                    {pricingExpanded && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        {pricingData ? (
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-muted p-3 rounded text-center">
                              <div className="text-sm text-muted-foreground mb-1">USD</div>
                              <div className="text-lg font-bold">{formatPrice(pricingData.usd)}</div>
                            </div>
                            <div className="bg-muted p-3 rounded text-center">
                              <div className="text-sm text-muted-foreground mb-1">USD Foil</div>
                              <div className="text-lg font-bold">{formatPrice(pricingData.usd_foil)}</div>
                            </div>
                            <div className="bg-muted p-3 rounded text-center">
                              <div className="text-sm text-muted-foreground mb-1">EUR</div>
                              <div className="text-lg font-bold">{formatPrice(pricingData.eur)}</div>
                            </div>
                            <div className="bg-muted p-3 rounded text-center">
                              <div className="text-sm text-muted-foreground mb-1">TIX</div>
                              <div className="text-lg font-bold">{formatPrice(pricingData.tix)}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground py-4">
                            No pricing data available
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Rulings */}
                <Card>
                  <CardContent className="p-4">
                    <Button 
                      variant="ghost" 
                      onClick={() => setRulingsExpanded(!rulingsExpanded)}
                      className="w-full justify-between p-3 h-auto hover:bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-5 h-5" />
                        <span className="text-lg font-medium">Official Rulings</span>
                      </div>
                      {loadingRulings ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : rulingsExpanded ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </Button>
                    
                    {rulingsExpanded && (
                      <div className="mt-4 pt-4 border-t space-y-4">
                        {rulingsData && rulingsData.length > 0 ? (
                          rulingsData.map((ruling, index) => (
                            <div key={index} className="border-l-4 border-primary pl-4 py-2">
                              <div className="text-sm font-medium text-muted-foreground mb-2">
                                {new Date(ruling.published_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </div>
                              <div className="text-base leading-relaxed">
                                {ruling.comment}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-muted-foreground py-4">
                            No official rulings available for this card
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CardDetailsModal;