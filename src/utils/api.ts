import { CoinData, CryptoPrice } from '../types';

// Cache untuk validasi simbol
const validSymbolsCache = new Set<string>();
const invalidSymbolsCache = new Set<string>();
const VALIDATION_CACHE_DURATION = 1000 * 60 * 60; // 1 jam
let lastValidationTime = 0;

/**
 * Fetches the current price of a cryptocurrency from Binance API
 * @param symbol The cryptocurrency symbol (e.g., BTC)
 * @returns The price as a string, or null if there was an error
 */
export async function getCryptoPrice(symbol: string): Promise<string | null> {
  try {
    // Cek apakah simbol valid sebelum melakukan request
    if (!(await isValidTradingPair(symbol))) {
      console.log(`Symbol ${symbol} is not a valid trading pair`);
      return null;
    }

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

/**
 * Checks if a trading pair is valid
 * @param symbol The cryptocurrency symbol (e.g., BTC)
 * @returns Boolean indicating if the symbol is valid
 */
export async function isValidTradingPair(symbol: string): Promise<boolean> {
  // Jika simbol sudah ada di cache dan cache masih valid, gunakan cache
  if (validSymbolsCache.has(symbol) && 
      (Date.now() - lastValidationTime) < VALIDATION_CACHE_DURATION) {
    return true;
  }
  
  // Jika simbol sudah diketahui tidak valid
  if (invalidSymbolsCache.has(symbol) &&
      (Date.now() - lastValidationTime) < VALIDATION_CACHE_DURATION) {
    return false;
  }

  try {
    // Coba langsung dengan request ticker price
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`);
    if (response.ok) {
      // Tambahkan ke cache valid
      validSymbolsCache.add(symbol);
      return true;
    }
    
    // Tambahkan ke cache invalid
    invalidSymbolsCache.add(symbol);
    return false;
  } catch (error) {
    // Tambahkan ke cache invalid
    invalidSymbolsCache.add(symbol);
    return false;
  }
}

/**
 * Fetches the list of all available trading pairs from Binance
 * @returns Array of coin data objects
 */
export async function getAllCoinPairs(): Promise<CoinData[]> {
  try {
    // Get exchange info for all symbols
    const exchangeInfoResponse = await fetch('https://api.binance.com/api/v3/exchangeInfo');
    if (!exchangeInfoResponse.ok) {
      throw new Error('Failed to fetch exchange info');
    }
    
    const exchangeInfo = await exchangeInfoResponse.json();
    
    // Get 24hr ticker data for volume information
    const tickerResponse = await fetch('https://api.binance.com/api/v3/ticker/24hr');
    if (!tickerResponse.ok) {
      throw new Error('Failed to fetch ticker data');
    }
    
    const tickerData = await tickerResponse.json();
    
    // Create a map of symbol to volume and price change
    const tickerMap: Record<string, { volume: number, priceChangePercent: number }> = {};
    tickerData.forEach((ticker: any) => {
      tickerMap[ticker.symbol] = {
        volume: parseFloat(ticker.volume),
        priceChangePercent: parseFloat(ticker.priceChangePercent)
      };
    });
    
    // Reset validSymbolsCache
    validSymbolsCache.clear();
    invalidSymbolsCache.clear();
    lastValidationTime = Date.now();
    
    // Process symbols to create our coin data
    const coinList: CoinData[] = exchangeInfo.symbols
      .filter((symbol: any) => 
        symbol.status === 'TRADING' && 
        symbol.quoteAsset === 'USDT' && // Hanya ambil pasangan dengan USDT
        symbol.isSpotTradingAllowed // Pastikan trading diizinkan
      )
      .map((symbol: any) => {
        const ticker = tickerMap[symbol.symbol] || { volume: 0, priceChangePercent: 0 };
        
        // Tambahkan simbol ke cache valid
        validSymbolsCache.add(symbol.baseAsset);
        
        return {
          symbol: symbol.baseAsset, // Hanya simpan base asset (BTC, ETH, dll)
          baseAsset: symbol.baseAsset,
          quoteAsset: symbol.quoteAsset,
          volume: ticker.volume,
          price: '0', // Will be updated when needed
          priceChangePercent: ticker.priceChangePercent,
          // Mark as trending if price change is significant (e.g., > 5%)
          isTrending: Math.abs(ticker.priceChangePercent) > 5
        };
      });
    
    return coinList;
  } catch (error) {
    console.error('Error fetching coin pairs:', error);
    return [];
  }
}

/**
 * Validates multiple symbols at once
 * @param symbols Array of cryptocurrency symbols
 * @returns Object with valid and invalid symbols
 */
export async function validateSymbols(symbols: string[]): Promise<{
  valid: string[],
  invalid: string[]
}> {
  const result = {
    valid: [] as string[],
    invalid: [] as string[]
  };
  
  await Promise.all(
    symbols.map(async (symbol) => {
      const isValid = await isValidTradingPair(symbol);
      if (isValid) {
        result.valid.push(symbol);
      } else {
        result.invalid.push(symbol);
      }
    })
  );
  
  return result;
}