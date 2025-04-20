import { CoinData, UserSearchHistory } from '../types';

const COINS_STORAGE_KEY = 'cryptoTracker_coinList';
const USER_HISTORY_KEY = 'cryptoTracker_searchHistory';

// Store the complete coin list
export function saveCoinList(coinList: CoinData[]): Promise<void> {
  return new Promise((resolve) => {
    try {
      const dataToStore = JSON.stringify(coinList);
      localStorage.setItem(COINS_STORAGE_KEY, dataToStore);
      
      const verification = localStorage.getItem(COINS_STORAGE_KEY);
      if (!verification) {
        console.error('Storage verification failed: Coin list not saved');
      }
      
      resolve();
    } catch (error) {
      console.error('Error saving coin list:', error);
      resolve();
    }
  });
}

// Load the complete coin list
export function loadCoinList(): Promise<CoinData[]> {
  return new Promise((resolve) => {
    try {
      const savedList = localStorage.getItem(COINS_STORAGE_KEY);
      if (savedList) {
        const parsedList = JSON.parse(savedList);
        if (Array.isArray(parsedList)) {
          resolve(parsedList);
          return;
        } else {
          console.error('Loaded coin data is not an array:', parsedList);
        }
      }
      resolve([]);
    } catch (error) {
      console.error('Error loading coin list:', error);
      resolve([]);
    }
  });
}

// Save user search history
export function saveSearchHistory(history: UserSearchHistory): Promise<void> {
  return new Promise((resolve) => {
    try {
      const dataToStore = JSON.stringify(history);
      localStorage.setItem(USER_HISTORY_KEY, dataToStore);
      resolve();
    } catch (error) {
      console.error('Error saving search history:', error);
      resolve();
    }
  });
}

// Load user search history
export function loadSearchHistory(): Promise<UserSearchHistory> {
  return new Promise((resolve) => {
    try {
      const savedHistory = localStorage.getItem(USER_HISTORY_KEY);
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        resolve(parsedHistory);
        return;
      }
      resolve({});
    } catch (error) {
      console.error('Error loading search history:', error);
      resolve({});
    }
  });
}

// Update search history when user selects a coin
export async function updateSearchHistory(symbol: string): Promise<void> {
  try {
    const history = await loadSearchHistory();
    history[symbol] = {
      count: (history[symbol]?.count || 0) + 1,
      lastSearched: Date.now()
    };
    
    // Limit history size (keep only the most recent 50 searches)
    const entries = Object.entries(history);
    if (entries.length > 50) {
      const sortedEntries = entries.sort((a, b) => 
        b[1].lastSearched - a[1].lastSearched
      ).slice(0, 50);
      
      const trimmedHistory: UserSearchHistory = {};
      sortedEntries.forEach(([key, value]) => {
        trimmedHistory[key] = value;
      });
      
      await saveSearchHistory(trimmedHistory);
    } else {
      await saveSearchHistory(history);
    }
  } catch (error) {
    console.error('Error updating search history:', error);
  }
}