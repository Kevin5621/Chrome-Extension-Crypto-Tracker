import React from 'react';
import CryptoAutocomplete from './CryptoAutocomplete';

interface GlobalAutocompleteProps {
  onSelect: (symbol: string) => void;
  placeholder?: string;
  validateOnSelect?: boolean;
}

// wrapper component for CryptoAutocomplete
const GlobalAutocomplete: React.FC<GlobalAutocompleteProps> = ({ 
  onSelect, 
  placeholder,
  validateOnSelect = true
}) => {
  return (
    <CryptoAutocomplete 
      onSelect={onSelect}
      placeholder={placeholder}
      validateOnSelect={validateOnSelect}
    />
  );
};

export default GlobalAutocomplete;