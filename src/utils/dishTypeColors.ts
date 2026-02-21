/**
 * Maps CyberChef Dish type names to colours used for node handles.
 * Handles whose data type matches get a coloured border/fill so
 * users can visually confirm compatible connections.
 */
export const dishTypeColors: Record<string, string> = {
  string: '#4a9eff',
  byteArray: '#4caf50',
  ArrayBuffer: '#ff9800',
  html: '#9c27b0',
  number: '#ffeb3b',
  JSON: '#00bcd4',
  BigNumber: '#ff5722',
  File: '#795548',
  'List<File>': '#607d8b',
};

/**
 * Return the colour for a given Dish type, falling back to a neutral
 * grey for any type not in the map.
 */
export const getDishTypeColor = (type: string): string =>
  dishTypeColors[type] || '#999';
