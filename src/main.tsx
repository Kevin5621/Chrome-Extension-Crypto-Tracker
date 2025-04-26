import React from 'react';
import ReactDOM from 'react-dom/client';
import CryptoTracker from './components/CryptoTracker';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <CryptoTracker />
  </React.StrictMode>
);