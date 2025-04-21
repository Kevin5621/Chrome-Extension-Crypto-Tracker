import React, { useState, useEffect } from 'react';
import { CryptoData } from '../types';
import { getCryptoPrice } from '../utils/api';
import { saveCryptoList, loadCryptoList } from '../utils/storage';
import PortfolioTracker from './pages/PortfolioTracker';
import CryptoPricesList from './pages/CryptoPricesList';

const CryptoTracker: React.FC = () => {
  const [cryptoList, setCryptoList] = useState<CryptoData[]>([]);
  const [activeTab, setActiveTab] = useState('crypto-prices');

  // Load crypto list on component mount
  useEffect(() => {
    let isMounted = true;
    
    const fetchCryptoList = async () => {
      try {
        const list = await loadCryptoList();
        if (isMounted) {
          setCryptoList(list);
          if (list.length > 0) {
            updateAllPrices(list);
          }
        }
      } catch (error) {
        console.error('Error fetching crypto list:', error);
      }
    };
    
    fetchCryptoList();
    
    // Set up interval for price updates
    const intervalId = setInterval(() => {
      if (isMounted) {
        updateAllPrices();
      }
    }, 15000);
    
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);
  
  const updateAllPrices = async (list?: CryptoData[]) => {
    const currentList = list || cryptoList;
    if (!currentList || currentList.length === 0) return;
    
    try {
      const updatedList = await Promise.all(
        currentList.map(async (crypto) => {
          try {
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
          } catch {
            return crypto;
          }
        })
      );
      
      setCryptoList(updatedList);
      await saveCryptoList(updatedList);
    } catch (error) {
      console.error('Error updating prices:', error);
    }
  };

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'portfolio':
        return <PortfolioTracker cryptoList={cryptoList} />;
      case 'crypto-prices':
      default:
        return (
          <CryptoPricesList 
            cryptoList={cryptoList} 
            setCryptoList={setCryptoList} 
            updateAllPrices={updateAllPrices} 
          />
        );
    }
  };

  return (
    <div className="container">
      <div className="tab-container">
        <button 
          className={`tab ${activeTab === 'crypto-prices' ? 'active' : ''}`} 
          onClick={() => setActiveTab('crypto-prices')}
        >
          Crypto Prices
        </button>
        <button 
          className={`tab ${activeTab === 'portfolio' ? 'active' : ''}`} 
          onClick={() => setActiveTab('portfolio')}
        >
          Portfolio
        </button>
      </div>
      
      {renderContent()}
    </div>
  );
};

export default CryptoTracker;