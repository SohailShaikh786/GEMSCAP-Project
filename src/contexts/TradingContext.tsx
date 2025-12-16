import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { TradingState, TickData, OHLCData, TimeFrame, RegressionType, Alert, AnalyticsResult } from '@/types/trading';
import { binanceWS } from '@/services/websocket';
import { storage } from '@/services/storage';
import { AnalyticsEngine } from '@/services/analytics';
import { useToast } from '@/hooks/use-toast';

interface TradingContextType extends TradingState {
  connectSymbols: (symbols: string[]) => void;
  disconnect: () => void;
  setTimeFrame: (timeFrame: TimeFrame) => void;
  setRollingWindow: (window: number) => void;
  setRegressionType: (type: RegressionType) => void;
  addAlert: (alert: Omit<Alert, 'id'>) => void;
  removeAlert: (id: string) => void;
  toggleAlert: (id: string) => void;
  clearData: () => void;
  uploadOHLCData: (data: OHLCData[]) => Promise<void>;
  exportData: (type: 'ticks' | 'ohlc' | 'analytics') => void;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export const TradingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [state, setState] = useState<TradingState>({
    symbols: [],
    timeFrame: '1m',
    rollingWindow: 20,
    regressionType: 'ols',
    tickData: new Map(),
    ohlcData: new Map(),
    spreadData: [],
    analytics: null,
    alerts: [],
    isConnected: false,
  });

  useEffect(() => {
    storage.init().catch(error => {
      console.error('Failed to initialize storage:', error);
      toast({
        title: 'Storage Error',
        description: 'Failed to initialize local storage',
        variant: 'destructive',
      });
    });
  }, [toast]);

  const connectSymbols = useCallback((symbols: string[]) => {
    if (symbols.length === 0) return;

    binanceWS.disconnect();
    binanceWS.connect(symbols);

    setState(prev => ({
      ...prev,
      symbols,
      isConnected: true,
      tickData: new Map(),
      ohlcData: new Map(),
    }));

    toast({
      title: 'Connected',
      description: `Connected to ${symbols.join(', ')}`,
    });
  }, [toast]);

  const disconnect = useCallback(() => {
    binanceWS.disconnect();
    setState(prev => ({ ...prev, isConnected: false }));
    toast({
      title: 'Disconnected',
      description: 'WebSocket connection closed',
    });
  }, [toast]);

