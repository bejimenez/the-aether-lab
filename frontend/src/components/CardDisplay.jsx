import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Hammer, Eye } from 'lucide-react';
import { useState } from 'react';
import ManaCost from './ManaCost';

// Generic Magic card back image URL - you can host this locally or use a CDN
const MAGIC_CARD_BACK_URL = 'https://cards.scryfall.io/large/back/0/0/0000000-0000-0000-0000-000000000000.jpg';

const CardDisplay = ({
  card,
  collectionCard,
  onAdd,
  onUpdateQuantity,
  onBuildAround,
  onShowDetails,
  showCollectionBadge = false
}) => {
  const [imageError, setImageError] = useState(false);
  
  // Determine which image to show
  const getImageUrl = () => {
    if (imageError || !card.image_uri) {
      return MAGIC_CARD_BACK_URL;
    }
    return card.image_uri;
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <Card className="w-full max-w-sm flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{card.name}</CardTitle>
          <div className="flex gap-2">
            <Badge variant="secondary">{card.rarity}</Badge>
            {/* Collection quantity badge - only show in search context */}
            {showCollectionBadge && (
              <Badge variant="destructive" className="bg-green-600 hover:bg-green-700 text-white">
                {collectionCard ? `${collectionCard.quantity} in Collection` : '0 in Collection'}
              </Badge>
            )}
          </div>
        </div>
        <CardDescription className="text-sm">
          {/* Replace text mana cost with visual symbols */}
          {card.mana_cost && (
            <div className="flex items-center gap-2 mb-1">
              <ManaCost manaCost={card.mana_cost} size="sm" />
              <span className="text-xs text-muted-foreground">
                CMC: {card.cmc || 0}
              </span>
            </div>
          )}
          {card.type_line && <div className="mt-1">{card.type_line}</div>}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow justify-between">
        <div>
          {/* Image with fallback */}
          <div className="relative mb-3">
            <img
              src={getImageUrl()}
              alt={card.name}
              className="w-full h-48 object-cover object-[center_25%] rounded-md mb-3"
              loading="lazy"
              onError={handleImageError}
            />
            {/* Show a small indicator if using fallback image */}
            {(imageError || !card.image_uri) && (
              <div className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded">
                No Art
              </div>
            )}
          </div>
          
          {/* Oracle text - keep this as it provides important game information */}
          {card.oracle_text && (
            <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded mb-3 line-clamp-3">
              {card.oracle_text}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 mt-auto">
          {onAdd && (
            <Button onClick={() => onAdd(card)} className="w-full">
              Add to Collection
            </Button>
          )}
          {collectionCard && onUpdateQuantity && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateQuantity(card.scryfall_id, collectionCard.quantity - 1)}
                disabled={collectionCard.quantity <= 0}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="px-3 py-1 bg-muted rounded text-sm font-medium">
                {collectionCard.quantity}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateQuantity(card.scryfall_id, collectionCard.quantity + 1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Details Button - Always visible */}
          {onShowDetails && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onShowDetails(card)}
              className="w-full"
            >
              <Eye className="w-4 h-4 mr-2" />
              Details
            </Button>
          )}
          {onBuildAround && (
            <Button variant="outline" onClick={() => onBuildAround(card)} className="w-full">
              <Hammer className="w-4 h-4 mr-2" />
              Build Deck Around This
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CardDisplay;