import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useTrading } from '@/contexts/TradingContext';

export const SpreadChart: React.FC = () => {
  const { analytics } = useTrading();

  const chartData = useMemo(() => {
    if (!analytics || analytics.spread.length === 0) return [];

    const data = [];
    const maxPoints = 100;
    const step = Math.max(1, Math.floor(analytics.spread.length / maxPoints));

    for (let i = 0; i < analytics.spread.length; i += step) {
      data.push({
        index: i,
        spread: analytics.spread[i],
        zScore: analytics.zScore[i],
      });
    }

    return data;
  }, [analytics]);

  if (!analytics) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Spread & Z-Score</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">Waiting for analytics data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Spread & Z-Score</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="index" stroke="hsl(var(--muted-foreground))" />
            <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" />
            <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
            <Legend />
            <ReferenceLine yAxisId="right" y={2} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
            <ReferenceLine yAxisId="right" y={-2} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
            <ReferenceLine yAxisId="right" y={0} stroke="hsl(var(--muted-foreground))" />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="spread"
              stroke="hsl(var(--chart-1))"
              dot={false}
              strokeWidth={2}
              name="Spread"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="zScore"
              stroke="hsl(var(--chart-3))"
              dot={false}
              strokeWidth={2}
              name="Z-Score"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
