import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Bell, Plus, Trash2 } from 'lucide-react';
import { useTrading } from '@/contexts/TradingContext';
import type { Alert } from '@/types/trading';

export const AlertManager: React.FC = () => {
  const { alerts, addAlert, removeAlert, toggleAlert } = useTrading();
  const [showForm, setShowForm] = useState(false);
  const [alertType, setAlertType] = useState<'z-score' | 'price' | 'volume'>('z-score');
  const [condition, setCondition] = useState<'above' | 'below' | 'crosses'>('above');
  const [threshold, setThreshold] = useState('2');

  const handleAddAlert = () => {
    const newAlert: Omit<Alert, 'id'> = {
      type: alertType,
      condition,
      threshold: parseFloat(threshold),
      active: true,
      triggered: false,
      message: `${alertType} ${condition} ${threshold}`,
    };

    addAlert(newAlert);
    setShowForm(false);
    setThreshold('2');
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg">Alerts</CardTitle>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Alert
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="p-4 border border-border rounded-lg space-y-4">
            <div className="space-y-2">
              <Label>Alert Type</Label>
              <Select value={alertType} onValueChange={(value: any) => setAlertType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="z-score">Z-Score</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="volume">Volume</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Condition</Label>
              <Select value={condition} onValueChange={(value: any) => setCondition(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="above">Above</SelectItem>
                  <SelectItem value="below">Below</SelectItem>
                  <SelectItem value="crosses">Crosses</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Threshold</Label>
              <Input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                step="0.1"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddAlert} className="flex-1">
                Create Alert
              </Button>
              <Button onClick={() => setShowForm(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No alerts configured</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 border rounded-lg flex items-center justify-between ${
                  alert.triggered ? 'border-destructive bg-destructive/10' : 'border-border'
                }`}
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{alert.message}</p>
                  {alert.triggered && alert.timestamp && (
                    <p className="text-xs text-muted-foreground">
                      Triggered at {new Date(alert.timestamp).toLocaleTimeString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={alert.active}
                    onCheckedChange={() => toggleAlert(alert.id)}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeAlert(alert.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
