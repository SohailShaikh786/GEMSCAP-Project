# Real-Time Trading Analytics Dashboard

A comprehensive web application designed for traders and researchers at multi-frequency trading (MFT) firms. The system ingests live tick data from Binance WebSocket streams, processes and stores the data, computes quantitative analytics, and presents interactive visualizations for statistical arbitrage, risk-premia harvesting, and market analysis.

## Features

### Real-Time Data Ingestion
- WebSocket connection to Binance for live tick data streaming
- Support for multiple symbol pairs simultaneously
- Automatic reconnection with exponential backoff
- Data persistence using IndexedDB for historical analysis

### Quantitative Analytics
- **Hedge Ratio Calculation**: OLS, Huber, Theil-Sen, and Kalman Filter regression methods
- **Spread Analysis**: Real-time spread calculation between instrument pairs
- **Z-Score Computation**: Rolling window z-score for mean-reversion signals
- **ADF Test**: Augmented Dickey-Fuller test for stationarity analysis
- **Rolling Correlation**: Time-series correlation analysis between symbols
- **Volume Analysis**: Track and visualize trading volume patterns

### Advanced Analytics
- Dynamic hedge estimation using Kalman Filter
- Robust regression methods (Huber and Theil-Sen)
- Mini mean-reversion backtesting engine
- Entry signals at z-score > 2, exit at z-score < 0
- Performance metrics: Sharpe ratio, max drawdown, win rate

### Interactive Visualization
- Real-time price charts with zoom, pan, and hover capabilities
- Spread and z-score visualization with reference lines
- Multi-symbol price comparison
- Statistics dashboard with key metrics
- Dark theme optimized for extended trading sessions

### Alert System
- Custom alert definition interface
- Rule-based alerting: z-score thresholds, price levels, volume triggers
- Real-time toast notifications
- Alert history tracking

### Data Management
- CSV export for tick data, OHLC data, and analytics results
- OHLC data upload functionality
- Clear data functionality
- Automatic data cleanup for old records

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **UI Framework**: shadcn/ui components with Tailwind CSS
- **Charting**: Recharts for interactive visualizations
- **State Management**: React Context + Hooks
- **Data Storage**: IndexedDB for client-side persistence
- **WebSocket**: Native WebSocket API for Binance connection
- **Build Tool**: Vite

## Project Structure

```
├── public/
│   └── binance_browser_collector_save_test.html  # Standalone WebSocket collector
├── src/
│   ├── components/
│   │   ├── trading/
│   │   │   ├── ControlPanel.tsx        # Connection and configuration controls
│   │   │   ├── PriceChart.tsx          # Real-time price visualization
│   │   │   ├── SpreadChart.tsx         # Spread and z-score charts
│   │   │   ├── StatisticsPanel.tsx     # Key metrics dashboard
│   │   │   ├── AlertManager.tsx        # Alert configuration and management
│   │   │   └── DataExport.tsx          # Data export functionality
│   │   └── ui/                         # shadcn/ui components
│   ├── contexts/
│   │   └── TradingContext.tsx          # Global trading state management
│   ├── services/
│   │   ├── websocket.ts                # Binance WebSocket service
│   │   ├── storage.ts                  # IndexedDB storage service
│   │   └── analytics.ts                # Analytics engine
│   ├── types/
│   │   └── trading.ts                  # TypeScript type definitions
│   ├── pages/
│   │   └── Dashboard.tsx               # Main dashboard page
│   └── App.tsx                         # Application entry point
```

## Setup Instructions

### Prerequisites

- Node.js ≥ 20
- npm ≥ 10

### Installation

1. Extract the code package
2. Open the project directory in your IDE
3. Install dependencies:

```bash
npm install
```

4. Start the development server:

```bash
npm run dev -- --host 127.0.0.1
```

Or alternatively:

```bash
npx vite --host 127.0.0.1
```

5. Open your browser and navigate to the provided local URL

## Usage Guide

### Getting Started

1. **Connect to Binance**:
   - Enter two trading symbols (e.g., BTCUSDT, ETHUSDT)
   - Click "Connect" to start streaming live data
   - The system will automatically begin collecting tick data

2. **Configure Analytics**:
   - Select time frame (1s, 1m, 5m)
   - Choose regression type (OLS, Huber, Theil-Sen, Kalman)
   - Adjust rolling window size (10-100)

3. **Monitor Analytics**:
   - View real-time price charts for both symbols
   - Monitor spread and z-score charts
   - Check key statistics: hedge ratio, correlation, ADF test results
   - Watch for mean-reversion signals when |z-score| > 2

