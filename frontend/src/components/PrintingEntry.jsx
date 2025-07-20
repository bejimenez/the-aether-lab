import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import PrintingEditForm from './PrintingEditForm';

const PrintingEntry = ({ entry, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = (updatedEntry) => {
    onUpdate(updatedEntry);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const getConditionColor = (condition) => {
    switch (condition) {
      case 'mint': return 'bg-green-100 text-green-800';
      case 'near_mint': return 'bg-green-50 text-green-700';
      case 'lightly_played': return 'bg-yellow-50 text-yellow-700';
      case 'moderately_played': return 'bg-orange-50 text-orange-700';
      case 'heavily_played': return 'bg-red-50 text-red-700';
      case 'damaged': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const formatCondition = (condition) => {
    return condition.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={entry.is_foil ? "default" : "outline"}>
            {entry.is_foil ? "✨ Foil" : "Regular"}
          </Badge>
          
          {entry.printing_details?.set_name && (
            <Badge variant="secondary" className="text-sm">
              {entry.printing_details.set_name}
              {entry.printing_details.set_code && (
                <span className="ml-1 text-xs opacity-70">
                  ({entry.printing_details.set_code.toUpperCase()})
                </span>
              )}
            </Badge>
          )}
          
          <Badge 
            variant="outline" 
            className={`text-xs ${getConditionColor(entry.condition)}`}
          >
            {formatCondition(entry.condition)}
          </Badge>

          {entry.printing_details?.is_promo && (
            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
              Promo
            </Badge>
          )}
          
          {entry.printing_details?.is_alternate_art && (
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
              Alt Art
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Qty: {entry.quantity}</span>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="h-7 w-7 p-0"
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onDelete(entry.id)}
            className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      {entry.printing_details?.collector_number && (
        <div className="text-xs text-muted-foreground">
          Collector Number: {entry.printing_details.collector_number}
        </div>
      )}
      
      {isEditing && (
        <PrintingEditForm 
          entry={entry}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default PrintingEntry;