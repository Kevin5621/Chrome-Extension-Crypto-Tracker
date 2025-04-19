import { CryptoData } from '../types';

/**
 * Saves the crypto list to Chrome storage
 * @param cryptoList The list of cryptocurrencies to save
 */
export function saveCryptoList(cryptoList: CryptoData[]): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ cryptoList: JSON.stringify(cryptoList) }, () => {
      resolve();
    });
  });
}

/**
 * Loads the crypto list from Chrome storage
 * @returns A promise that resolves to the loaded crypto list
 */
export function loadCryptoList(): Promise<CryptoData[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get('cryptoList', (result) => {
      if (result.cryptoList) {
        try {
          const parsedList = JSON.parse(result.cryptoList);
          resolve(parsedList);
        } catch (e) {
          console.error('Failed to parse saved crypto list');
          resolve([]);
        }
      } else {
        resolve([]);
      }
    });
  });
}