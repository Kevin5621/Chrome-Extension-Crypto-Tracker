# Crypto Price Tracker

## Description

**Crypto Price Tracker** is a Chrome extension that allows users to track real-time cryptocurrency prices directly from their browser. It provides a user-friendly interface to monitor your favorite coins and manage your crypto investment portfolio.

## Key Features

- **Real-Time Price Tracking**: Stay updated with automatic price refreshes every 15 seconds.
- **Cryptocurrency Search**: Quickly search for cryptocurrencies using fuzzy autocomplete.
- **Coin Details**: View in-depth information such as market cap, 24h volume, and price range.
- **Price Charts**: Visualize price changes with simple charts.
- **Portfolio Management**: Track your crypto investments and view summaries.
- **Multi-Wallet Support**: Create and manage multiple wallets to organize your assets.
- **Profit/Loss Analysis**: See how your investments are performing with auto-calculated P/L.

## Tech Stack

Built with:

- React
- TypeScript
- Vite
- Chrome Extension APIs
- Fuse.js (for fuzzy searching)

## Installation (Development)

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd vanilla-ts
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

   > This will generate a `dist/` folder containing the production-ready extension.

4. (Optional) For development with hot reload:
   ```bash
   npm run watch
   ```

## How to Install the Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (top-right corner)
3. Click **Load unpacked**
4. Select the `dist/` folder from this project
5. The extension icon will now appear in your browser toolbar

## How to Use

### Track Cryptocurrency Prices

1. Click the extension icon to open the sidebar panel
2. Go to the **Crypto Prices** tab
3. Use the search bar to find and add coins to your watchlist
4. Click "Add" to track them
5. Click the expand icon to see more detailed information

### Manage Your Portfolio

1. Go to the **Portfolio** tab at the top
2. Add a coin by entering:
   - The symbol (e.g. BTC)
   - The amount you own
   - The purchase price
3. View your portfolio summary, including total value and profit/loss
4. Create additional wallets by clicking the "+" button next to the wallet tabs

## Project Structure

```
vanilla-ts/
├── public/                # Static assets
├── src/
│   ├── components/        # React components
│   │   ├── features/      # Feature-specific components (e.g., Autocomplete)
│   │   └── pages/         # Main pages
│   ├── styles/            # CSS files
│   ├── types/             # TypeScript definitions
│   ├── utils/             # Utility functions
│   ├── background.js      # Extension background script (service worker)
│   └── main.tsx           # Application entry point
├── manifest.json          # Chrome extension manifest
└── vite.config.ts         # Vite configuration
```

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests for bugs, improvements, or new features.

## License

[MIT License](LICENSE)