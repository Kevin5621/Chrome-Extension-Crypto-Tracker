/**
 * Formats a price for display based on its magnitude
 * @param price The price to format
 * @returns Formatted price string
 */
export function formatPrice(price: string): string {
  const num = parseFloat(price);
  if (num > 1000) return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (num > 1) return num.toFixed(2);
  if (num > 0.001) return num.toFixed(4);
  return num.toFixed(6);
}

/**
 * Gets a trend indicator based on price comparison
 * @param current Current price
 * @param previous Previous price
 * @returns HTML string with trend indicator
 */
export function getTrend(current: string, previous: string | null): string {
  if (!previous) return '';
  
  const currentPrice = parseFloat(current);
  const previousPrice = parseFloat(previous);
  
  if (currentPrice > previousPrice) {
    return `<span class="price-trend price-up">▲</span>`;
  } else if (currentPrice < previousPrice) {
    return `<span class="price-trend price-down">▼</span>`;
  }
  return '';
}