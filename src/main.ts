import './style.css'

interface CryptoPrice {
  symbol: string;
  price: string;
}

let cryptoList: string[] = [];

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="container">
    <h2>Crypto Price Tracker</h2>
    
    <div id="priceList"></div>
    
    <div class="add-crypto">
      <input type="text" id="cryptoInput" placeholder="Masukkan simbol crypto (contoh: BTC)">
      <button id="addCrypto">Tambah</button>
    </div>
  </div>
`

// Fungsi untuk mengambil data harga dari API
async function getCryptoPrice(symbol: string): Promise<string> {
  try {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`);
    const data: CryptoPrice = await response.json();
    return data.price;
  } catch (error) {
    return 'Error';
  }
}

// Fungsi untuk memperbarui tampilan
async function updatePrices() {
  const priceList = document.getElementById('priceList');
  if (!priceList) return;
  
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
  localStorage.setItem('cryptoList', JSON.stringify(cryptoList));
}

// Memuat daftar crypto dari storage 
function loadCryptoList() {
  const savedList = localStorage.getItem('cryptoList');
  if (savedList) {
    cryptoList = JSON.parse(savedList);
    updatePrices();
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  loadCryptoList();
  
  const addButton = document.getElementById('addCrypto');
  const input = document.getElementById('cryptoInput') as HTMLInputElement;
  const priceList = document.getElementById('priceList');

  addButton?.addEventListener('click', () => {
    const symbol = input.value.toUpperCase();
    
    if (symbol && !cryptoList.includes(symbol)) {
      cryptoList.push(symbol);
      saveCryptoList();
      updatePrices();
      input.value = '';
    }
  });

  priceList?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('remove-btn')) {
      const symbol = target.getAttribute('data-crypto');
      if (symbol) {
        cryptoList = cryptoList.filter(crypto => crypto !== symbol);
        saveCryptoList();
        updatePrices();
      }
    }
  });

  // Update harga setiap 10 detik
  setInterval(updatePrices, 10000);
});
