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
  const [showDialog, setShowDialog] = useState(false);
  const [transactionType, setTransactionType] = useState<'buy' | 'sell'>('buy');
  const [date, setDate] = useState('');
  const [fee, setFee] = useState('');

  // Format current date as YYYY-MM-DD for date input default value
  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Initialize date when dialog opens
  const handleOpenDialog = () => {
    setDate(getCurrentDate());
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    resetForm();
  };

  const resetForm = () => {
    setSymbol('');
    setAmount('');
    setPurchasePrice('');
    setTransactionType('buy');
    setDate(getCurrentDate());
    setFee('');
  };

  const handleAddItem = async () => {
    const trimmedSymbol = symbol.trim().toUpperCase();
    const parsedAmount = parseFloat(amount);
    const parsedPrice = parseFloat(purchasePrice);
    
    if (!trimmedSymbol || isNaN(parsedAmount) || isNaN(parsedPrice)) {
      alert('Please fill all fields with valid values');
      return;
    }
    
    // Check if symbol exists
    const price = await getCryptoPrice(trimmedSymbol);
    if (!price) {
      alert(`Cannot find price for ${trimmedSymbol}. Please check the symbol and try again.`);
      return;
    }
    
    // Check if already exists in wallet
    if (existingSymbols.includes(trimmedSymbol)) {
      alert(`${trimmedSymbol} already exists in your ${walletName}.`);
      return;
    }
    
    const newItem: PortfolioItem = {
      symbol: trimmedSymbol,
      amount: parsedAmount,
      purchasePrice: parsedPrice,
      purchaseDate: date ? new Date(date).getTime() : Date.now(),
      fee: fee ? parseFloat(fee) : 0,
    };
    
    await onAddItem(newItem);
    
    // Close dialog and reset form
    handleCloseDialog();
  };

  // Calculate total spent
  const calculateTotal = () => {
    const parsedAmount = parseFloat(amount) || 0;
    const parsedPrice = parseFloat(purchasePrice) || 0;
    const parsedFee = parseFloat(fee) || 0;
    
    return (parsedAmount * parsedPrice) + parsedFee;
  };

  return (
    <>
      <button className="floating-add-btn" onClick={handleOpenDialog} title="Add Transaction">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14"></path>
        </svg>
      </button>
      
      {showDialog && (
        <div className="transaction-dialog-overlay">
          <div className="transaction-dialog">
            <div className="dialog-header">
              <h3>Add Transaction</h3>
              <button className="close-dialog-btn" onClick={handleCloseDialog}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div className="transaction-type-selector">
              <button 
                className={`type-btn ${transactionType === 'buy' ? 'active' : ''}`}
                onClick={() => setTransactionType('buy')}
              >
                Buy
              </button>
              <button 
                className={`type-btn ${transactionType === 'sell' ? 'active' : ''}`}
                onClick={() => setTransactionType('sell')}
              >
                Sell
              </button>
            </div>
            
            <div className="crypto-selector">
              <CryptoAutocomplete
                onSelect={(value) => setSymbol(value)}
                placeholder="Enter crypto symbol (e.g. BTC)"
                validateOnSelect={true}
                position="top" 
              />
            </div>
            
            <div className="transaction-details">
              <div className="detail-row">
                <div className="detail-column">
                  <label>Quantity</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="detail-column">
                  <label>Price Per Coin</label>
                  <div className="price-input">
                    <span className="currency-symbol">$</span>
                    <input
                      type="number"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
              
              <div className="detail-row date-fee-row">
                <button className="date-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)}
                  />
                </button>
                
                <button className="fee-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                  <span>Fee</span>
                  <input 
                    type="number" 
                    value={fee} 
                    onChange={(e) => setFee(e.target.value)}
                    placeholder="0.00"
                  />
                </button>
              </div>
            </div>
            
            <div className="transaction-total">
              <div className="total-label">Total Spent</div>
              <div className="total-amount">${calculateTotal().toFixed(2)}</div>
            </div>
            
            <button className="add-transaction-btn" onClick={handleAddItem}>
              Add Transaction
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AddTransactionForm;