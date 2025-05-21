import React, { useState } from 'react';
import { PortfolioItem } from '../../types';
import { getCryptoPrice } from '../../utils/api';
import CryptoAutocomplete from './CryptoAutocomplete';

interface AddTransactionFormProps {
  onAddItem: (item: PortfolioItem) => Promise<void>;
  walletName: string;
  existingSymbols?: string[];
}

const AddTransactionForm: React.FC<AddTransactionFormProps> = ({ 
  onAddItem, 
  walletName,
  existingSymbols = []
}) => {
  const [symbol, setSymbol] = useState('');
  const [amount, setAmount] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');

  const handleAddItem = async () => {
    const trimmedSymbol = symbol.trim().toUpperCase();
    const parsedAmount = parseFloat(amount);
    const parsedPrice = parseFloat(purchasePrice);
    
    if (!trimmedSymbol || isNaN(parsedAmount) || isNaN(parsedPrice)) {
      alert('Mohon isi semua kolom dengan nilai yang valid');
      return;
    }
    
    // Periksa apakah simbol ada
    const price = await getCryptoPrice(trimmedSymbol);
    if (!price) {
      alert(`Tidak dapat menemukan harga untuk ${trimmedSymbol}. Silakan periksa simbol dan coba lagi.`);
      return;
    }
    
    // Periksa apakah sudah ada di wallet
    if (existingSymbols.includes(trimmedSymbol)) {
      alert(`${trimmedSymbol} sudah ada di ${walletName} Anda.`);
      return;
    }
    
    const newItem: PortfolioItem = {
      symbol: trimmedSymbol,
      amount: parsedAmount,
      purchasePrice: parsedPrice,
      purchaseDate: Date.now()
    };
    
    await onAddItem(newItem);
    
    // Reset form
    setSymbol('');
    setAmount('');
    setPurchasePrice('');
  };

  return (
    <div className="add-portfolio-item">
      <div className="form-row">
        <CryptoAutocomplete
          onSelect={(value) => setSymbol(value)}
          placeholder="Masukkan simbol crypto (contoh: BTC)"
          validateOnSelect={true}
          position="top" 
        />
      </div>
      <div className="form-row">
        <input
          type="number"
          placeholder="Jumlah"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <input
          type="number"
          placeholder="Harga Pembelian ($)"
          value={purchasePrice}
          onChange={(e) => setPurchasePrice(e.target.value)}
        />
      </div>
      <button onClick={handleAddItem}>Tambahkan ke {walletName}</button>
    </div>
  );
};

export default AddTransactionForm;