import { CryptoData } from '../types';

const STORAGE_KEY = 'cryptoTracker_cryptoList';

export function saveCryptoList(cryptoList: CryptoData[]): Promise<void> {
  return new Promise((resolve) => {
    try {
      // Stringify with better error handling
      const dataToStore = JSON.stringify(cryptoList);
      localStorage.setItem(STORAGE_KEY, dataToStore);
      
      // Verify data was actually stored
      const verification = localStorage.getItem(STORAGE_KEY);
      if (!verification) {
        console.error('Storage verification failed: Data not saved');
      }
      
      resolve();
    } catch (error) {
      console.error('Error saving crypto list:', error);
      resolve();
    }
  });
}

export function loadCryptoList(): Promise<CryptoData[]> {
  return new Promise((resolve) => {
    try {
      const savedList = localStorage.getItem(STORAGE_KEY);
      if (savedList) {
        const parsedList = JSON.parse(savedList);
        // Validate that we got an array
        if (Array.isArray(parsedList)) {
          resolve(parsedList);
          return;
        } else {
          console.error('Loaded data is not an array:', parsedList);
        }
      }
      resolve([]);
    } catch (error) {
      console.error('Error loading crypto list:', error);
      resolve([]); // Default to empty array on error
    }
  });
}