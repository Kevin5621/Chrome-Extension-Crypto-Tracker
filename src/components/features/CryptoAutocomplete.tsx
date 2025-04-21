import React, { useState, useEffect, useRef } from 'react';
import { CoinData, UserSearchHistory, SearchResult } from '../../types';
import { searchCoins, initializeSearchEngine } from '../../utils/searchUtils';
import { loadCoinList, loadSearchHistory, updateSearchHistory } from '../../utils/coinStorage';
import { getAllCoinPairs, isValidTradingPair } from '../../utils/api';

// SVG icons
const searchIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`;
const historyIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
const trendingIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`;
const popularIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`;

interface CryptoAutocompleteProps {
  onSelect: (symbol: string) => void;
  placeholder?: string;
  position?: 'top' | 'bottom';
  validateOnSelect?: boolean;
}

const CryptoAutocomplete: React.FC<CryptoAutocompleteProps> = ({ 
  onSelect,
  placeholder = "Search for a cryptocurrency...",
  position = 'bottom',
  validateOnSelect = false
}) => {
  const [inputValue, setInputValue] = useState('');
  const [coinList, setCoinList] = useState<CoinData[]>([]);
  const [userHistory, setUserHistory] = useState<UserSearchHistory>({});
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [, setDropdownHeight] = useState(0);
  const [validationStatus, setValidationStatus] = useState<{[key: string]: boolean}>({});
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Mengukur tinggi dropdown untuk positioning yang tepat
  useEffect(() => {
    if (dropdownRef.current && showDropdown) {
      setDropdownHeight(dropdownRef.current.offsetHeight);
    }
  }, [searchResults, showDropdown]);
  
  // Initialize data on component mount
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      
      try {
        // Load cached data first for immediate display
        const cachedCoins = await loadCoinList();
        const history = await loadSearchHistory();
        
        setCoinList(cachedCoins);
        setUserHistory(history);
        
        if (cachedCoins.length > 0) {
          initializeSearchEngine(cachedCoins);
        }
        
        // Then fetch fresh data from API
        const freshCoins = await getAllCoinPairs();
        
        if (freshCoins.length > 0) {
          // Filter hanya simbol yang valid (USDT pairs)
          const validCoins = freshCoins.filter(coin => 
            coin.quoteAsset === 'USDT' && coin.baseAsset.length > 0
          );
          
          setCoinList(validCoins);
          initializeSearchEngine(validCoins);
          // Cache the fresh data
          await loadCoinList();
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing autocomplete:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initialize();
    
    // Add click outside listener to close dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);
  
  // Perform search when input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Show dropdown when typing
    if (value.trim()) {
      setShowDropdown(true);
    }
    
    // Debounce search to avoid excessive API calls
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(async () => {
      if (isInitialized) {
        setIsLoading(true);
        const results = await searchCoins(value, coinList, userHistory);
        setSearchResults(results);
        setIsLoading(false);
      }
    }, 300);
  };
  
  // Handle selection of a coin
  const handleSelectCoin = async (symbol: string) => {
    setInputValue(symbol);
    setShowDropdown(false);
    
    // Validasi simbol jika diperlukan
    if (validateOnSelect) {
      setIsLoading(true);
      const isValid = await isValidTradingPair(symbol);
      setIsLoading(false);
      
      // Simpan status validasi
      setValidationStatus(prev => ({...prev, [symbol]: isValid}));
      
      if (!isValid) {
        // Jika tidak valid, jangan lanjutkan
        return;
      }
    }
    
    // Update search history
    await updateSearchHistory(symbol);
    
    // Call the parent's onSelect callback
    onSelect(symbol);
  };
  
  // Handle input focus
  const handleInputFocus = async () => {
    // Show default results when focusing on empty input
    if (!inputValue.trim() && isInitialized) {
      setIsLoading(true);
      const results = await searchCoins('', coinList, userHistory);
      setSearchResults(results);
      setIsLoading(false);
    }
    
    setShowDropdown(true);
  };
  
  // Get icon for result type
  const getResultIcon = (matchType: string) => {
    switch (matchType) {
      case 'history':
        return historyIcon;
      case 'trending':
        return trendingIcon;
      case 'popular':
        return popularIcon;
      default:
        return '';
    }
  };
  
  // Get label for result type
  const getResultLabel = (matchType: string) => {
    switch (matchType) {
      case 'history':
        return 'Recent';
      case 'trending':
        return 'Trending';
      case 'popular':
        return 'Popular';
      case 'exact':
        return 'Exact Match';
      case 'prefix':
        return 'Starts With';
      case 'fuzzy':
        return 'Similar';
      default:
        return '';
    }
  };
  
  // decide the dropdown class name
  const getDropdownClassName = () => {
    return `search-results-dropdown ${position === 'top' ? 'dropdown-top' : 'dropdown-bottom'}`;
  };
  
  // check if the symbol is valid
  const isSymbolValid = (symbol: string) => {
    if (validationStatus[symbol] === undefined) return true;
    return validationStatus[symbol];
  };
  
  return (
    <div className="crypto-autocomplete">
      <div className="search-input-container">
        <span 
          className="search-icon" 
          dangerouslySetInnerHTML={{ __html: searchIcon }} 
        />
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
        />
        {isLoading && <div className="loading-spinner"></div>}
      </div>
      
      {showDropdown && (
        <div 
          ref={dropdownRef} 
          className={getDropdownClassName()}
          style={position === 'top' ? { bottom: `${inputRef.current?.offsetHeight || 0}px` } : {}}
        >
          {searchResults.length === 0 ? (
            <div className="no-results">
              {isLoading ? 'Searching...' : 'No results found'}
            </div>
          ) : (
            searchResults.map((result, index) => (
              <div 
                key={`${result.symbol}-${index}`}
                className={`search-result-item ${!isSymbolValid(result.symbol) ? 'invalid-symbol' : ''}`}
                onClick={() => handleSelectCoin(result.symbol)}
              >
                <div className="result-symbol">{result.symbol}</div>
                {result.matchType && (
                  <div className="result-type">
                    <span 
                      className="result-icon" 
                      dangerouslySetInnerHTML={{ __html: getResultIcon(result.matchType) }} 
                    />
                    <span className="result-label">{getResultLabel(result.matchType)}</span>
                  </div>
                )}
                {validationStatus[result.symbol] === false && (
                  <div className="validation-error">Not available</div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CryptoAutocomplete;