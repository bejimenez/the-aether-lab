import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const AddPrintingModal = ({ card, isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    quantity: 1,
    is_foil: false,
    condition: 'near_mint',
    set_code: card?.set_code || '',
    set_name: card?.set_name || '',
    collector_number: '',
    is_alternate_art: false,
    is_promo: false
  });

  const conditions = [
    { value: 'mint', label: 'Mint (M)' },
    { value: 'near_mint', label: 'Near Mint (NM)' },
    { value: 'lightly_played', label: 'Lightly Played (LP)' },
    { value: 'moderately_played', label: 'Moderately Played (MP)' },
    { value: 'heavily_played', label: 'Heavily Played (HP)' },
    { value: 'damaged', label: 'Damaged (D)' }
  ];

  const handleSubmit = () => {
    onAdd({
      ...formData,
      scryfall_id: card.scryfall_id,
      user_id: 1 // TODO: use actual user ID
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Printing of {card?.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
              />
            </div>
            
            <div>
              <Label>Condition</Label>
              <Select
                value={formData.condition}
                onValueChange={(value) => setFormData({...formData, condition: value})}
              >
                {conditions.map(cond => (
                  <option key={cond.value} value={cond.value}>
                    {cond.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          
          <div>
            <Label>Set</Label>
            <Input
              value={formData.set_name}
              onChange={(e) => setFormData({...formData, set_name: e.target.value})}
              placeholder="e.g., Bloomburrow"
            />
          </div>
          
          <div>
            <Label>Collector Number</Label>
            <Input
              value={formData.collector_number}
              onChange={(e) => setFormData({...formData, collector_number: e.target.value})}
              placeholder="e.g., 123"
            />
          </div>
          
          <div className="space-y-2">
            <Checkbox
              checked={formData.is_foil}
              onCheckedChange={(checked) => setFormData({...formData, is_foil: checked})}
            >
              Foil
            </Checkbox>
            
            <Checkbox
              checked={formData.is_promo}
              onCheckedChange={(checked) => setFormData({...formData, is_promo: checked})}
            >
              Promo
            </Checkbox>
            
            <Checkbox
              checked={formData.is_alternate_art}
              onCheckedChange={(checked) => setFormData({...formData, is_alternate_art: checked})}
            >
              Alternate Art
            </Checkbox>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Add Printing</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddPrintingModal;