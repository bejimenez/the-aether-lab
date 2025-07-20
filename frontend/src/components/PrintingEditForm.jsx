import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, X } from 'lucide-react';

const PrintingEditForm = ({ entry, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    quantity: entry.quantity,
    is_foil: entry.is_foil,
    condition: entry.condition,
    printing_details: {
      set_code: entry.printing_details?.set_code || '',
      set_name: entry.printing_details?.set_name || '',
      collector_number: entry.printing_details?.collector_number || '',
      is_alternate_art: entry.printing_details?.is_alternate_art || false,
      is_promo: entry.printing_details?.is_promo || false
    }
  });

  const conditions = [
    { value: 'mint', label: 'Mint (M)' },
    { value: 'near_mint', label: 'Near Mint (NM)' },
    { value: 'lightly_played', label: 'Lightly Played (LP)' },
    { value: 'moderately_played', label: 'Moderately Played (MP)' },
    { value: 'heavily_played', label: 'Heavily Played (HP)' },
    { value: 'damaged', label: 'Damaged (D)' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...entry,
      ...formData
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePrintingDetailsChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      printing_details: {
        ...prev.printing_details,
        [field]: value
      }
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-2 border-t bg-muted/20 p-3 rounded">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="quantity" className="text-xs">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) => handleInputChange('quantity', parseInt(e.target.value))}
            className="h-8"
          />
        </div>
        
        <div>
          <Label htmlFor="condition" className="text-xs">Condition</Label>
          <select
            id="condition"
            value={formData.condition}
            onChange={(e) => handleInputChange('condition', e.target.value)}
            className="w-full h-8 px-2 border rounded text-sm bg-background"
          >
            {conditions.map(cond => (
              <option key={cond.value} value={cond.value}>
                {cond.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="set_code" className="text-xs">Set Code</Label>
          <Input
            id="set_code"
            value={formData.printing_details.set_code}
            onChange={(e) => handlePrintingDetailsChange('set_code', e.target.value)}
            placeholder="e.g., MH3"
            className="h-8"
          />
        </div>
        
        <div>
          <Label htmlFor="set_name" className="text-xs">Set Name</Label>
          <Input
            id="set_name"
            value={formData.printing_details.set_name}
            onChange={(e) => handlePrintingDetailsChange('set_name', e.target.value)}
            placeholder="e.g., Modern Horizons 3"
            className="h-8"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="collector_number" className="text-xs">Collector Number</Label>
        <Input
          id="collector_number"
          value={formData.printing_details.collector_number}
          onChange={(e) => handlePrintingDetailsChange('collector_number', e.target.value)}
          placeholder="e.g., 123"
          className="h-8"
        />
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={formData.is_foil}
            onChange={(e) => handleInputChange('is_foil', e.target.checked)}
            className="rounded"
          />
          Foil
        </label>
        
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={formData.printing_details.is_promo}
            onChange={(e) => handlePrintingDetailsChange('is_promo', e.target.checked)}
            className="rounded"
          />
          Promo
        </label>
        
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={formData.printing_details.is_alternate_art}
            onChange={(e) => handlePrintingDetailsChange('is_alternate_art', e.target.checked)}
            className="rounded"
          />
          Alt Art
        </label>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" size="sm" className="h-7">
          <Save className="w-3 h-3 mr-1" />
          Save
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel} className="h-7">
          <X className="w-3 h-3 mr-1" />
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default PrintingEditForm;