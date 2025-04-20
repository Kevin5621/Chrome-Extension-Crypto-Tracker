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