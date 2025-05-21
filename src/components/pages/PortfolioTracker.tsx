import React, { useState, useEffect } from 'react';
import { PortfolioItem, Portfolio, CryptoData, Wallet } from '../../types';
import { getCryptoPrice } from '../../utils/api';
import { loadPortfolio, savePortfolio } from '../../utils/portfolioStorage';
import CryptoAutocomplete from '../features/CryptoAutocomplete';

// SVG icons
const portfolioIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`;
const removeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
const emptyIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M21 9V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3"/><path d="M9 15H5a2 2 0 0 0-2 2v4"/><path d="M19 9H9.5a2 2 0 0 0-2 2v4"/><circle cx="9" cy="9" r="2"/><circle cx="19" cy="16" r="2"/></svg>`;
const walletIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>`;
const addIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>`;

interface PortfolioTrackerProps {
  cryptoList: CryptoData[];
}

const PortfolioTracker: React.FC<PortfolioTrackerProps> = ({ }) => {
  const [portfolio, setPortfolio] = useState<Portfolio>({ 
    wallets: [{ id: 'default', name: 'Default Wallet', items: [] }],
    lastUpdated: Date.now() 
  });
  const [activeWalletId, setActiveWalletId] = useState<string>('default');
  const [symbol, setSymbol] = useState('');
  const [amount, setAmount] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [currentPrices, setCurrentPrices] = useState<Record<string, string>>({});
  const [newWalletName, setNewWalletName] = useState('');
  const [isAddingWallet, setIsAddingWallet] = useState(false);

  // Get active wallet
  const activeWallet = portfolio.wallets.find(w => w.id === activeWalletId) || portfolio.wallets[0];

  // Load portfolio on component mount
  useEffect(() => {
    let isMounted = true;
    
    const fetchPortfolio = async () => {
      try {
        const data = await loadPortfolio();
        
        // Handle migration from old format to new format with wallets
        let migratedData = data;
        if (!data.wallets && Array.isArray(data.items)) {
          migratedData = {
            wallets: [{ id: 'default', name: 'Default Wallet', items: data.items }],
            lastUpdated: data.lastUpdated
          };
          await savePortfolio(migratedData);
        }
        
        if (isMounted) {
          setPortfolio(migratedData);
          
          // Get all items from all wallets for price updates
          const allItems: PortfolioItem[] = [];
          migratedData.wallets.forEach(wallet => {
            allItems.push(...wallet.items);
          });
          
          updateCurrentPrices(allItems);
        }
      } catch (error) {
        console.error('Error fetching portfolio:', error);
      }
    };
    
    fetchPortfolio();
    
    // Set up interval for price updates
    const intervalId = setInterval(() => {
      if (isMounted) {
        const allItems: PortfolioItem[] = [];
        portfolio.wallets.forEach(wallet => {
          allItems.push(...wallet.items);
        });
        
        if (allItems.length > 0) {
          updateCurrentPrices(allItems);
        }
      }
    }, 30000);
    
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  // Update current prices for all portfolio items
  const updateCurrentPrices = async (items: PortfolioItem[]) => {
    if (!items || items.length === 0) return;
    
    try {
      const priceMap: Record<string, string> = {};
      
      await Promise.all(
        items.map(async (item) => {
          try {
            const price = await getCryptoPrice(item.symbol);
            if (price) {
              priceMap[item.symbol] = price;
            }
          } catch {
            // Silently fail for individual items
          }
        })
      );
      
      setCurrentPrices(priceMap);
    } catch (error) {
      console.error('Error updating portfolio prices:', error);
    }
  };

  // Add new portfolio item to active wallet
  const addPortfolioItem = async () => {
    const trimmedSymbol = symbol.trim().toUpperCase();
    const parsedAmount = parseFloat(amount);
    const parsedPrice = parseFloat(purchasePrice);
    
    if (!trimmedSymbol || isNaN(parsedAmount) || isNaN(parsedPrice)) {
      alert('Please fill in all fields with valid values');
      return;
    }
    
    // Check if symbol exists
    const price = await getCryptoPrice(trimmedSymbol);
    if (!price) {
      alert(`Could not find price for ${trimmedSymbol}. Please check the symbol and try again.`);
      return;
    }
    
    // Check if already in active wallet
    if (activeWallet.items.some(item => item.symbol === trimmedSymbol)) {
      alert(`${trimmedSymbol} is already in your ${activeWallet.name}.`);
      return;
    }
    
    const newItem: PortfolioItem = {
      symbol: trimmedSymbol,
      amount: parsedAmount,
      purchasePrice: parsedPrice,
      purchaseDate: Date.now()
    };
    
    // Update the active wallet with the new item
    const updatedWallets = portfolio.wallets.map(wallet => {
      if (wallet.id === activeWalletId) {
        return {
          ...wallet,
          items: [...wallet.items, newItem]
        };
      }
      return wallet;
    });
    
    const updatedPortfolio = {
      wallets: updatedWallets,
      lastUpdated: Date.now()
    };
    
    setPortfolio(updatedPortfolio);
    await savePortfolio(updatedPortfolio);
    
    // Update current price for the new item
    updateCurrentPrices([newItem]);
    
    // Reset form
    setSymbol('');
    setAmount('');
    setPurchasePrice('');
  };

  // Remove portfolio item from active wallet
  const removePortfolioItem = async (symbol: string) => {
    const updatedWallets = portfolio.wallets.map(wallet => {
      if (wallet.id === activeWalletId) {
        return {
          ...wallet,
          items: wallet.items.filter(item => item.symbol !== symbol)
        };
      }
      return wallet;
    });
    
    const updatedPortfolio = {
      wallets: updatedWallets,
      lastUpdated: Date.now()
    };
    
    setPortfolio(updatedPortfolio);
    await savePortfolio(updatedPortfolio);
  };

  // Add new wallet
  const addWallet = async () => {
    if (!newWalletName.trim()) {
      alert('Please enter a wallet name');
      return;
    }
    
    const walletId = `wallet_${Date.now()}`;
    const newWallet: Wallet = {
      id: walletId,
      name: newWalletName.trim(),
      items: []
    };
    
    const updatedPortfolio = {
      wallets: [...portfolio.wallets, newWallet],
      lastUpdated: Date.now()
    };
    
    setPortfolio(updatedPortfolio);
    setActiveWalletId(walletId);
    await savePortfolio(updatedPortfolio);
    
    // Reset form
    setNewWalletName('');
    setIsAddingWallet(false);
  };

  // Remove wallet
  const removeWallet = async (walletId: string) => {
    if (portfolio.wallets.length <= 1) {
      alert('You must have at least one wallet');
      return;
    }
    
    if (confirm(`Are you sure you want to delete this wallet and all its assets?`)) {
      const updatedWallets = portfolio.wallets.filter(wallet => wallet.id !== walletId);
      
      const updatedPortfolio = {
        wallets: updatedWallets,
        lastUpdated: Date.now()
      };
      
      setPortfolio(updatedPortfolio);
      
      // If the active wallet was removed, set the first wallet as active
      if (walletId === activeWalletId) {
        setActiveWalletId(updatedWallets[0].id);
      }
      
      await savePortfolio(updatedPortfolio);
    }
  };

  // Calculate portfolio metrics for active wallet
  const calculateMetrics = () => {
    let totalInvestment = 0;
    let totalCurrentValue = 0;
    
    activeWallet.items.forEach(item => {
      const investment = item.amount * item.purchasePrice;
      totalInvestment += investment;
      
      const currentPrice = parseFloat(currentPrices[item.symbol] || '0');
      if (currentPrice > 0) {
        totalCurrentValue += item.amount * currentPrice;
      }
    });
    
    const profitLoss = totalCurrentValue - totalInvestment;
    const profitLossPercentage = totalInvestment > 0 
      ? (profitLoss / totalInvestment) * 100 
      : 0;
    
    return {
      totalInvestment,
      totalCurrentValue,
      profitLoss,
      profitLossPercentage
    };
  };

  // Calculate total portfolio metrics across all wallets
  const calculateTotalMetrics = () => {
    let totalInvestment = 0;
    let totalCurrentValue = 0;
    
    portfolio.wallets.forEach(wallet => {
      wallet.items.forEach(item => {
        const investment = item.amount * item.purchasePrice;
        totalInvestment += investment;
        
        const currentPrice = parseFloat(currentPrices[item.symbol] || '0');
        if (currentPrice > 0) {
          totalCurrentValue += item.amount * currentPrice;
        }
      });
    });
    
    const profitLoss = totalCurrentValue - totalInvestment;
    const profitLossPercentage = totalInvestment > 0 
      ? (profitLoss / totalInvestment) * 100 
      : 0;
    
    return {
      totalInvestment,
      totalCurrentValue,
      profitLoss,
      profitLossPercentage
    };
  };

  // Render wallet selector
  const renderWalletSelector = () => {
    return (
      <div className="wallet-selector">
        <div className="wallet-tabs">
          {portfolio.wallets.map(wallet => (
            <button 
              key={wallet.id}
              className={`wallet-tab ${wallet.id === activeWalletId ? 'active' : ''}`}
              onClick={() => setActiveWalletId(wallet.id)}
            >
              <span dangerouslySetInnerHTML={{ __html: walletIcon }} />
              <span>{wallet.name}</span>
              {portfolio.wallets.length > 1 && (
                <button 
                  className="remove-wallet-btn"
                  title={`Remove ${wallet.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeWallet(wallet.id);
                  }}
                  dangerouslySetInnerHTML={{ __html: removeIcon }}
                />
              )}
            </button>
          ))}
          <button 
            className="add-wallet-btn"
            onClick={() => setIsAddingWallet(true)}
            title="Add new wallet"
          >
            <span dangerouslySetInnerHTML={{ __html: addIcon }} />
          </button>
        </div>
        
        {isAddingWallet && (
          <div className="add-wallet-form">
            <input
              type="text"
              placeholder="Wallet Name"
              value={newWalletName}
              onChange={(e) => setNewWalletName(e.target.value)}
            />
            <button onClick={addWallet}>Add</button>
            <button onClick={() => setIsAddingWallet(false)}>Cancel</button>
          </div>
        )}
      </div>
    );
  };

  // Render portfolio items for active wallet
  const renderPortfolio = () => {
    // Show total portfolio value across all wallets
    const totalMetrics = calculateTotalMetrics();
    
    if (activeWallet.items.length === 0) {
      return (
        <>
          <div className="portfolio-summary-container">
            <div className="portfolio-total-summary">
              <h3>Total Portfolio Value</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">Total Invesment</span>
                  <span className="summary-value">${totalMetrics.totalInvestment.toFixed(2)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Current Vallue</span>
                  <span className="summary-value">${totalMetrics.totalCurrentValue.toFixed(2)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Profit/Loss</span>
                  <span className={`summary-value ${totalMetrics.profitLoss >= 0 ? 'profit' : 'loss'}`}>
                    ${totalMetrics.profitLoss.toFixed(2)} ({totalMetrics.profitLossPercentage.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="empty-state" dangerouslySetInnerHTML={{ __html: `
            ${emptyIcon}
            <p>No assets in ${activeWallet.name} yet.</p>
            <p>Add your first one below!</p>
          `}} />
        </>
      );
    }

    const metrics = calculateMetrics();
    
    return (
      <>
        <div className="portfolio-summary-container">
          <div className="portfolio-total-summary">
            <h3>Total Portofolio Value</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">Total Invesment</span>
                <span className="summary-value">${totalMetrics.totalInvestment.toFixed(2)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Current Value</span>
                <span className="summary-value">${totalMetrics.totalCurrentValue.toFixed(2)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Profit/Loss</span>
                <span className={`summary-value ${totalMetrics.profitLoss >= 0 ? 'profit' : 'loss'}`}>
                  ${totalMetrics.profitLoss.toFixed(2)} ({totalMetrics.profitLossPercentage.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
          
          <div className="portfolio-summary">
            <h3>{activeWallet.name}</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">Investasi</span>
                <span className="summary-value">${metrics.totalInvestment.toFixed(2)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Nilai Saat Ini</span>
                <span className="summary-value">${metrics.totalCurrentValue.toFixed(2)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Profit/Loss</span>
                <span className={`summary-value ${metrics.profitLoss >= 0 ? 'profit' : 'loss'}`}>
                  ${metrics.profitLoss.toFixed(2)} ({metrics.profitLossPercentage.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="portfolio-items">
          {activeWallet.items.map((item) => {
            const currentPrice = parseFloat(currentPrices[item.symbol] || '0');
            const investmentValue = item.amount * item.purchasePrice;
            const currentValue = currentPrice > 0 ? item.amount * currentPrice : 0;
            const itemProfitLoss = currentValue - investmentValue;
            const itemProfitLossPercentage = investmentValue > 0 
              ? (itemProfitLoss / investmentValue) * 100 
              : 0;
            
            return (
              <div key={item.symbol} className="portfolio-item">
                <div className="item-header">
                  <span className="item-symbol">{item.symbol}</span>
                  <button 
                    className="remove-btn" 
                    title={`Remove ${item.symbol}`}
                    onClick={() => removePortfolioItem(item.symbol)}
                    dangerouslySetInnerHTML={{ __html: removeIcon }}
                  />
                </div>
                <div className="item-details">
                  <div className="item-detail">
                    <span className="detail-label">Amount:</span>
                    <span className="detail-value">{item.amount}</span>
                  </div>
                  <div className="item-detail">
                    <span className="detail-label">Purchase Price:</span>
                    <span className="detail-value">${item.purchasePrice.toFixed(2)}</span>
                  </div>
                  <div className="item-detail">
                    <span className="detail-label">Current Price:</span>
                    <span className="detail-value">${currentPrice.toFixed(2)}</span>
                  </div>
                  <div className="item-detail">
                    <span className="detail-label">Profit/Loss:</span>
                    <span className={`detail-value ${itemProfitLoss >= 0 ? 'profit' : 'loss'}`}>
                      ${itemProfitLoss.toFixed(2)} ({itemProfitLossPercentage.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <div className="portfolio-container">
      <div className="app-header">
        <div className="app-icon" dangerouslySetInnerHTML={{ __html: portfolioIcon }} />
        <h2>Portfolio Tracker</h2>
      </div>
      
      {renderWalletSelector()}
      
      <div className="content-area">
        {renderPortfolio()}
      </div>
      
      <div className="add-portfolio-item">
        <div className="form-row">
          <CryptoAutocomplete
            onSelect={(value) => setSymbol(value)}
            placeholder="Enter crypto symbol (e.g. BTC)"
            validateOnSelect={true}
            position="top" 
          />
        </div>
        <div className="form-row">
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <input
            type="number"
            placeholder="Purchase Price ($)"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
          />
        </div>
        <button onClick={addPortfolioItem}>Add to {activeWallet.name}</button>
      </div>
    </div>
  );
};

export default PortfolioTracker;