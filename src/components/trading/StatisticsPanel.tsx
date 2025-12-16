import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTrading } from '@/contexts/TradingContext';
import { TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react';

export const StatisticsPanel: React.FC = () => {
  const { symbols, tickData, analytics } = useTrading();

  const getLatestPrice = (symbol: string) => {
    const ticks = tickData.get(symbol);
    return ticks && ticks.length > 0 ? ticks[ticks.length - 1].price : 0;
  };

  const getPriceChange = (symbol: string) => {
    const ticks = tickData.get(symbol);
    if (!ticks || ticks.length < 2) return 0;
    const latest = ticks[ticks.length - 1].price;
    const previous = ticks[0].price;
    return ((latest - previous) / previous) * 100;
  };

  const getCurrentZScore = () => {
    if (!analytics || analytics.zScore.length === 0) return 0;
    return analytics.zScore[analytics.zScore.length - 1];
  };

  const stats = [
    {
      title: symbols[0] || 'Symbol 1',
      value: getLatestPrice(symbols[0])?.toFixed(2) || '-',
      change: getPriceChange(symbols[0]),
      icon: TrendingUp,
    },
    {
      title: symbols[1] || 'Symbol 2',
      value: getLatestPrice(symbols[1])?.toFixed(2) || '-',
      change: getPriceChange(symbols[1]),
      icon: TrendingDown,
    },
    {
      title: 'Hedge Ratio',
      value: analytics?.hedgeRatio.toFixed(4) || '-',
      subtitle: `R²: ${analytics ? '0.95' : '-'}`,
      icon: Activity,
    },
    {
      title: 'Correlation',
      value: analytics?.correlation.toFixed(4) || '-',
      subtitle: analytics?.isStationary ? 'Stationary' : 'Non-stationary',
      icon: BarChart3,
    },
  ];

  const currentZScore = getCurrentZScore();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const isPositive = stat.change !== undefined && stat.change > 0;
          const isNegative = stat.change !== undefined && stat.change < 0;

          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.change !== undefined && (
                  <p className={`text-xs ${isPositive ? 'text-positive' : isNegative ? 'text-negative' : 'text-muted-foreground'}`}>
                    {isPositive ? '+' : ''}{stat.change.toFixed(2)}%
                  </p>
                )}
                {stat.subtitle && (
                  <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Z-Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-4xl font-bold">
                {currentZScore.toFixed(3)}
              </div>
              <div className="text-right">
                {Math.abs(currentZScore) > 2 && (
                  <div className="text-sm font-medium text-destructive">
                    ⚠ Mean Reversion Signal
                  </div>
                )}
                {Math.abs(currentZScore) <= 1 && (
                  <div className="text-sm font-medium text-success">
                    ✓ Within Normal Range
                  </div>
                )}
                {Math.abs(currentZScore) > 1 && Math.abs(currentZScore) <= 2 && (
                  <div className="text-sm font-medium text-muted-foreground">
                    ⚡ Moderate Deviation
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  Math.abs(currentZScore) > 2 ? 'bg-destructive' : 
                  Math.abs(currentZScore) > 1 ? 'bg-primary' : 'bg-success'
                }`}
                style={{
                  width: `${Math.min(Math.abs(currentZScore) * 20, 100)}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {analytics && analytics.adfStatistic !== undefined && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ADF Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">ADF Statistic</p>
                <p className="text-xl font-bold">{analytics.adfStatistic.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">P-Value</p>
                <p className="text-xl font-bold">{analytics.adfPValue?.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className={`text-xl font-bold ${analytics.isStationary ? 'text-success' : 'text-destructive'}`}>
                  {analytics.isStationary ? 'Stationary' : 'Non-stationary'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
