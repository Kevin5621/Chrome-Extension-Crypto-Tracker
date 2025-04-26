import React, { useState } from 'react';
import { CryptoData } from '../../types';
import { getCryptoPrice, getCoinDetails } from '../../utils/api';
import { saveCryptoList } from '../../utils/storage';
import { formatPrice, formatPercentage, formatLargeNumber } from '../../utils/formatters';
import CryptoAutocomplete from '../features/CryptoAutocomplete';

// SVG icons
const cryptoIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 6v2m0 8v2"/></svg>`;
const refreshIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>`;
const removeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
const emptyIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M21 9V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3"/><path d="M9 15H5a2 2 0 0 0-2 2v4"/><path d="M19 9H9.5a2 2 0 0 0-2 2v4"/><circle cx="9" cy="9" r="2"/><circle cx="19" cy="16" r="2"/></svg>`;
const expandIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`;
const collapseIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>`;

interface CryptoPricesListProps {
  cryptoList: CryptoData[];
  setCryptoList: React.Dispatch<React.SetStateAction<CryptoData[]>>;
  updateAllPrices: (list?: CryptoData[]) => Promise<void>;
}

const CryptoPricesList: React.FC<CryptoPricesListProps> = ({ 
  cryptoList, 
  setCryptoList, 
  updateAllPrices 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [loadingDetails, setLoadingDetails] = useState<{[key: string]: boolean}>({});

  // Add new crypto
  const addCrypto = async () => {
    const symbol = inputValue.trim().toUpperCase();
    
    if (!symbol) return;
    
    // Check if already exists
    if (cryptoList.some(crypto => crypto.symbol === symbol)) {
      alert(`${symbol} sudah ada dalam daftar.`);
      return;
    }
    
    const price = await getCryptoPrice(symbol);
    if (!price) {
      alert(`Tidak dapat menemukan harga untuk ${symbol}. Periksa kembali simbol dan coba lagi.`);
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

  // Toggle expanded state
  const toggleExpand = async (symbol: string) => {
    const updatedList = cryptoList.map(crypto => {
      if (crypto.symbol === symbol) {
        const newState = !crypto.isExpanded;
        
        // Jika akan diexpand dan belum ada data detail, ambil data
        if (newState && (!crypto.marketCap || !crypto.priceHistory)) {
          fetchCoinDetails(symbol);
        }
        
        return {
          ...crypto,
          isExpanded: newState
        };
      }
      return crypto;
    });
    
    setCryptoList(updatedList);
    saveCryptoList(updatedList);
  };

  // Fetch additional coin details
  const fetchCoinDetails = async (symbol: string) => {
    setLoadingDetails(prev => ({...prev, [symbol]: true}));
    
    try {
      const details = await getCoinDetails(symbol);
      
      if (details) {
        const updatedList = cryptoList.map(crypto => {
          if (crypto.symbol === symbol) {
            return {
              ...crypto,
              marketCap: details.marketCap,
              volume24h: details.volume,
              high24h: details.high24h,
              low24h: details.low24h,
              priceHistory: details.priceHistory,
              priceChange24h: details.priceChange24h
            };
          }
          return crypto;
        });
        
        setCryptoList(updatedList);
        saveCryptoList(updatedList);
      }
    } catch (error) {
      console.error(`Error fetching details for ${symbol}:`, error);
    } finally {
      setLoadingDetails(prev => ({...prev, [symbol]: false}));
    }
  };

  // Calculate price percentage change
  const getPriceChangePercent = (crypto: CryptoData) => {
    if (!crypto.priceHistory || crypto.priceHistory.length < 2) {
      return crypto.priceChange24h || 0;
    }
    
    const currentPrice = parseFloat(crypto.price);
    const oldPrice = crypto.priceHistory[0].price;
    return ((currentPrice - oldPrice) / oldPrice) * 100;
  };

  // Render price chart
  const renderPriceChart = (crypto: CryptoData) => {
    if (!crypto.priceHistory || crypto.priceHistory.length < 2) {
      return <div className="chart-placeholder">Data historis tidak tersedia</div>;
    }
    
    const chartHeight = 80;
    const chartWidth = '100%';
    const prices = crypto.priceHistory.map(p => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min;
    
    // Buat path untuk chart
    let path = '';
    crypto.priceHistory.forEach((point, i) => {
      const x = (i / (crypto.priceHistory!.length - 1)) * 100;
      const y = 100 - ((point.price - min) / range) * 100;
      
      if (i === 0) {
        path += `M${x},${y} `;
      } else {
        path += `L${x},${y} `;
      }
    });
    
    const trend = parseFloat(crypto.price) > crypto.priceHistory[0].price ? 'price-up' : 'price-down';
    
    return (
      <div className="price-chart">
        <svg width={chartWidth} height={chartHeight} viewBox="0 0 100 100" preserveAspectRatio="none">
          <path 
            d={path} 
            fill="none" 
            stroke={trend === 'price-up' ? '#10b981' : '#ef4444'} 
            strokeWidth="2"
          />
        </svg>
      </div>
    );
  };

  // Render crypto details
  const renderCryptoDetails = (crypto: CryptoData) => {
    if (loadingDetails[crypto.symbol]) {
      return <div className="crypto-details-loading">Memuat data...</div>;
    }
    
    return (
      <div className="crypto-details">
        {renderPriceChart(crypto)}
        
        <div className="crypto-metrics">
          {crypto.marketCap && (
            <div className="metric">
              <span className="metric-label">Market Cap</span>
              <span className="metric-value">${formatLargeNumber(crypto.marketCap)}</span>
            </div>
          )}
          
          {crypto.volume24h && (
            <div className="metric">
              <span className="metric-label">Volume 24h</span>
              <span className="metric-value">${formatLargeNumber(crypto.volume24h)}</span>
            </div>
          )}
          
          {crypto.high24h && crypto.low24h && (
            <div className="metric">
              <span className="metric-label">Range 24h</span>
              <span className="metric-value">
                ${formatPrice(crypto.low24h.toString())} - ${formatPrice(crypto.high24h.toString())}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render crypto list
  const renderCryptoList = () => {
    if (cryptoList.length === 0) {
      return (
        <div className="empty-state" dangerouslySetInnerHTML={{ __html: `
          ${emptyIcon}
          <p>Belum ada cryptocurrency yang ditambahkan.</p>
          <p>Tambahkan yang pertama di bawah!</p>
        `}} />
      );
    }

    // Sort by symbol
    const sortedList = [...cryptoList].sort((a, b) => a.symbol.localeCompare(b.symbol));
    
    return sortedList.map((crypto) => {
      if (!crypto.price) return null;
      
      const formattedPrice = formatPrice(crypto.price);
      const percentChange = getPriceChangePercent(crypto);
      const isPriceUp = percentChange >= 0;
      
      return (
        <div key={crypto.symbol} className="crypto-item">
          <div className="crypto-header">
            <div className="crypto-info">
              <div className="crypto-main-info">
                <span className="crypto-symbol">{crypto.symbol}</span>
                <div className="crypto-actions">
                  <button 
                    className="expand-btn" 
                    title={crypto.isExpanded ? "Tutup" : "Lihat detail"}
                    onClick={() => toggleExpand(crypto.symbol)}
                    dangerouslySetInnerHTML={{ __html: crypto.isExpanded ? collapseIcon : expandIcon }}
                  />
                  <button 
                    className="remove-btn" 
                    title={`Hapus ${crypto.symbol}`}
                    onClick={() => removeCrypto(crypto.symbol)}
                    dangerouslySetInnerHTML={{ __html: removeIcon }}
                  />
                </div>
              </div>
              <div className="crypto-price-info">
                <span className="crypto-price">${formattedPrice}</span>
                <span className={`price-change ${isPriceUp ? 'price-up' : 'price-down'}`}>
                  {isPriceUp ? '▲' : '▼'} {formatPercentage(Math.abs(percentChange))}%
                </span>
              </div>
            </div>
          </div>
          
          {crypto.isExpanded && (
            <div className="crypto-expanded">
              {renderCryptoDetails(crypto)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <>
      <div className="app-header">
        <div className="app-icon" dangerouslySetInnerHTML={{ __html: cryptoIcon }} />
        <h2>Crypto Price Tracker</h2>
        <button 
          id="refreshAll" 
          className="refresh-btn" 
          title="Refresh semua harga"
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
        <CryptoAutocomplete 
          onSelect={(symbol) => {
            setInputValue(symbol);
            addCrypto();
          }}
          placeholder="Masukkan simbol crypto (contoh: BTC)"
          validateOnSelect={true}
          position="top"
        />
        <button id="addCrypto" onClick={addCrypto}>Tambah</button>
      </div>
    </>
  );
};

export default CryptoPricesList;