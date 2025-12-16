export interface TickData {
  timestamp: number;
  symbol: string;
  price: number;
  quantity: number;
}

export interface OHLCData {
  timestamp: number;
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SpreadData {
  timestamp: number;
  spread: number;
  hedgeRatio: number;
  zScore: number;
}

export interface AnalyticsResult {
  hedgeRatio: number;
  spread: number[];
  zScore: number[];
  correlation: number;
  adfStatistic?: number;
  adfPValue?: number;
  isStationary?: boolean;
}

export interface RegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
}

export interface Alert {
  id: string;
  type: 'z-score' | 'price' | 'volume';
  condition: 'above' | 'below' | 'crosses';
  threshold: number;
  symbol?: string;
  active: boolean;
  triggered: boolean;
  message: string;
  timestamp?: number;
}

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high24h: number;
  low24h: number;
}

export type TimeFrame = '1s' | '1m' | '5m';
export type RegressionType = 'ols' | 'huber' | 'theil-sen' | 'kalman';

export interface TradingState {
  symbols: string[];
  timeFrame: TimeFrame;
  rollingWindow: number;
  regressionType: RegressionType;
  tickData: Map<string, TickData[]>;
  ohlcData: Map<string, OHLCData[]>;
  spreadData: SpreadData[];
  analytics: AnalyticsResult | null;
  alerts: Alert[];
  isConnected: boolean;
}

export interface BacktestResult {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalPnL: number;
  sharpeRatio: number;
  maxDrawdown: number;
  trades: BacktestTrade[];
}

export interface BacktestTrade {
  entryTime: number;
  exitTime: number;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  zScoreEntry: number;
  zScoreExit: number;
}
