import React, { useState, useEffect } from 'react';
import { CryptoData } from '../types';
import { getCryptoPrice } from '../utils/api';
import { saveCryptoList, loadCryptoList } from '../utils/storage';
import { formatPrice, getTrend } from '../utils/formatters';

// SVG icons
const cryptoIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 6v2m0 8v2"/></svg>`;
const refreshIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>`;
const removeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
const emptyIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M21 9V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3"/><path d="M9 15H5a2 2 0 0 0-2 2v4"/><path d="M19 9H9.5a2 2 0 0 0-2 2v4"/><circle cx="9" cy="9" r="2"/><circle cx="19" cy="16" r="2"/></svg>`;
const closeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
const addIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>`;

const CryptoTracker: React.FC = () => {
  const [cryptoList, setCryptoList] = useState<CryptoData[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [activeTab] = useState('crypto-prices');

  // Load crypto list on component mount
  useEffect(() => {
    const fetchCryptoList = async () => {
      const list = await loadCryptoList();
      setCryptoList(list);
      if (list.length > 0) {
        updateAllPrices(list);
      }
    };
    
    fetchCryptoList();
    
    // Set up interval for price updates
    const intervalId = setInterval(() => {
      updateAllPrices(cryptoList);
    }, 15000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Update all crypto prices
  const updateAllPrices = async (list: CryptoData[] = cryptoList) => {
    const updatedList = await Promise.all(
      list.map(async (crypto) => {
        const newPrice = await getCryptoPrice(crypto.symbol);
        if (newPrice) {
          return {
            ...crypto,
            previousPrice: crypto.price,
            price: newPrice,
            lastUpdated: Date.now()
          };
        }
        return crypto;
      })
    );
    
    setCryptoList(updatedList);
    saveCryptoList(updatedList);
  };

  // Add new crypto
  const addCrypto = async () => {
    const symbol = inputValue.trim().toUpperCase();
    
    if (!symbol) return;
    
    // Check if already exists
    if (cryptoList.some(crypto => crypto.symbol === symbol)) {
      alert(`${symbol} is already in your list.`);
      return;
    }
    
    const price = await getCryptoPrice(symbol);
    if (!price) {
      alert(`Could not find price for ${symbol}. Please check the symbol and try again.`);
      return;
    }
    
    const newCrypto: CryptoData = {
      symbol,
      price,
      previousPrice: null,
      lastUpdated: Date.now()
    };
    
    const updatedList = [...cryptoList, newCrypto];
    setCryptoList(updatedList);
    saveCryptoList(updatedList);
    setInputValue('');
  };

  // Remove crypto
  const removeCrypto = (symbol: string) => {
    const updatedList = cryptoList.filter(crypto => crypto.symbol !== symbol);
    setCryptoList(updatedList);
    saveCryptoList(updatedList);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      addCrypto();
    }
  };

  // Render crypto list
  const renderCryptoList = () => {
    if (cryptoList.length === 0) {
      return (
        <div className="empty-state" dangerouslySetInnerHTML={{ __html: `
          ${emptyIcon}
          <p>No cryptocurrencies added yet.</p>
          <p>Add your first one below!</p>
        `}} />
      );
    }

    // Sort by symbol
    const sortedList = [...cryptoList].sort((a, b) => a.symbol.localeCompare(b.symbol));
    
    return sortedList.map((crypto) => {
      if (!crypto.price) return null;
      
      const trend = getTrend(crypto.price, crypto.previousPrice);
      const formattedPrice = formatPrice(crypto.price);
      
      return (
        <div key={crypto.symbol} className="crypto-item">
          <div className="crypto-info">
            <span className="crypto-symbol">{crypto.symbol}</span>
            <span className="crypto-price">${formattedPrice}</span>
            <span dangerouslySetInnerHTML={{ __html: trend }} />
          </div>
          <button 
            className="remove-btn" 
            title={`Remove ${crypto.symbol}`}
            onClick={() => removeCrypto(crypto.symbol)}
            dangerouslySetInnerHTML={{ __html: removeIcon }}
          />
        </div>
      );
    });
  };

  return (
    <div className="container">
      <div className="tab-container">
        <button className={`tab ${activeTab === 'crypto-prices' ? 'active' : ''}`} data-tab="crypto-prices">
          Crypto Prices <span className="tab-close" dangerouslySetInnerHTML={{ __html: closeIcon }} />
        </button>
        <button className="add-tab" dangerouslySetInnerHTML={{ __html: addIcon }} />
      </div>
      
      <div className="app-header">
        <div className="app-icon" dangerouslySetInnerHTML={{ __html: cryptoIcon }} />
        <h2>Crypto Price Tracker</h2>
        <button 
          id="refreshAll" 
          className="refresh-btn" 
          title="Refresh all prices"
          onClick={() => updateAllPrices()}
          dangerouslySetInnerHTML={{ __html: refreshIcon }}
        />
      </div>
      
      <div className="content-area">
        <div id="priceList">
          {renderCryptoList()}
        </div>
      </div>
      
      <div className="add-crypto">
        <input
          type="text"
          id="cryptoInput"
          placeholder="Enter crypto symbol (e.g. BTC)"
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
        />
        <button id="addCrypto" onClick={addCrypto}>Add</button>
      </div>
    </div>
  );
};

export default CryptoTracker;