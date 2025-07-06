import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const CreateDeckDialog = ({ open, onOpenChange, onCreateDeck }) => {
  const [deckName, setDeckName] = useState('');

  const handleCreate = () => {
    if (deckName.trim()) {
      onCreateDeck(deckName);
      setDeckName(''); // Reset for next time
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Deck</DialogTitle>
          <DialogDescription>Enter a name for your new deck.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Input
            placeholder="e.g., Mono-Red Goblins"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Deck</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDeckDialog;