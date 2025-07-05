import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Hammer } from 'lucide-react';

const CardDisplay = ({
  card,
  collectionCard,
  onAdd,
  onUpdateQuantity,
  onBuildAround,
}) => (
  <Card className="w-full max-w-sm flex flex-col">
    <CardHeader className="pb-2">
      <div className="flex justify-between items-start">
        <CardTitle className="text-lg">{card.name}</CardTitle>
        <Badge variant="secondary">{card.rarity}</Badge>
      </div>
      <CardDescription className="text-sm">
        {card.mana_cost && <span className="font-mono">{card.mana_cost}</span>}
        {card.type_line && <div className="mt-1">{card.type_line}</div>}
      </CardDescription>
    </CardHeader>
    <CardContent className="flex flex-col flex-grow justify-between">
      <div>
        {card.image_uri && (
          <img
            src={card.image_uri}
            alt={card.name}
            className="w-full h-auto rounded-md mb-3"
            loading="lazy"
          />
        )}
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

export default CardDisplay;