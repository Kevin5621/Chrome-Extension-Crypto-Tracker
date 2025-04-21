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
        
        // Handle old format (with items array)
        if (parsedPortfolio && Array.isArray(parsedPortfolio.items) && !parsedPortfolio.wallets) {
          // Convert to new format
          const migratedPortfolio: Portfolio = {
            wallets: [{ id: 'default', name: 'Default Wallet', items: parsedPortfolio.items }],
            lastUpdated: parsedPortfolio.lastUpdated || Date.now()
          };
          resolve(migratedPortfolio);
          return;
        }
        
        // Handle new format (with wallets array)
        if (parsedPortfolio && Array.isArray(parsedPortfolio.wallets)) {
          resolve(parsedPortfolio);
          return;
        } else {
          console.error('Loaded portfolio data is invalid:', parsedPortfolio);
        }
      }
      
      // Default empty portfolio with new structure
      resolve({ 
        wallets: [{ id: 'default', name: 'Default Wallet', items: [] }],
        lastUpdated: Date.now() 
      });
    } catch (error) {
      console.error('Error loading portfolio:', error);
      // Default empty portfolio with new structure
      resolve({ 
        wallets: [{ id: 'default', name: 'Default Wallet', items: [] }],
        lastUpdated: Date.now() 
      });
    }
  });
}