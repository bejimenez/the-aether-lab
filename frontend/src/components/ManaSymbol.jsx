// frontend/src/components/ManaSymbol.jsx
import React, { useState } from 'react';
import { getSymbolUrl, hasSymbolImage } from '../lib/manaUtils';

const ManaSymbol = ({ symbol, size = 'sm', className = '', showFallback = true }) => {
  const [imageError, setImageError] = useState(false);
  
  // Size mapping
  const sizeClasses = {
    xs: 'w-3 h-3 text-xs',
    sm: 'w-4 h-4 text-sm', 
    md: 'w-5 h-5 text-base',
    lg: 'w-6 h-6 text-lg',
    xl: 'w-8 h-8 text-xl'
  };

  // Clean symbol (remove braces if present)
  const cleanSymbol = symbol.replace(/[{}]/g, '');
  
  // Check if we should even try to load an image
  const shouldUseImage = hasSymbolImage(cleanSymbol) && !imageError;
  
  // If image failed or not available, show styled text fallback
  if (!shouldUseImage && showFallback) {
    return (
      <span 
        className={`inline-flex items-center justify-center ${sizeClasses[size]} 
                   bg-gray-100 border border-gray-300 rounded-full font-mono font-bold
                   ${className}`}
        title={`{${cleanSymbol}}`}
        style={{ 
          minWidth: sizeClasses[size].split(' ')[0],
          verticalAlign: 'middle',
          color: getSymbolColor(cleanSymbol)
        }}
      >
        {cleanSymbol}
      </span>
    );
  }
  
  if (!shouldUseImage) return null;
  
  return (
    <img
      src={getSymbolUrl(cleanSymbol)}
      alt={`{${cleanSymbol}}`}
      className={`inline-block ${sizeClasses[size]} ${className}`}
      style={{ verticalAlign: 'middle' }}
      onError={() => setImageError(true)}
      title={`{${cleanSymbol}}`}
    />
  );
};

// Helper function to get color for text fallback
const getSymbolColor = (symbol) => {
  const colorMap = {
    'W': '#FFFBD5',
    'U': '#0E68AB', 
    'B': '#150B00',
    'R': '#D3202A',
    'G': '#00733E',
    'C': '#999999'
  };
  
  // For hybrid symbols, use the first color
  if (symbol.includes('/')) {
    const firstColor = symbol.split('/')[0];
    return colorMap[firstColor] || '#666666';
  }
  
  return colorMap[symbol] || '#666666';
};

export default ManaSymbol;