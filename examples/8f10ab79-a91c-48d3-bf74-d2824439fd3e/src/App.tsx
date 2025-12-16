import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, Search, TrendingUp } from 'lucide-react';
import type { StockData, HistoricalData } from './types.ts';
import { formatNumber, downloadCSV } from './utils.ts';

// Mock data for demonstration
const DEMO_STOCKS = {
  AAPL: {
    regularMarketPrice: 173.50,
    regularMarketChange: 2.30,
    regularMarketChangePercent: 1.34,
    marketCap: 2750000000000,
    fiftyTwoWeekHigh: 180.50,
    fiftyTwoWeekLow: 124.17,
    regularMarketVolume: 75000000
  },
  GOOGL: {
    regularMarketPrice: 141.80,
    regularMarketChange: -0.50,
    regularMarketChangePercent: -0.35,
    marketCap: 1790000000000,
    fiftyTwoWeekHigh: 146.52,
    fiftyTwoWeekLow: 84.86,
    regularMarketVolume: 25000000
  },
  MSFT: {
    regularMarketPrice: 420.45,
    regularMarketChange: 5.20,
    regularMarketChangePercent: 1.25,
    marketCap: 3120000000000,
    fiftyTwoWeekHigh: 425.35,
    fiftyTwoWeekLow: 245.61,
    regularMarketVolume: 28000000
  }
};

function generateMockHistoricalData(basePrice: number): HistoricalData[] {
  const data: HistoricalData[] = [];
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6);

  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const randomChange = (Math.random() - 0.5) * 5;
    const close = basePrice + randomChange;
    data.push({
      date: date.toISOString().split('T')[0],
      close: Number(close.toFixed(2)),
      volume: Math.floor(Math.random() * 10000000) + 5000000
    });
  }

  return data;
}

function App() {
  const [symbol, setSymbol] = useState<string>('');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const fetchStockData = async () => {
    if (!symbol) {
      setError('请输入股票代码');
      return;
    }
    
    setLoading(true);
    setError('');
    setStockData(null);
    setHistoricalData([]);
    
    try {
      const upperSymbol = symbol.toUpperCase();
      const mockData = DEMO_STOCKS[upperSymbol as keyof typeof DEMO_STOCKS];
      
      if (!mockData) {
        throw new Error('无效的股票代码。目前支持: AAPL, GOOGL, MSFT');
      }

      setStockData({
        symbol: upperSymbol,
        ...mockData
      });

      const mockHistoricalData = generateMockHistoricalData(mockData.regularMarketPrice);
      setHistoricalData(mockHistoricalData);
    } catch (err) {
      console.error('Error fetching stock data:', err);
      setError(err instanceof Error ? err.message : '无法获取股票数据。请检查股票代码是否正确。');
      setStockData(null);
      setHistoricalData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!historicalData.length) return;
    downloadCSV(historicalData, `${symbol}_historical_data.csv`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStockData();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-8 h-8" />
            股票数据分析
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSubmit} className="flex gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="输入股票代码 (例如: AAPL, GOOGL, MSFT)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>加载中...</span>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  查询
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {stockData && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm text-gray-500 mb-1">当前价格</h3>
                  <p className="text-2xl font-bold">${stockData.regularMarketPrice.toFixed(2)}</p>
                  <span className={`text-sm ${stockData.regularMarketChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stockData.regularMarketChange.toFixed(2)} ({stockData.regularMarketChangePercent.toFixed(2)}%)
                  </span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm text-gray-500 mb-1">市值</h3>
                  <p className="text-2xl font-bold">${formatNumber(stockData.marketCap)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm text-gray-500 mb-1">52周区间</h3>
                  <p className="text-2xl font-bold">${stockData.fiftyTwoWeekLow.toFixed(2)} - ${stockData.fiftyTwoWeekHigh.toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm text-gray-500 mb-1">成交量</h3>
                  <p className="text-2xl font-bold">{formatNumber(stockData.regularMarketVolume)}</p>
                </div>
              </div>

              {historicalData.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">价格走势</h2>
                    <button
                      onClick={handleDownloadCSV}
                      className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      下载CSV
                    </button>
                  </div>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={historicalData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={['auto', 'auto']} />
                        <Tooltip />
                        <Line type="monotone" dataKey="close" stroke="#2563eb" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;