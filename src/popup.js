let cryptoList = [];

// Fungsi untuk mengambil data harga dari API
async function getCryptoPrice(symbol) {
  try {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`);
    const data = await response.json();
    return data.price;
  } catch (error) {
    return 'Error';
  }
}

// Fungsi untuk memperbarui tampilan
async function updatePrices() {
  const priceList = document.getElementById('priceList');
  priceList.innerHTML = '';

  for (const crypto of cryptoList) {
    const price = await getCryptoPrice(crypto);
    const cryptoDiv = document.createElement('div');
    cryptoDiv.className = 'crypto-item';
    cryptoDiv.innerHTML = `
      <span>${crypto}/USDT: $${Number(price).toFixed(2)}</span>
      <button class="remove-btn" data-crypto="${crypto}">Hapus</button>
    `;
    priceList.appendChild(cryptoDiv);
  }
}

// Menyimpan daftar crypto ke storage
function saveCryptoList() {
  chrome.storage.local.set({ cryptoList });
}

// Memuat daftar crypto dari storage
function loadCryptoList() {
  chrome.storage.local.get(['cryptoList'], (result) => {
    if (result.cryptoList) {
      cryptoList = result.cryptoList;
      updatePrices();
    }
  });
}

// Event listener
document.addEventListener('DOMContentLoaded', () => {
  loadCryptoList();
  
  document.getElementById('addCrypto').addEventListener('click', () => {
    const input = document.getElementById('cryptoInput');
    const symbol = input.value.toUpperCase();
    
    if (symbol && !cryptoList.includes(symbol)) {
      cryptoList.push(symbol);
      saveCryptoList();
      updatePrices();
      input.value = '';
    }
  });

  document.getElementById('priceList').addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-btn')) {
      const symbol = e.target.dataset.crypto;
      cryptoList = cryptoList.filter(crypto => crypto !== symbol);
      saveCryptoList();
      updatePrices();
    }
  });

  // Update harga setiap 10 detik
  setInterval(updatePrices, 10000);
});
