import { CoinData, UserSearchHistory, SearchResult } from '../types';
import Fuse from 'fuse.js';

let searchEngine: Fuse<CoinData> | null = null;

export function initializeSearchEngine(coinList: CoinData[]): void {
  const options = {
    keys: ['symbol', 'baseAsset'],
    threshold: 0.3,
    distance: 100,
    includeScore: true
  };
  
  searchEngine = new Fuse(coinList, options);
}

export async function searchCoins(
  query: string, 
  coinList: CoinData[], 
  userHistory: UserSearchHistory
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  
  // If there's no query, return popular coins
  if (!query) {
    // add from history (5 terakhir)
    const historyItems = Object.entries(userHistory)
      .sort((a, b) => b[1].lastSearched - a[1].lastSearched)
      .slice(0, 5)
      .map(([symbol]) => {
        const coin = coinList.find(c => c.symbol === symbol);
        if (!coin) return null;
        
        return {
          symbol,
          score: 0,
          matchType: 'history' as const
        };
      })
      .filter(Boolean) as SearchResult[];
    
    results.push(...historyItems);
    
    // add popular coins (5 teratas)
    const trendingItems = coinList
      .filter(coin => coin.isTrending)
      .sort((a, b) => Math.abs(b.priceChangePercent) - Math.abs(a.priceChangePercent))
      .slice(0, 5)
      .map(coin => ({
        symbol: coin.symbol,
        score: 0,
        matchType: 'trending' as const
      }));
    
    results.push(...trendingItems);
    
    // add popular coins (based on volume)
    const popularItems = coinList
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5)
      .map(coin => ({
        symbol: coin.symbol,
        score: 0,
        matchType: 'popular' as const
      }));
    
    results.push(...popularItems);
    
    // Hapus duplikat
    const uniqueResults = Array.from(
      new Map(results.map(item => [item.symbol, item])).values()
    );
    
    return uniqueResults;
  }
  
  // If there's no search engine, initialize it
  if (!searchEngine) {
    initializeSearchEngine(coinList);
  }
  
  const normalizedQuery = query.trim().toUpperCase();
  
  // Exact match
  const exactMatch = coinList.find(
    coin => coin.symbol === normalizedQuery
  );
  
  if (exactMatch) {
    results.push({
      symbol: exactMatch.symbol,
      score: 0,
      matchType: 'exact'
    });
  }
  
  // Prefix match
  const prefixMatches = coinList
    .filter(coin => 
      coin.symbol.startsWith(normalizedQuery) && 
      coin.symbol !== normalizedQuery
    )
    .slice(0, 5)
    .map(coin => ({
      symbol: coin.symbol,
      score: 0.1,
      matchType: 'prefix' as const
    }));
  
  results.push(...prefixMatches);
  
  // Fuzzy search
  if (searchEngine) {
    const fuzzyResults = searchEngine
      .search(normalizedQuery)
      .slice(0, 10)
      .map(result => ({
        symbol: result.item.symbol,
        score: result.score || 0.5,
        matchType: 'fuzzy' as const
      }));
    
    // Filter out exact and prefix matches that are already in results
    const existingSymbols = new Set(results.map(r => r.symbol));
    const uniqueFuzzyResults = fuzzyResults.filter(
      r => !existingSymbols.has(r.symbol)
    );
    
    results.push(...uniqueFuzzyResults);
  }
  
  // Sort by match type and score
  return results.sort((a, b) => {
    // Prioritaskan berdasarkan jenis match
    const typeOrder = {
      exact: 0,
      prefix: 1,
      fuzzy: 2,
      history: 3,
      trending: 4,
      popular: 5
    };
    
    const typeA = typeOrder[a.matchType as keyof typeof typeOrder];
    const typeB = typeOrder[b.matchType as keyof typeof typeOrder];
    
    if (typeA !== typeB) {
      return typeA - typeB;
    }
    
    // If they have the same match type, prioritize based on score
    return a.score - b.score;
  });
}