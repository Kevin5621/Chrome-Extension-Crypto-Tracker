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