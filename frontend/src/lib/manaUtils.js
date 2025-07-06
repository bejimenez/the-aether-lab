// frontend/src/utils/manaUtils.js

/**
 * Utility functions for handling mana symbols and costs
 */

// Standard mana symbols that should have images available
const STANDARD_SYMBOLS = new Set([
  'W', 'U', 'B', 'R', 'G', 'C', 'X', 'Y', 'Z', 'S', 'T', 'Q', 'E',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
  '100', '1000000'
]);

// Hybrid and special symbols
const HYBRID_SYMBOLS = new Set([
  'W/U', 'W/B', 'U/B', 'U/R', 'B/R', 'B/G', 'R/G', 'R/W', 'G/W', 'G/U',
  '2/W', '2/U', '2/B', '2/R', '2/G',
  'W/P', 'U/P', 'B/P', 'R/P', 'G/P'
]);

/**
 * Check if a symbol should have an image available
 */
export const hasSymbolImage = (symbol) => {
  return STANDARD_SYMBOLS.has(symbol) || HYBRID_SYMBOLS.has(symbol);
};

/**
 * Parse mana cost string into individual symbols
 */
export const parseManaCost = (manaCost) => {
  if (!manaCost || typeof manaCost !== 'string') return [];
  
  // Match all symbols in curly braces, including complex ones like {2/W}
  const matches = manaCost.match(/\{[^}]+\}/g);
  if (!matches) return [];
  
  return matches.map(match => match.replace(/[{}]/g, ''));
};

/**
 * Calculate total converted mana cost from mana cost string
 */
export const calculateCMC = (manaCost) => {
  const symbols = parseManaCost(manaCost);
  let cmc = 0;
  
  symbols.forEach(symbol => {
    // Handle numeric symbols
    if (/^\d+$/.test(symbol)) {
      cmc += parseInt(symbol, 10);
    }
    // Handle hybrid symbols like "2/W" - use the higher cost
    else if (symbol.includes('/')) {
      const parts = symbol.split('/');
      const numericPart = parts.find(part => /^\d+$/.test(part));
      if (numericPart) {
        cmc += parseInt(numericPart, 10);
      } else {
        cmc += 1; // Colored hybrid symbols add 1
      }
    }
    // Handle X, Y, Z as 0 for CMC calculation
    else if (['X', 'Y', 'Z'].includes(symbol)) {
      cmc += 0;
    }
    // Handle regular colored symbols
    else if (['W', 'U', 'B', 'R', 'G', 'C'].includes(symbol)) {
      cmc += 1;
    }
  });
  
  return cmc;
};

/**
 * Get Scryfall symbol URL
 */
export const getSymbolUrl = (symbol) => {
  return `https://svgs.scryfall.io/card-symbols/${symbol}.svg`;
};

/**
 * Extract colors from mana cost
 */
export const getColorsFromManaCost = (manaCost) => {
  const symbols = parseManaCost(manaCost);
  const colors = new Set();
  
  symbols.forEach(symbol => {
    if (symbol.includes('W')) colors.add('W');
    if (symbol.includes('U')) colors.add('U');
    if (symbol.includes('B')) colors.add('B');
    if (symbol.includes('R')) colors.add('R');
    if (symbol.includes('G')) colors.add('G');
  });
  
  return Array.from(colors);
};