  useEffect(() => {
    const unsubscribe = binanceWS.subscribe((tick: TickData) => {
      setState(prev => {
        const symbolTicks = prev.tickData.get(tick.symbol) || [];
        const updatedTicks = [...symbolTicks, tick].slice(-1000);

        const newTickData = new Map(prev.tickData);
        newTickData.set(tick.symbol, updatedTicks);

        storage.saveTick(tick).catch(console.error);

        return {
          ...prev,
          tickData: newTickData,
        };
      });
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (state.symbols.length !== 2) return;

    const interval = setInterval(() => {
      const [symbol1, symbol2] = state.symbols;
      const ticks1 = state.tickData.get(symbol1) || [];
      const ticks2 = state.tickData.get(symbol2) || [];

      if (ticks1.length < 20 || ticks2.length < 20) return;

      const minLength = Math.min(ticks1.length, ticks2.length);
      const prices1 = ticks1.slice(-minLength).map(t => t.price);
      const prices2 = ticks2.slice(-minLength).map(t => t.price);

      try {
        let hedgeRatio: number;

        if (state.regressionType === 'ols') {
          const regression = AnalyticsEngine.calculateOLS(prices2, prices1);
          hedgeRatio = regression.slope;
        } else if (state.regressionType === 'huber') {
          const regression = AnalyticsEngine.calculateHuberRegression(prices2, prices1);
          hedgeRatio = regression.slope;
        } else if (state.regressionType === 'theil-sen') {
          const regression = AnalyticsEngine.calculateTheilSenRegression(prices2, prices1);
          hedgeRatio = regression.slope;
        } else {
          hedgeRatio = 1;
        }

        const spread = AnalyticsEngine.calculateSpread(prices1, prices2, hedgeRatio);
        const zScore = AnalyticsEngine.calculateZScore(spread, state.rollingWindow);
        const correlation = AnalyticsEngine.calculateCorrelation(prices1, prices2);

        const analytics: AnalyticsResult = {
          hedgeRatio,
          spread,
          zScore,
          correlation,
        };

        if (spread.length > 30) {
          const adf = AnalyticsEngine.calculateADF(spread);
          analytics.adfStatistic = adf.statistic;
          analytics.adfPValue = adf.pValue;
          analytics.isStationary = adf.isStationary;
        }

        setState(prev => ({ ...prev, analytics }));

        state.alerts.forEach(alert => {
          if (!alert.active || alert.triggered) return;

          const currentZScore = zScore[zScore.length - 1];
          let shouldTrigger = false;

          if (alert.type === 'z-score') {
            if (alert.condition === 'above' && currentZScore > alert.threshold) {
              shouldTrigger = true;
            } else if (alert.condition === 'below' && currentZScore < alert.threshold) {
              shouldTrigger = true;
            }
          }

          if (shouldTrigger) {
            toast({
              title: 'Alert Triggered',
              description: alert.message,
              variant: 'default',
            });

            setState(prev => ({
              ...prev,
              alerts: prev.alerts.map(a =>
                a.id === alert.id ? { ...a, triggered: true, timestamp: Date.now() } : a
              ),
            }));
          }
        });
      } catch (error) {
        console.error('Analytics calculation error:', error);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [state.symbols, state.tickData, state.rollingWindow, state.regressionType, state.alerts, toast]);

  const setTimeFrame = useCallback((timeFrame: TimeFrame) => {
    setState(prev => ({ ...prev, timeFrame }));
  }, []);

  const setRollingWindow = useCallback((window: number) => {
    setState(prev => ({ ...prev, rollingWindow: window }));
  }, []);

  const setRegressionType = useCallback((type: RegressionType) => {
    setState(prev => ({ ...prev, regressionType: type }));
  }, []);

  const addAlert = useCallback((alert: Omit<Alert, 'id'>) => {
    const newAlert: Alert = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random()}`,
    };
    setState(prev => ({ ...prev, alerts: [...prev.alerts, newAlert] }));
    toast({
      title: 'Alert Added',
      description: alert.message,
    });
  }, [toast]);

  const removeAlert = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.filter(a => a.id !== id),
    }));
  }, []);

  const toggleAlert = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.map(a =>
        a.id === id ? { ...a, active: !a.active, triggered: false } : a
      ),
    }));
  }, []);

  const clearData = useCallback(async () => {
    await storage.clearAll();
    setState(prev => ({
      ...prev,
      tickData: new Map(),
      ohlcData: new Map(),
      spreadData: [],
      analytics: null,
    }));
    toast({
      title: 'Data Cleared',
      description: 'All stored data has been cleared',
    });
  }, [toast]);

  const uploadOHLCData = useCallback(async (data: OHLCData[]) => {
    await storage.saveOHLCBatch(data);
    
    const ohlcMap = new Map<string, OHLCData[]>();
    for (const ohlc of data) {
      const existing = ohlcMap.get(ohlc.symbol) || [];
      ohlcMap.set(ohlc.symbol, [...existing, ohlc]);
    }

    setState(prev => ({ ...prev, ohlcData: ohlcMap }));
    toast({
      title: 'Data Uploaded',
      description: `Uploaded ${data.length} OHLC records`,
    });
  }, [toast]);

  const exportData = useCallback((type: 'ticks' | 'ohlc' | 'analytics') => {
    let csvContent = '';
    let filename = '';

    if (type === 'ticks') {
      csvContent = 'Symbol,Timestamp,Price,Quantity\n';
      state.tickData.forEach((ticks, symbol) => {
        ticks.forEach(tick => {
          csvContent += `${symbol},${tick.timestamp},${tick.price},${tick.quantity}\n`;
        });
      });
      filename = 'tick_data.csv';
    } else if (type === 'ohlc') {
      csvContent = 'Symbol,Timestamp,Open,High,Low,Close,Volume\n';
      state.ohlcData.forEach((ohlcs, symbol) => {
        ohlcs.forEach(ohlc => {
          csvContent += `${symbol},${ohlc.timestamp},${ohlc.open},${ohlc.high},${ohlc.low},${ohlc.close},${ohlc.volume}\n`;
        });
      });
      filename = 'ohlc_data.csv';
    } else if (type === 'analytics' && state.analytics) {
      csvContent = 'Metric,Value\n';
      csvContent += `Hedge Ratio,${state.analytics.hedgeRatio}\n`;
      csvContent += `Correlation,${state.analytics.correlation}\n`;
      if (state.analytics.adfStatistic !== undefined) {
        csvContent += `ADF Statistic,${state.analytics.adfStatistic}\n`;
        csvContent += `ADF P-Value,${state.analytics.adfPValue}\n`;
        csvContent += `Is Stationary,${state.analytics.isStationary}\n`;
      }
      filename = 'analytics.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Data Exported',
      description: `Exported ${filename}`,
    });
  }, [state, toast]);

  return (
    <TradingContext.Provider
      value={{
        ...state,
        connectSymbols,
        disconnect,
        setTimeFrame,
        setRollingWindow,
        setRegressionType,
        addAlert,
        removeAlert,
        toggleAlert,
        clearData,
        uploadOHLCData,
        exportData,
      }}
    >
      {children}
    </TradingContext.Provider>
  );
};

export const useTrading = () => {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error('useTrading must be used within TradingProvider');
  }
  return context;
};
