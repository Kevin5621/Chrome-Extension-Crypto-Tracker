import { CryptoPrice } from '../types';

/**
 * Fetches the current price of a cryptocurrency from Binance API
 * @param symbol The cryptocurrency symbol (e.g., BTC)
 * @returns The price as a string, or null if there was an error
 */
export async function getCryptoPrice(symbol: string): Promise<string | null> {
  try {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`);
    if (!response.ok) {
      throw new Error('Invalid symbol');
    }
    const data: CryptoPrice = await response.json();
    return data.price;
  } catch (error) {
    return null;
  }
}