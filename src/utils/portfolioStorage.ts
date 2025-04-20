import { Portfolio } from '../types';

const PORTFOLIO_STORAGE_KEY = 'cryptoTracker_portfolio';

export function savePortfolio(portfolio: Portfolio): Promise<void> {
  return new Promise((resolve) => {
    try {
      const dataToStore = JSON.stringify(portfolio);
      localStorage.setItem(PORTFOLIO_STORAGE_KEY, dataToStore);
      
      const verification = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
      if (!verification) {
        console.error('Storage verification failed: Portfolio data not saved');
      }
      
      resolve();
    } catch (error) {
      console.error('Error saving portfolio:', error);
      resolve();
    }
  });
}

export function loadPortfolio(): Promise<Portfolio> {
  return new Promise((resolve) => {
    try {
      const savedPortfolio = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
      if (savedPortfolio) {
        const parsedPortfolio = JSON.parse(savedPortfolio);
        if (parsedPortfolio && Array.isArray(parsedPortfolio.items)) {
          resolve(parsedPortfolio);
          return;
        } else {
          console.error('Loaded portfolio data is invalid:', parsedPortfolio);
        }
      }
      // Default empty portfolio
      resolve({ items: [], lastUpdated: Date.now() });
    } catch (error) {
      console.error('Error loading portfolio:', error);
      resolve({ items: [], lastUpdated: Date.now() });
    }
  });
}