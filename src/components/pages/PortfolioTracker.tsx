import React, { useState, useEffect } from 'react';
import { PortfolioItem, Portfolio, CryptoData } from '../../types';
import { getCryptoPrice } from '../../utils/api';
import { loadPortfolio, savePortfolio } from '../../utils/portfolioStorage';
import CryptoAutocomplete from '../features/CryptoAutocomplete';

// SVG icons
const portfolioIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`;
const removeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
const emptyIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M21 9V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3"/><path d="M9 15H5a2 2 0 0 0-2 2v4"/><path d="M19 9H9.5a2 2 0 0 0-2 2v4"/><circle cx="9" cy="9" r="2"/><circle cx="19" cy="16" r="2"/></svg>`;

interface PortfolioTrackerProps {
  cryptoList: CryptoData[];
}

const PortfolioTracker: React.FC<PortfolioTrackerProps> = ({ }) => {
  const [portfolio, setPortfolio] = useState<Portfolio>({ items: [], lastUpdated: Date.now() });
  const [symbol, setSymbol] = useState('');
  const [amount, setAmount] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [currentPrices, setCurrentPrices] = useState<Record<string, string>>({});

  // Load portfolio on component mount
  useEffect(() => {
    let isMounted = true;
    
    const fetchPortfolio = async () => {
      try {
        const data = await loadPortfolio();
        if (isMounted) {
          setPortfolio(data);
          updateCurrentPrices(data.items);
        }
      } catch (error) {
        console.error('Error fetching portfolio:', error);
      }
    };
    
    fetchPortfolio();
    
    // Set up interval for price updates
    const intervalId = setInterval(() => {
      if (isMounted && portfolio.items.length > 0) {
        updateCurrentPrices(portfolio.items);
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

  // Add new portfolio item
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
    
    // Check if already in portfolio
    if (portfolio.items.some(item => item.symbol === trimmedSymbol)) {
      alert(`${trimmedSymbol} is already in your portfolio.`);
      return;
    }
    
    const newItem: PortfolioItem = {
      symbol: trimmedSymbol,
      amount: parsedAmount,
      purchasePrice: parsedPrice,
      purchaseDate: Date.now()
    };
    
    const updatedPortfolio = {
      items: [...portfolio.items, newItem],
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

  // Remove portfolio item
  const removePortfolioItem = async (symbol: string) => {
    const updatedItems = portfolio.items.filter(item => item.symbol !== symbol);
    const updatedPortfolio = {
      items: updatedItems,
      lastUpdated: Date.now()
    };
    
    setPortfolio(updatedPortfolio);
    await savePortfolio(updatedPortfolio);
  };

  // Calculate portfolio metrics
  const calculateMetrics = () => {
    let totalInvestment = 0;
    let totalCurrentValue = 0;
    
    portfolio.items.forEach(item => {
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

  // Render portfolio items
  const renderPortfolio = () => {
    if (portfolio.items.length === 0) {
      return (
        <div className="empty-state" dangerouslySetInnerHTML={{ __html: `
          ${emptyIcon}
          <p>No assets in your portfolio yet.</p>
          <p>Add your first one below!</p>
        `}} />
      );
    }

    const metrics = calculateMetrics();
    
    return (
      <>
        <div className="portfolio-summary">
          <div className="summary-item">
            <span className="summary-label">Total Investment</span>
            <span className="summary-value">${metrics.totalInvestment.toFixed(2)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Current Value</span>
            <span className="summary-value">${metrics.totalCurrentValue.toFixed(2)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Profit/Loss</span>
            <span className={`summary-value ${metrics.profitLoss >= 0 ? 'profit' : 'loss'}`}>
              ${metrics.profitLoss.toFixed(2)} ({metrics.profitLossPercentage.toFixed(2)}%)
            </span>
          </div>
        </div>
        
        <div className="portfolio-items">
          {portfolio.items.map((item) => {
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
        <button onClick={addPortfolioItem}>Add to Portfolio</button>
      </div>
    </div>
  );
};

export default PortfolioTracker;