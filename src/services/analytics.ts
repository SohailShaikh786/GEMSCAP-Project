import type { OHLCData, RegressionResult, AnalyticsResult, BacktestResult, BacktestTrade } from '@/types/trading';

export class AnalyticsEngine {
  static calculateOLS(x: number[], y: number[]): RegressionResult {
    if (x.length !== y.length || x.length === 0) {
      throw new Error('Invalid input arrays for OLS regression');
    }

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const yMean = sumY / n;
    const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const ssResidual = y.reduce((sum, yi, i) => {
      const predicted = slope * x[i] + intercept;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);
    const rSquared = 1 - ssResidual / ssTotal;

    return { slope, intercept, rSquared };
  }

  static calculateSpread(prices1: number[], prices2: number[], hedgeRatio: number): number[] {
    return prices1.map((p1, i) => p1 - hedgeRatio * prices2[i]);
  }

  static calculateZScore(values: number[], window?: number): number[] {
    if (values.length === 0) return [];

    const zScores: number[] = [];
    const effectiveWindow = window || values.length;

    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - effectiveWindow + 1);
      const windowValues = values.slice(start, i + 1);

      const mean = windowValues.reduce((a, b) => a + b, 0) / windowValues.length;
      const variance = windowValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / windowValues.length;
      const std = Math.sqrt(variance);

      zScores.push(std === 0 ? 0 : (values[i] - mean) / std);
    }

