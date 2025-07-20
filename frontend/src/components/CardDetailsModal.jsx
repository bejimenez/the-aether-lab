import { useState, useEffect, useRef } from 'react';
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
  Plus
} from 'lucide-react';
import PrintingEntry from './PrintingEntry';
import * as api from '../api/mtgApi';
import ManaCost from './ManaCost';
import { useToast } from './ui/toast';

const CardDetailsModal = ({ 
  card, 
  isOpen, 
  onClose, 
  onBuildAround
}) => {
  const { addToast } = useToast();
  const [pricingExpanded, setPricingExpanded] = useState(false);
  const [rulingsExpanded, setRulingsExpanded] = useState(false);
  const [oracleExpanded, setOracleExpanded] = useState(true);
  const [keywordsExpanded, setKeywordsExpanded] = useState(true);
  const [pricingData, setPricingData] = useState(null);
  const [rulingsData, setRulingsData] = useState(null);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [loadingRulings, setLoadingRulings] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  // Printing variants state
  const [printingEntries, setPrintingEntries] = useState([]);
  const [loadingPrintings, setLoadingPrintings] = useState(false);
  const [totalCopies, setTotalCopies] = useState(0);

  // Rate limiting: Track last API call time to respect Scryfall's 50-100ms between requests
  const lastApiCallRef = useRef(0);
  const API_RATE_LIMIT_MS = 100; // Conservative 100ms between calls

  // Fetch both pricing and rulings data when modal opens
  useEffect(() => {
    if (isOpen && card?.scryfall_id && !initialDataLoaded) {
      fetchInitialData();
    }
  }, [isOpen, card, initialDataLoaded]);

  // Fetch printing variants when modal opens
  useEffect(() => {
    if (isOpen && card?.scryfall_id) {
      fetchPrintingVariants();
    }
  }, [isOpen, card]);

  // Reset state when modal closes or card changes
  useEffect(() => {
    if (!isOpen || !card) {
      setPricingData(null);
      setRulingsData(null);
      setInitialDataLoaded(false);
      setPricingExpanded(false);
      setRulingsExpanded(false);
      setOracleExpanded(true);
      setKeywordsExpanded(true);
      setPrintingEntries([]);
      setTotalCopies(0);
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

  // Printing variants management functions
  const fetchPrintingVariants = async () => {
    if (!card?.scryfall_id) return;
    
    setLoadingPrintings(true);
    try {
      const response = await api.getCardPrintings(card.scryfall_id, 1); // TODO: use actual user ID
      const data = await response.json();
      
      if (response.ok) {
        setPrintingEntries(data.printings || []);
        setTotalCopies(data.total_copies || 0);
      } else {
        console.error('Failed to fetch printing variants:', data.error);
      }
    } catch (error) {
      console.error('Error fetching printing variants:', error);
    } finally {
      setLoadingPrintings(false);
    }
  };

  const handleAddPrinting = async () => {
  if (!card) return;
  
  // Create a modal or form to collect printing details
  const newPrinting = {
    scryfall_id: card.scryfall_id,
    user_id: 1, // TODO: use actual user ID
    quantity: 1,
    is_foil: false,
    condition: 'near_mint',
    set_code: card.set_code || '',
    set_name: card.set_name || '',
    collector_number: '',
    is_alternate_art: false,
    is_promo: false
  };

  // You might want to show a modal here to let users customize the printing details
  // For now, we'll just add a default printing
  
  try {
    const response = await api.addPrintingVariant(newPrinting);
    const data = await response.json();
    
    if (response.ok) {
      await fetchPrintingVariants(); // Refresh the list
      addToast('Printing added successfully', 'success');
    } else {
      console.error('Failed to add printing variant:', data.error);
      addToast(data.error || 'Failed to add printing', 'error');
    }
  } catch (error) {
    console.error('Error adding printing variant:', error);
    addToast('Network error while adding printing', 'error');
  }
};

  const handleUpdatePrinting = async (updatedEntry) => {
    try {
      const response = await api.updatePrintingVariant(updatedEntry.id, updatedEntry);
      const data = await response.json();
      
      if (response.ok) {
        await fetchPrintingVariants(); // Refresh the list
      } else {
        console.error('Failed to update printing variant:', data.error);
      }
    } catch (error) {
      console.error('Error updating printing variant:', error);
    }
  };

  const handleDeletePrinting = async (printingId) => {
    try {
      const response = await api.deletePrintingVariant(printingId);
      
      if (response.ok) {
        await fetchPrintingVariants(); // Refresh the list
      } else {
        console.error('Failed to delete printing variant');
      }
    } catch (error) {
      console.error('Error deleting printing variant:', error);
    }
  };

  //const formatManaSymbols = (manaCost) => {
    //if (!manaCost) return '';
    // Enhanced mana symbol formatting - you can improve this further with actual mana symbol components
    //return manaCost.replace(/[{}]/g, '').replace(/([WUBRG])/g, '($1)');
  //};

  const formatPrice = (price) => {
    if (!price || price === null) return 'N/A';
    return `${parseFloat(price).toFixed(2)}`;
  };

  if (!card) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-2xl font-bold">
            {card.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            {/* Left Column - Card Image (spans 3 columns on xl screens) */}
            <div className="xl:col-span-3 space-y-3">
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
                
                {/* My Copies Section - Enhanced Collection Tracking */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      📚 My Copies ({totalCopies})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingPrintings ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Loading printing variants...
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Existing copies */}
                        {printingEntries.length > 0 ? (
                          printingEntries.map((entry, index) => (
                            <PrintingEntry 
                              key={entry.id || index}
                              entry={entry}
                              onUpdate={handleUpdatePrinting}
                              onDelete={handleDeletePrinting}
                            />
                          ))
                        ) : (
                          <div className="text-center text-muted-foreground py-4">
                            No copies in collection
                          </div>
                        )}
                        
                        {/* Add new printing button */}
                        <Button 
                          variant="outline" 
                          onClick={handleAddPrinting}
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Different Printing
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right Columns - Card Details (spans 9 columns on xl screens) */}
            <div className="xl:col-span-9 space-y-3">
              {/* Basic Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Card Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Mana Cost */}
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-muted-foreground block">Mana Cost</span>
                      <div className="bg-muted px-3 py-2 rounded flex items-center justify-center min-h-[2.5rem]">
                        {card.mana_cost ? (
                          <ManaCost 
                            manaCost={card.mana_cost} 
                            size="md" 
                            spacing="gap-1"
                            className="justify-center"
                          />
                        ) : (
                          <span className="text-muted-foreground font-medium">No Cost</span>
                        )}
                      </div>
                    </div>
                    
                    {/* CMC */}
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-muted-foreground block">CMC</span>
                      <div className="text-xl font-bold text-center bg-muted px-3 py-2 rounded min-h-[2.5rem] flex items-center justify-center">{card.cmc || 0}</div>
                    </div>
                    
                    {/* Power/Toughness or Type */}
                    <div className="space-y-2">
                      {card.power && card.toughness ? (
                        <>
                          <span className="text-sm font-medium text-muted-foreground block">Power/Toughness</span>
                          <div className="text-xl font-bold text-center bg-muted px-3 py-2 rounded min-h-[2.5rem] flex items-center justify-center">{card.power}/{card.toughness}</div>
                        </>
                      ) : (
                        <>
                          <span className="text-sm font-medium text-muted-foreground block">Type</span>
                          <div className="text-sm font-medium text-center bg-muted px-3 py-2 rounded min-h-[2.5rem] flex items-center justify-center">{card.type_line}</div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Type Line (if Power/Toughness is shown above) */}
                  {card.power && card.toughness && (
                    <div className="pt-2">
                      <span className="text-sm font-medium text-muted-foreground block mb-1">Type Line</span>
                      <div className="text-lg font-medium">{card.type_line}</div>
                    </div>
                  )}

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
                  </div>
                </CardContent>
              </Card>

              {/* Oracle Text */}
              {card.oracle_text && (
                <Card>
                  <CardContent className="p-4">
                    <Button 
                      variant="ghost" 
                      onClick={() => setOracleExpanded(!oracleExpanded)}
                      className="w-full justify-between p-3 h-auto hover:bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-5 h-5" />
                        <span className="text-lg font-medium">Oracle Text</span>
                      </div>
                      {oracleExpanded ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </Button>
                    
                    {oracleExpanded && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-base leading-relaxed whitespace-pre-line bg-muted p-4 rounded-lg">
                          {card.oracle_text}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Keywords */}
              {card.keywords && card.keywords.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <Button 
                      variant="ghost" 
                      onClick={() => setKeywordsExpanded(!keywordsExpanded)}
                      className="w-full justify-between p-3 h-auto hover:bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">🏷️</span>
                        <span className="text-lg font-medium">Keywords & Mechanics</span>
                      </div>
                      {keywordsExpanded ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </Button>
                    
                    {keywordsExpanded && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex flex-wrap gap-2">
                          {card.keywords.map((keyword, index) => (
                            <Badge key={index} variant="outline" className="text-sm px-3 py-1">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
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
                      <div className="mt-3 pt-3 border-t space-y-2">
                        {pricingData ? (
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="bg-muted p-2 rounded text-center">
                              <div className="text-xs text-muted-foreground mb-1">USD</div>
                              <div className="text-sm font-bold">{formatPrice(pricingData.usd)}</div>
                            </div>
                            <div className="bg-muted p-2 rounded text-center">
                              <div className="text-xs text-muted-foreground mb-1">USD Foil</div>
                              <div className="text-sm font-bold">{formatPrice(pricingData.usd_foil)}</div>
                            </div>
                            <div className="bg-muted p-2 rounded text-center">
                              <div className="text-xs text-muted-foreground mb-1">EUR</div>
                              <div className="text-sm font-bold">{formatPrice(pricingData.eur)}</div>
                            </div>
                            <div className="bg-muted p-2 rounded text-center">
                              <div className="text-xs text-muted-foreground mb-1">TIX</div>
                              <div className="text-sm font-bold">{formatPrice(pricingData.tix)}</div>
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
                      <div className="mt-3 pt-3 border-t space-y-3">
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
