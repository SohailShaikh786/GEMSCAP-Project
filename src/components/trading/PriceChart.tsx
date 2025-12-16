import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTrading } from '@/contexts/TradingContext';

export const PriceChart: React.FC = () => {
  const { symbols, tickData } = useTrading();

  const chartData = useMemo(() => {
    if (symbols.length === 0) return [];

    const [symbol1, symbol2] = symbols;
    const ticks1 = tickData.get(symbol1) || [];
    const ticks2 = tickData.get(symbol2) || [];

    const minLength = Math.min(ticks1.length, ticks2.length);
    if (minLength === 0) return [];

    const data = [];
    const maxPoints = 100;
    const step = Math.max(1, Math.floor(minLength / maxPoints));

    for (let i = 0; i < minLength; i += step) {
      const tick1 = ticks1[i];
      const tick2 = ticks2[i];
      
      data.push({
        index: i,
        time: new Date(tick1.timestamp).toLocaleTimeString(),
        [symbol1]: tick1.price,
        [symbol2]: tick2.price,
      });
    }

    return data;
  }, [symbols, tickData]);

  if (symbols.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Price Chart</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">Connect to symbols to view price data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Price Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey={symbols[0]}
              stroke="hsl(var(--chart-1))"
              dot={false}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey={symbols[1]}
              stroke="hsl(var(--chart-2))"
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
