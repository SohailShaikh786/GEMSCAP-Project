import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useTrading } from '@/contexts/TradingContext';

export const DataExport: React.FC = () => {
  const { exportData, tickData, ohlcData, analytics } = useTrading();

  const hasTickData = Array.from(tickData.values()).some(ticks => ticks.length > 0);
  const hasOHLCData = Array.from(ohlcData.values()).some(ohlcs => ohlcs.length > 0);
  const hasAnalytics = analytics !== null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Export Data</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          onClick={() => exportData('ticks')}
          disabled={!hasTickData}
          variant="outline"
          className="w-full justify-start"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Tick Data (CSV)
        </Button>
        <Button
          onClick={() => exportData('ohlc')}
          disabled={!hasOHLCData}
          variant="outline"
          className="w-full justify-start"
        >
          <Download className="w-4 h-4 mr-2" />
          Export OHLC Data (CSV)
        </Button>
        <Button
          onClick={() => exportData('analytics')}
          disabled={!hasAnalytics}
          variant="outline"
          className="w-full justify-start"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Analytics (CSV)
        </Button>
      </CardContent>
    </Card>
  );
};
