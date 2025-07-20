import ManaSymbol from './ManaSymbol';

const ManaCost = ({ 
  manaCost, 
  size = 'sm', 
  showText = false, 
  className = '',
  spacing = 'gap-0.5' 
}) => {
  // Parse mana cost string like "{4}{W}{U}{B}" into individual symbols
  const parseManaCost = (costString) => {
    if (!costString) return [];
    
    // Match all symbols in curly braces
    const matches = costString.match(/\{[^}]+\}/g);
    if (!matches) return [];
    
    return matches.map(match => match.replace(/[{}]/g, ''));
  };

  const symbols = parseManaCost(manaCost);
  
  if (symbols.length === 0) {
    return showText && manaCost ? (
      <span className={`font-mono text-sm ${className}`}>
        {manaCost}
      </span>
    ) : null;
  }

  return (
    <div className={`inline-flex items-center ${spacing} ${className}`}>
      {symbols.map((symbol, index) => (
        <ManaSymbol 
          key={`${symbol}-${index}`} 
          symbol={symbol} 
          size={size}
        />
      ))}
      {showText && (
        <span className="ml-2 font-mono text-xs text-muted-foreground">
          {manaCost}
        </span>
      )}
    </div>
  );
};

export default ManaCost;