4. **Set Up Alerts**:
   - Click "Add Alert" in the Alert Manager
   - Configure alert type, condition, and threshold
   - Enable/disable alerts as needed
   - Receive toast notifications when alerts trigger

5. **Export Data**:
   - Export tick data, OHLC data, or analytics results as CSV
   - Use exported data for further analysis or backtesting

### Standalone WebSocket Collector

A standalone HTML tool is provided at `public/binance_browser_collector_save_test.html` for collecting and saving Binance tick data without running the full application.

Features:
- Direct WebSocket connection to Binance
- Real-time data display
- CSV download functionality
- LocalStorage persistence
- Statistics tracking (total ticks, data size, duration, tick rate)

## Analytics Methodology

### Hedge Ratio Calculation

The hedge ratio determines the optimal proportion of one asset to hold against another in a pairs trading strategy.

**OLS (Ordinary Least Squares)**:
- Linear regression: Y = β₀ + β₁X + ε
- Hedge ratio = β₁ (slope coefficient)
- Minimizes sum of squared residuals

**Huber Regression**:
- Robust regression method
- Less sensitive to outliers than OLS
- Uses weighted least squares with adaptive weights

**Theil-Sen Regression**:
- Non-parametric method
- Calculates median of slopes between all point pairs
- Highly robust to outliers

**Kalman Filter**:
- Dynamic estimation of time-varying hedge ratio
- Adapts to changing market conditions
- Optimal for non-stationary relationships

### Spread Calculation

Spread = Price₁ - (Hedge Ratio × Price₂)

The spread represents the deviation from the expected relationship between two assets.

### Z-Score Computation

Z-Score = (Spread - Mean(Spread)) / StdDev(Spread)

Calculated using a rolling window to capture recent market dynamics. Z-score indicates how many standard deviations the current spread is from its mean.

**Trading Signals**:
- |Z-score| > 2: Strong mean-reversion signal
- |Z-score| > 1: Moderate deviation
- |Z-score| < 1: Normal range

### ADF Test (Augmented Dickey-Fuller)

Tests for stationarity in the spread time series.

- **Null Hypothesis**: Spread has a unit root (non-stationary)
- **Alternative**: Spread is stationary
- **Interpretation**: Stationary spreads are suitable for mean-reversion strategies

### Rolling Correlation

Measures the linear relationship between two assets over a rolling window.

- Correlation = 1: Perfect positive correlation
- Correlation = -1: Perfect negative correlation
- Correlation = 0: No linear relationship

High correlation (> 0.7) is typically required for effective pairs trading.

## Performance Considerations

- **Real-time Analytics**: Updates every 500ms for tick-based metrics
- **Data Retention**: Keeps last 1000 ticks per symbol in memory
- **Storage**: Automatic cleanup of data older than 24 hours
- **Chart Rendering**: Downsamples to 100 points for smooth 60fps interaction
- **WebSocket**: Automatic reconnection with exponential backoff (max 5 attempts)

## Design System

The application uses a professional financial trading interface design:

- **Primary Colors**: Cyan (#00bcd4) for positive metrics and highlights
- **Secondary Colors**: Deep blue (#1a237e) for backgrounds
- **Destructive**: Coral red (#ff5252) for alerts and negative values
- **Success**: Green (#4caf50) for positive changes
- **Background**: Dark theme (#121212) to reduce eye strain
- **Typography**: Monospace for numerical data, sans-serif for labels

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (requires IndexedDB support)

## Limitations

- Requires active internet connection for WebSocket streaming
- Browser must support IndexedDB for data persistence
- Maximum 1000 ticks per symbol stored in memory
- Analytics require minimum 20 data points

## Troubleshooting

**WebSocket Connection Failed**:
- Check internet connection
- Verify symbol names are valid Binance trading pairs
- Check browser console for error messages

**No Analytics Data**:
- Ensure at least 20 ticks have been collected for each symbol
- Verify both symbols are connected and streaming

**Performance Issues**:
- Clear old data using "Clear All Data" button
- Reduce rolling window size
- Close other browser tabs

## Future Enhancements

- Support for additional exchanges (CME, Kraken, etc.)
- Advanced backtesting with transaction costs
- Portfolio optimization tools
- Machine learning-based signal generation
- Multi-pair correlation heatmaps
- Real-time P&L tracking

## License

2025 Real-Time Trading Analytics

## Support

For issues, questions, or feature requests, please refer to the project documentation or contact the development team.
