import React from 'react';
import { ControlPanel } from '@/components/trading/ControlPanel';
import { PriceChart } from '@/components/trading/PriceChart';
import { SpreadChart } from '@/components/trading/SpreadChart';
import { StatisticsPanel } from '@/components/trading/StatisticsPanel';
import { AlertManager } from '@/components/trading/AlertManager';
import { DataExport } from '@/components/trading/DataExport';
import { Activity } from 'lucide-react';

export const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-background p-4 2xl:p-6">
      <div className="max-w-[1920px] mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Real-Time Trading Analytics</h1>
        </div>

        <div className="grid grid-cols-1 2xl:grid-cols-12 gap-6">
          <div className="2xl:col-span-3 space-y-6">
            <ControlPanel />
            <AlertManager />
            <DataExport />
          </div>

          <div className="2xl:col-span-9 space-y-6">
            <StatisticsPanel />
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <PriceChart />
              <SpreadChart />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
