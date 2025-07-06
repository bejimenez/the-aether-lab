import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

const DecksTab = ({ decks, onCreateDeckClick, onDeckClick, onDeleteDeck }) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold">My Decks</h2>
      <Button onClick={onCreateDeckClick}>
        <Plus className="w-4 h-4 mr-2" />
        Create Deck
      </Button>
    </div>

    {decks.length === 0 ? (
      <div className="text-center py-8 text-muted-foreground">
        No decks yet. Create your first deck!
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {decks.map(deck => (
          <Card 
            key={deck.id} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onDeckClick(deck)}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle>{deck.name}</CardTitle>
                  <CardDescription>{deck.description || 'No description'}</CardDescription>
                </div>
                {onDeleteDeck && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDeck(deck.id);
                    }}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    title="Delete deck"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Format: {deck.format}</span>
                <span>Updated: {new Date(deck.updated_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )}
  </div>
);

export default DecksTab;