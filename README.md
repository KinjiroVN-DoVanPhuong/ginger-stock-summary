# Stock Trading Performance Dashboard

A real-time dashboard for monitoring AI-generated trading signals and executed trades using Firebase Realtime Database.

## Features

- **Real-time Data**: Live updates from Firebase Realtime Database
- **Performance Metrics**: Win rate, total P&L, average risk/reward, max drawdown
- **Interactive Charts**: Equity curve, win/loss distribution, symbol performance
- **Advanced Filtering**: Filter by symbol, date range, and trade status
- **Trade Matching**: Automatically matches trading signals with execution results
- **Modern UI**: Clean, responsive design with Tailwind CSS

## Tech Stack

- **Next.js 14** with TypeScript and App Router
- **Firebase Realtime Database** for real-time data
- **Recharts** for interactive data visualization
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **date-fns** for date manipulation

## Project Structure

```
web_ui/
├── app/                    # Next.js app router pages
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main dashboard page
├── components/            # React components
│   ├── DashboardHeader.tsx
│   ├── MetricsCards.tsx
│   ├── TradesTable.tsx
│   ├── ChartsSection.tsx
│   └── FiltersPanel.tsx
├── lib/                   # Firebase configuration
│   └── firebase/
│       └── config.ts
├── services/             # Business logic and data services
│   └── tradingService.ts
├── types/                # TypeScript type definitions
│   └── trading.ts
├── scripts/              # Utility scripts
│   └── generateSampleData.ts
└── public/              # Static assets
```

## Getting Started

### 1. Installation

```bash
npm install
```

### 2. Configure Firebase

Update the Firebase configuration in `lib/firebase/config.ts` with your Firebase project credentials:

```typescript
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "your-auth-domain",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "your-database-url",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "your-storage-bucket",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "your-sender-id",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "your-app-id"
};
```

### 3. Data Source

This dashboard is designed to **read-only** from an existing Firebase Realtime Database that is being updated by another application. The data structure should include:

- **trading_signals**: AI-generated trading signals with entry prices, stop loss, take profit, and confidence levels
- **result_monitoring**: Executed trades with buy/sell prices, dates, and status (WIN/LOSS/HOLDING)

If you need to generate sample data for testing purposes only:

```bash
npm run generate-sample-data
```

**Note**: This will overwrite existing data. Only use for testing if your database is empty.

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Data Structure

### Trading Signals (`trading_signals` node)
```typescript
{
  symbol: string;           // Stock symbol (e.g., "AAPL")
  entry_price: number;      // Suggested entry price
  stop_loss_price: number;  // Stop loss price
  take_profit_price: number; // Take profit price
  confidence: number;       // AI confidence level (0-100%)
  timestamp?: number;       // Optional timestamp
}
```

### Trade Results (`result_monitoring` node)
```typescript
{
  symbol: string;           // Stock symbol
  buy_price: number;        // Actual buy price
  sell_price: number | null; // Sell price (null if still holding)
  buy_date: string;         // Buy date (YYYY-MM-DD)
  sell_date: string | null; // Sell date (null if still holding)
  status: 'WIN' | 'LOSS' | 'HOLDING'; // Trade status
  timestamp?: number;       // Optional timestamp
}
```

## Business Logic

The dashboard automatically:
1. **Matches trades** with signals by symbol and closest timestamp
2. **Calculates P&L** for each trade (absolute and percentage)
3. **Computes risk/reward** ratios based on signal parameters
4. **Aggregates metrics** across all trades (win rate, total P&L, etc.)
5. **Filters data** based on user selections

## Features in Detail

### Dashboard Header
- Real-time connection status
- Total trades count
- AI analysis button (placeholder for Gemini API integration)
- Data refresh functionality

### Metrics Cards
- Total trades count
- Win rate with trend indicator
- Total P&L with profit/loss coloring
- Average risk/reward ratio
- Maximum drawdown
- Average holding days

### Trades Table
- Detailed view of all matched trades
- Color-coded status badges (WIN/LOSS/HOLDING)
- P&L indicators with icons
- Symbol confidence levels
- Date formatting and currency formatting

### Charts Section
- **Equity Curve**: Cumulative P&L over time
- **Win/Loss Distribution**: Pie chart of trade outcomes
- **Symbol Performance**: Bar chart showing P&L by symbol

### Filters Panel
- Symbol filter (all symbols or specific ones)
- Status filter (ALL/WIN/LOSS/HOLDING)
- Date range filter (start and end dates)
- Active filters summary with clear buttons

## Real-time Updates

The dashboard uses Firebase Realtime Database listeners to:
- Automatically update when new trading signals are added
- Refresh when trade results change
- Maintain live connection status indicator

## Customization

### Adding Real Firebase Credentials
1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable Realtime Database
3. Copy your configuration to `lib/firebase/config.ts`
4. Set up environment variables for production

### Extending the Dashboard
- Add more chart types (e.g., volatility analysis, sector performance)
- Implement export functionality (CSV/PDF)
- Add user authentication
- Integrate with actual trading APIs
- Implement the AI analysis feature with Gemini API

## AI Analysis Feature (Optional)

The dashboard includes a placeholder for AI performance analysis. To implement:

1. Get a Gemini API key from Google AI Studio
2. Create an API endpoint in Next.js to call Gemini
3. Update the `handleAnalyzePerformance` function in `app/page.tsx`
4. Display AI-generated insights about trading performance

## License

MIT

## Support

For issues or questions, please open an issue in the repository.