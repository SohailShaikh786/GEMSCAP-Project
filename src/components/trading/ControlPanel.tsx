import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Play, Square, Trash2 } from 'lucide-react';
import { useTrading } from '@/contexts/TradingContext';
import type { TimeFrame, RegressionType } from '@/types/trading';

export const ControlPanel: React.FC = () => {
  const {
    symbols,
    isConnected,
    timeFrame,
    rollingWindow,
    regressionType,
    connectSymbols,
    disconnect,
    setTimeFrame,
    setRollingWindow,
    setRegressionType,
    clearData,
  } = useTrading();

  const [symbol1, setSymbol1] = useState('BTCUSDT');
  const [symbol2, setSymbol2] = useState('ETHUSDT');

  const handleConnect = () => {
    if (symbol1 && symbol2) {
      connectSymbols([symbol1.toUpperCase(), symbol2.toUpperCase()]);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Control Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="symbol1">Symbol 1</Label>
            <Input
              id="symbol1"
              value={symbol1}
              onChange={(e) => setSymbol1(e.target.value.toUpperCase())}
              placeholder="BTCUSDT"
              disabled={isConnected}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="symbol2">Symbol 2</Label>
            <Input
              id="symbol2"
              value={symbol2}
              onChange={(e) => setSymbol2(e.target.value.toUpperCase())}
              placeholder="ETHUSDT"
              disabled={isConnected}
            />
          </div>

          <div className="flex gap-2">
            {!isConnected ? (
              <Button onClick={handleConnect} className="flex-1">
                <Play className="w-4 h-4 mr-2" />
                Connect
              </Button>
            ) : (
              <Button onClick={handleDisconnect} variant="destructive" className="flex-1">
                <Square className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            )}
          </div>

          {isConnected && symbols.length > 0 && (
            <div className="p-3 bg-success/10 border border-success rounded-md">
              <p className="text-sm text-success-foreground">
                Connected: {symbols.join(' / ')}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4 pt-4 border-t border-border">
          <div className="space-y-2">
            <Label>Time Frame</Label>
            <Select value={timeFrame} onValueChange={(value) => setTimeFrame(value as TimeFrame)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1s">1 Second</SelectItem>
                <SelectItem value="1m">1 Minute</SelectItem>
                <SelectItem value="5m">5 Minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Regression Type</Label>
            <Select value={regressionType} onValueChange={(value) => setRegressionType(value as RegressionType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ols">OLS</SelectItem>
                <SelectItem value="huber">Huber</SelectItem>
                <SelectItem value="theil-sen">Theil-Sen</SelectItem>
                <SelectItem value="kalman">Kalman Filter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Rolling Window: {rollingWindow}</Label>
            <Slider
              value={[rollingWindow]}
              onValueChange={(value) => setRollingWindow(value[0])}
              min={10}
              max={100}
              step={5}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <Button onClick={clearData} variant="outline" className="w-full">
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
