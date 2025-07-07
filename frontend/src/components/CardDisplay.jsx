import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Hammer, Eye } from 'lucide-react';
import { useState, useRef } from 'react';
import ManaCost from './ManaCost';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

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
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const cardRef = useRef(null);

  // Get quantity - either from collectionCard or default to 0
  const quantity = collectionCard?.quantity || 0;

  // Card-specific shortcuts that only work when this card is focused/hovered
  const cardShortcuts = {
    'a': () => {
      if (isFocused || isHovered) {
        if (onAdd) {
          onAdd(card);
        } else if (onUpdateQuantity && quantity >= 0) {
          onUpdateQuantity(card.scryfall_id, quantity + 1);
        }
      }
    },
    'd': () => {
      if ((isFocused || isHovered) && quantity > 0 && onUpdateQuantity) {
        onUpdateQuantity(card.scryfall_id, quantity - 1);
      }
    },
    '+': () => {
      if ((isFocused || isHovered) && quantity > 0 && onUpdateQuantity) {
        onUpdateQuantity(card.scryfall_id, quantity + 1);
      }
    },
    '-': () => {
      if ((isFocused || isHovered) && quantity > 1 && onUpdateQuantity) {
        onUpdateQuantity(card.scryfall_id, quantity - 1);
      }
    },
    'b': () => {
      if ((isFocused || isHovered) && onBuildAround) {
        onBuildAround(card);
      }
    },
    'enter': () => {
      if (isFocused) {
        // Quick add/increment
        if (quantity === 0 && onAdd) {
          onAdd(card);
        } else if (onUpdateQuantity) {
          onUpdateQuantity(card.scryfall_id, quantity + 1);
        }
      }
    }
  };

  useKeyboardShortcuts(cardShortcuts);
  
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
    <Card 
      ref={cardRef}
      className={`w-full max-w-sm flex flex-col cursor-pointer transition-all duration-200 ${
        isFocused ? 'ring-2 ring-blue-500 ring-offset-2' : ''
      } ${isHovered ? 'shadow-lg transform scale-105' : ''}`}
      tabIndex={0}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
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
          {/* Keyboard shortcuts hint - shown when focused */}
          {isFocused && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-2 text-xs">
              <div className="text-blue-800 dark:text-blue-200 font-medium mb-1">Keyboard Shortcuts:</div>
              <div className="text-blue-700 dark:text-blue-300 space-y-0.5">
                <div>A: Add to collection</div>
                {quantity > 0 && <div>D: Remove from collection</div>}
                {quantity > 0 && <div>+/-: Adjust quantity</div>}
                <div>B: Build deck around</div>
                <div>Enter: Quick add/increment</div>
              </div>
            </div>
          )}
          
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