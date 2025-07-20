// src/components/collection/filters/CMCRangeSlider.jsx
import { useState, useCallback, useEffect } from 'react';
import { Label } from '@/components/ui/label';

const CMCRangeSlider = ({ 
  value = [0, 15], 
  onChange, 
  min = 0, 
  max = 15,
  className = "" 
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);

  // Simple debounce utility
  

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced onChange to avoid too many API calls
  const debouncedOnChange = useCallback(
    (newValue) => {
      onChange?.(newValue);
    },
    [onChange]
  );

  const handleSliderChange = (newValue) => {
    setLocalValue(newValue);
    if (!isDragging) {
      debouncedOnChange(newValue);
    }
  };

  const percentToValue = (percent) => {
    return Math.round(min + (percent / 100) * (max - min));
  };

  const valueToPercent = (val) => {
    return ((val - min) / (max - min)) * 100;
  };

  const leftPercent = valueToPercent(localValue[0]);
  const rightPercent = valueToPercent(localValue[1]);

  const handleTrackClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    const clickValue = percentToValue(percent);
    
    // Determine which handle is closer
    const leftDistance = Math.abs(clickValue - localValue[0]);
    const rightDistance = Math.abs(clickValue - localValue[1]);
    
    if (leftDistance < rightDistance) {
      const newValue = [Math.min(clickValue, localValue[1]), localValue[1]];
      handleSliderChange(newValue);
    } else {
      const newValue = [localValue[0], Math.max(clickValue, localValue[0])];
      handleSliderChange(newValue);
    }
  };

  return (
    <div className={`cmc-range-slider ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <Label className="text-sm font-medium">Mana Cost (CMC)</Label>
        <div className="text-sm text-muted-foreground">
          {localValue[0]} - {localValue[1] >= max ? `${max}+` : localValue[1]}
        </div>
      </div>
      
      {/* Slider Track */}
      <div className="relative h-6 mb-4">
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-full h-2 bg-gray-200 rounded cursor-pointer"
          onClick={handleTrackClick}
        >
          {/* Active Range */}
          <div 
            className="absolute h-full bg-blue-500 rounded"
            style={{
              left: `${leftPercent}%`,
              width: `${rightPercent - leftPercent}%`
            }}
          />
          
          {/* Left Handle */}
          <div
            className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-grab active:cursor-grabbing shadow-sm hover:scale-110 transition-transform"
            style={{ 
              left: `${leftPercent}%`,
              top: '50%',
              transform: 'translateX(-50%) translateY(-50%)'
            }}
            onMouseDown={(e) => {
              setIsDragging(true);
              const startX = e.clientX;
              const startValue = localValue[0];
              
              const handleMouseMove = (e) => {
                const rect = e.currentTarget.closest('.cmc-range-slider').querySelector('.bg-gray-200').getBoundingClientRect();
                const deltaX = e.clientX - startX;
                const deltaPercent = (deltaX / rect.width) * 100;
                const newValue = Math.max(min, Math.min(percentToValue(valueToPercent(startValue) + deltaPercent), localValue[1]));
                
                setLocalValue([newValue, localValue[1]]);
              };
              
              const handleMouseUp = () => {
                setIsDragging(false);
                debouncedOnChange(localValue);
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };
              
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          />
          
          {/* Right Handle */}
          <div
            className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-grab active:cursor-grabbing shadow-sm hover:scale-110 transition-transform"
            style={{ 
              left: `${rightPercent}%`,
              top: '50%',
              transform: 'translateX(-50%) translateY(-50%)'
            }}
            onMouseDown={(e) => {
              setIsDragging(true);
              const startX = e.clientX;
              const startValue = localValue[1];
              
              const handleMouseMove = (e) => {
                const rect = e.currentTarget.closest('.cmc-range-slider').querySelector('.bg-gray-200').getBoundingClientRect();
                const deltaX = e.clientX - startX;
                const deltaPercent = (deltaX / rect.width) * 100;
                const newValue = Math.max(localValue[0], Math.min(percentToValue(valueToPercent(startValue) + deltaPercent), max));
                
                setLocalValue([localValue[0], newValue]);
              };
              
              const handleMouseUp = () => {
                setIsDragging(false);
                debouncedOnChange(localValue);
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };
              
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          />
        </div>
        
        {/* CMC Markers */}
        <div className="absolute top-full mt-1 w-full flex justify-between text-xs text-muted-foreground">
          {Array.from({ length: Math.min(max + 1, 16) }, (_, i) => (
            <span key={i} className="text-center" style={{ width: '6.25%' }}>
              {i === max && i >= 15 ? '15+' : i}
            </span>
          ))}
        </div>
      </div>
      
      {/* Quick Preset Buttons */}
      <div className="flex flex-wrap gap-1">
        {[
          { label: 'All', range: [0, 15] },
          { label: 'Low (0-3)', range: [0, 3] },
          { label: 'Mid (4-6)', range: [4, 6] },
          { label: 'High (7+)', range: [7, 15] }
        ].map(preset => (
          <button
            key={preset.label}
            onClick={() => handleSliderChange(preset.range)}
            className={`px-2 py-1 text-xs rounded border transition-colors ${
              localValue[0] === preset.range[0] && localValue[1] === preset.range[1]
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
};



export default CMCRangeSlider;
