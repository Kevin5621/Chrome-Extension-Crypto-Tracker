// Interfaces
class CryptoData {
    constructor(
      symbol,
      price,
      previousPrice = null,
      lastUpdated = Date.now()
    ) {
      this.symbol = symbol;
      this.price = price;
      this.previousPrice = previousPrice;
      this.lastUpdated = lastUpdated;
    }
  }
  
  let cryptoList = [];
  let activeTab = 'crypto-prices';
  
  // SVG icons for empty state
  const emptyIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M21 9V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3"/><path d="M9 15H5a2 2 0 0 0-2 2v4"/><path d="M19 9H9.5a2 2 0 0 0-2 2v4"/><circle cx="9" cy="9" r="2"/><circle cx="19" cy="16" r="2"/></svg>`;
  const removeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
  
  // Get crypto price from API
  async function getCryptoPrice(symbol) {
    try {
      const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`);
      if (!response.ok) {
        throw new Error('Invalid symbol');
      }
      const data = await response.json();
      return data.price;
    } catch (error) {
      return null;
    }
  }
  
  // Format price for display
  function formatPrice(price) {
    const num = parseFloat(price);
    if (num > 1000) return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
    if (num > 1) return num.toFixed(2);
    if (num > 0.001) return num.toFixed(4);
    return num.toFixed(6);
  }
  
  // Get trend indicator
  function getTrend(current, previous) {
    if (!previous) return '';
    
    const currentPrice = parseFloat(current);
    const previousPrice = parseFloat(previous);
    
    if (currentPrice > previousPrice) {
      return `<span class="price-trend price-up">▲</span>`;
    } else if (currentPrice < previousPrice) {
      return `<span class="price-trend price-down">▼</span>`;
    }
    return '';
  }
  
  // Update UI with crypto prices
  function renderPriceList() {
    const priceList = document.getElementById('priceList');
    if (!priceList) return;
    
    if (cryptoList.length === 0) {
      priceList.innerHTML = `
        <div class="empty-state">
          ${emptyIcon}
          <p>No cryptocurrencies added yet.</p>
          <p>Add your first one below!</p>
        </div>
      `;
      return;
    }
    
    priceList.innerHTML = '';
  
    // Sort by symbol
    cryptoList.sort((a, b) => a.symbol.localeCompare(b.symbol));
  
    for (const crypto of cryptoList) {
      if (!crypto.price) continue;
      
      const cryptoDiv = document.createElement('div');
      cryptoDiv.className = 'crypto-item';
      
      const trend = getTrend(crypto.price, crypto.previousPrice);
      const formattedPrice = formatPrice(crypto.price);
      
      cryptoDiv.innerHTML = `
        <div class="crypto-info">
          <span class="crypto-symbol">${crypto.symbol}</span>
          <span class="crypto-price">$${formattedPrice}</span>
          ${trend}
        </div>
        <button class="remove-btn" data-crypto="${crypto.symbol}" title="Remove ${crypto.symbol}">${removeIcon}</button>
      `;
      priceList.appendChild(cryptoDiv);
    }
  }
  
  // Update all crypto prices
  async function updateAllPrices() {
    for (const crypto of cryptoList) {
      const newPrice = await getCryptoPrice(crypto.symbol);
      if (newPrice) {
        crypto.previousPrice = crypto.price;
        crypto.price = newPrice;
        crypto.lastUpdated = Date.now();
      }
    }
    
    renderPriceList();
    saveCryptoList();
  }
  
  // Add new crypto
  async function addCrypto(symbol) {
    symbol = symbol.toUpperCase();
    
    // Check if already exists
    if (cryptoList.some(crypto => crypto.symbol === symbol)) {
      return false;
    }
    
    const price = await getCryptoPrice(symbol);
    if (!price) {
      alert(`Could not find price for ${symbol}. Please check the symbol and try again.`);
      return false;
    }
    
    cryptoList.push(new CryptoData(symbol, price));
    
    renderPriceList();
    saveCryptoList();
    return true;
  }
  
  // Remove crypto
  function removeCrypto(symbol) {
    cryptoList = cryptoList.filter(crypto => crypto.symbol !== symbol);
    renderPriceList();
    saveCryptoList();
  }
  
  // Save crypto list to chrome storage
  function saveCryptoList() {
    chrome.storage.local.set({ cryptoList: JSON.stringify(cryptoList) });
  }
  
  // Load crypto list from chrome storage
  function loadCryptoList() {
    chrome.storage.local.get('cryptoList', (result) => {
      if (result.cryptoList) {
        try {
          const parsedList = JSON.parse(result.cryptoList);
          cryptoList = parsedList.map(item => 
            new CryptoData(item.symbol, item.price, item.previousPrice, item.lastUpdated)
          );
          renderPriceList();
        } catch (e) {
          console.error('Failed to parse saved crypto list');
          cryptoList = [];
        }
      }
    });
  }
  
  // Setup event listeners
  document.addEventListener('DOMContentLoaded', () => {
    loadCryptoList();
    
    const addButton = document.getElementById('addCrypto');
    const input = document.getElementById('cryptoInput');
    const priceList = document.getElementById('priceList');
    const refreshButton = document.getElementById('refreshAll');
  
    // Add crypto on button click
    addButton?.addEventListener('click', async () => {
      const symbol = input.value.trim();
      if (symbol) {
        const added = await addCrypto(symbol);
        if (added) {
          input.value = '';
        }
      }
    });
  
    // Add crypto on Enter key
    input?.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter') {
        const symbol = input.value.trim();
        if (symbol) {
          const added = await addCrypto(symbol);
          if (added) {
            input.value = '';
          }
        }
      }
    });
  
    // Handle remove button clicks
    priceList?.addEventListener('click', (e) => {
      const target = e.target;
      const removeBtn = target.closest('.remove-btn');
      
      if (removeBtn) {
        const symbol = removeBtn.getAttribute('data-crypto');
        if (symbol) {
          removeCrypto(symbol);
        }
      }
    });
  
    // Refresh all prices on button click
    refreshButton?.addEventListener('click', () => {
      updateAllPrices();
    });
  
    // Update prices every 15 seconds
    setInterval(updateAllPrices, 15000);
    
    // Initial price update
    if (cryptoList.length > 0) {
      updateAllPrices();
    }
  });