    return zScores;
  }

  static calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  static calculateRollingCorrelation(x: number[], y: number[], window: number): number[] {
    const correlations: number[] = [];

    for (let i = window - 1; i < x.length; i++) {
      const xWindow = x.slice(i - window + 1, i + 1);
      const yWindow = y.slice(i - window + 1, i + 1);
      correlations.push(this.calculateCorrelation(xWindow, yWindow));
    }

    return correlations;
  }

  static calculateADF(values: number[], maxLag: number = 1): { statistic: number; pValue: number; isStationary: boolean } {
    if (values.length < maxLag + 2) {
      return { statistic: 0, pValue: 1, isStationary: false };
    }

    const diffs = values.slice(1).map((val, i) => val - values[i]);
    const lagged = values.slice(0, -1);

    const regression = this.calculateOLS(lagged, diffs);
    const n = diffs.length;
    const residuals = diffs.map((d, i) => d - (regression.slope * lagged[i] + regression.intercept));
    const variance = residuals.reduce((sum, r) => sum + r * r, 0) / (n - 2);
    const seSlope = Math.sqrt(variance / lagged.reduce((sum, l) => sum + Math.pow(l - lagged.reduce((a, b) => a + b, 0) / n, 2), 0));

    const tStatistic = regression.slope / seSlope;

    const criticalValues = [-3.43, -2.86, -2.57];
    const isStationary = tStatistic < criticalValues[2];
    const pValue = isStationary ? 0.01 : 0.1;

    return { statistic: tStatistic, pValue, isStationary };
  }

  static calculateHuberRegression(x: number[], y: number[], delta: number = 1.35): RegressionResult {
    let { slope, intercept } = this.calculateOLS(x, y);

    for (let iter = 0; iter < 10; iter++) {
      const residuals = y.map((yi, i) => yi - (slope * x[i] + intercept));
      const weights = residuals.map(r => {
        const absR = Math.abs(r);
        return absR <= delta ? 1 : delta / absR;
      });

      const sumW = weights.reduce((a, b) => a + b, 0);
      const sumWX = weights.reduce((sum, w, i) => sum + w * x[i], 0);
      const sumWY = weights.reduce((sum, w, i) => sum + w * y[i], 0);
      const sumWXY = weights.reduce((sum, w, i) => sum + w * x[i] * y[i], 0);
      const sumWXX = weights.reduce((sum, w, i) => sum + w * x[i] * x[i], 0);

      slope = (sumW * sumWXY - sumWX * sumWY) / (sumW * sumWXX - sumWX * sumWX);
      intercept = (sumWY - slope * sumWX) / sumW;
    }

    const yMean = y.reduce((a, b) => a + b, 0) / y.length;
    const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const ssResidual = y.reduce((sum, yi, i) => sum + Math.pow(yi - (slope * x[i] + intercept), 2), 0);
    const rSquared = 1 - ssResidual / ssTotal;

    return { slope, intercept, rSquared };
  }

  static calculateTheilSenRegression(x: number[], y: number[]): RegressionResult {
    const slopes: number[] = [];

    for (let i = 0; i < x.length; i++) {
      for (let j = i + 1; j < x.length; j++) {
        if (x[j] !== x[i]) {
          slopes.push((y[j] - y[i]) / (x[j] - x[i]));
        }
      }
    }

    slopes.sort((a, b) => a - b);
    const slope = slopes[Math.floor(slopes.length / 2)];

    const intercepts = y.map((yi, i) => yi - slope * x[i]);
    intercepts.sort((a, b) => a - b);
    const intercept = intercepts[Math.floor(intercepts.length / 2)];

    const yMean = y.reduce((a, b) => a + b, 0) / y.length;
    const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const ssResidual = y.reduce((sum, yi, i) => sum + Math.pow(yi - (slope * x[i] + intercept), 2), 0);
    const rSquared = 1 - ssResidual / ssTotal;

    return { slope, intercept, rSquared };
  }

  static runBacktest(
    spread: number[],
    zScores: number[],
    prices1: number[],
    prices2: number[],
    hedgeRatio: number,
    entryThreshold: number = 2,
    exitThreshold: number = 0
  ): BacktestResult {
    const trades: BacktestTrade[] = [];
    let position: 'long' | 'short' | null = null;
    let entryIndex = 0;

    for (let i = 1; i < zScores.length; i++) {
      if (position === null) {
        if (zScores[i] > entryThreshold) {
          position = 'short';
          entryIndex = i;
        } else if (zScores[i] < -entryThreshold) {
          position = 'long';
          entryIndex = i;
        }
      } else {
        const shouldExit =
          (position === 'short' && zScores[i] < exitThreshold) ||
          (position === 'long' && zScores[i] > -exitThreshold);

        if (shouldExit) {
          const entrySpread = spread[entryIndex];
          const exitSpread = spread[i];
          const pnl = position === 'short' ? entrySpread - exitSpread : exitSpread - entrySpread;

          trades.push({
            entryTime: entryIndex,
            exitTime: i,
            entryPrice: entrySpread,
            exitPrice: exitSpread,
            pnl,
            zScoreEntry: zScores[entryIndex],
            zScoreExit: zScores[i],
          });

          position = null;
        }
      }
    }

    const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
    const winningTrades = trades.filter(t => t.pnl > 0).length;
    const losingTrades = trades.filter(t => t.pnl <= 0).length;

    const returns = trades.map(t => t.pnl);
    const meanReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const stdReturn = returns.length > 0
      ? Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length)
      : 0;
    const sharpeRatio = stdReturn > 0 ? meanReturn / stdReturn : 0;

    let maxDrawdown = 0;
    let peak = 0;
    let cumPnL = 0;
    for (const trade of trades) {
      cumPnL += trade.pnl;
      if (cumPnL > peak) peak = cumPnL;
      const drawdown = peak - cumPnL;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    return {
      totalTrades: trades.length,
      winningTrades,
      losingTrades,
      totalPnL,
      sharpeRatio,
      maxDrawdown,
      trades,
    };
  }

  static aggregateToOHLC(ticks: { timestamp: number; price: number; quantity: number }[], interval: number): OHLCData[] {
    if (ticks.length === 0) return [];

    const ohlcMap = new Map<number, OHLCData>();

    for (const tick of ticks) {
      const bucketTime = Math.floor(tick.timestamp / interval) * interval;

      if (!ohlcMap.has(bucketTime)) {
        ohlcMap.set(bucketTime, {
          timestamp: bucketTime,
          symbol: '',
          open: tick.price,
          high: tick.price,
          low: tick.price,
          close: tick.price,
          volume: tick.quantity,
        });
      } else {
        const ohlc = ohlcMap.get(bucketTime)!;
        ohlc.high = Math.max(ohlc.high, tick.price);
        ohlc.low = Math.min(ohlc.low, tick.price);
        ohlc.close = tick.price;
        ohlc.volume += tick.quantity;
      }
    }

    return Array.from(ohlcMap.values()).sort((a, b) => a.timestamp - b.timestamp);
  }
}

export class KalmanFilter {
  private x: number;
  private p: number;
  private q: number;
  private r: number;

  constructor(initialEstimate: number = 0, initialError: number = 1, processNoise: number = 0.001, measurementNoise: number = 0.1) {
    this.x = initialEstimate;
    this.p = initialError;
    this.q = processNoise;
    this.r = measurementNoise;
  }

  update(measurement: number): number {
    this.p = this.p + this.q;
    const k = this.p / (this.p + this.r);
    this.x = this.x + k * (measurement - this.x);
    this.p = (1 - k) * this.p;
    return this.x;
  }

  getEstimate(): number {
    return this.x;
  }
}
