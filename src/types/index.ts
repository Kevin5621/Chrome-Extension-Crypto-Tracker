export interface CryptoPrice {
  symbol: string;
  price: string;
}

export interface CryptoData {
  symbol: string;
  price: string;
  previousPrice: string | null;
  lastUpdated: number;
}

export interface PortfolioItem {
  symbol: string;
  amount: number;
  purchasePrice: number;
  purchaseDate: number;
}

export interface Portfolio {
  items: PortfolioItem[];
  lastUpdated: number;
}

export interface CoinData {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  volume: number;
  price: string;
  priceChangePercent: number;
  isTrending?: boolean;
}

export interface UserHistoryItem {
  count: number;
  lastSearched: number;
}

export interface UserSearchHistory {
  [symbol: string]: UserHistoryItem;
}

export interface SearchResult {
  symbol: string;
  score: number;
  matchType: 'exact' | 'prefix' | 'fuzzy' | 'popular' | 'history' | 'trending';
}