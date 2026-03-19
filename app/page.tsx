'use client';

import { useState, useEffect } from 'react';
import DashboardHeader from '@/components/DashboardHeader';
import MetricsCards from '@/components/MetricsCards';
import TradesTable from '@/components/TradesTable';
import ChartsSection from '@/components/ChartsSection';
import FiltersPanel from '@/components/FiltersPanel';
import { tradingService } from '@/services/tradingService';
import { TradingSignal, TradeResult, MatchedTrade, FilterOptions } from '@/types/trading';

export default function Home() {
  const [tradingSignals, setTradingSignals] = useState<TradingSignal[]>([]);
  const [tradeResults, setTradeResults] = useState<TradeResult[]>([]);
  const [matchedTrades, setMatchedTrades] = useState<MatchedTrade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<MatchedTrade[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    symbol: 'ALL',
    startDate: null,
    endDate: null,
    status: 'ALL'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [signals, results] = await Promise.all([
          tradingService.getTradingSignals(),
          tradingService.getTradeResults()
        ]);

        setTradingSignals(signals);
        setTradeResults(results);

        const matched = tradingService.matchTradesWithSignals(signals, results);
        setMatchedTrades(matched);
        setFilteredTrades(matched);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Không thể tải dữ liệu giao dịch. Vui lòng kiểm tra kết nối Firebase của bạn.');
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Set up real-time listeners
    const unsubscribeSignals = tradingService.subscribeToTradingSignals((signals) => {
      setTradingSignals(signals);
      const matched = tradingService.matchTradesWithSignals(signals, tradeResults);
      setMatchedTrades(matched);
      setFilteredTrades(tradingService.filterTrades(matched, filters));
    });

    const unsubscribeResults = tradingService.subscribeToTradeResults((results) => {
      setTradeResults(results);
      const matched = tradingService.matchTradesWithSignals(tradingSignals, results);
      setMatchedTrades(matched);
      setFilteredTrades(tradingService.filterTrades(matched, filters));
    });

    // Cleanup subscriptions
    return () => {
      unsubscribeSignals();
      unsubscribeResults();
    };
  }, []);

  // Apply filters when they change
  useEffect(() => {
    const filtered = tradingService.filterTrades(matchedTrades, filters);
    setFilteredTrades(filtered);
  }, [filters, matchedTrades]);

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handleAnalyzePerformance = async () => {
    // This would call an AI API in a real implementation
    alert('Tính năng phân tích AI sẽ được triển khai ở đây. Điều này sẽ gọi API Gemini để phân tích hiệu suất giao dịch.');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải bảng điều khiển giao dịch...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Lỗi Kết Nối</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">
            Đảm bảo cấu hình Firebase của bạn chính xác trong <code>lib/firebase/config.ts</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        onAnalyzePerformance={handleAnalyzePerformance}
        totalTrades={matchedTrades.length}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Panel */}
          <div className="lg:col-span-1">
            <FiltersPanel
              filters={filters}
              onFilterChange={handleFilterChange}
              symbols={Array.from(new Set(matchedTrades.map(trade => trade.symbol)))}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <MetricsCards trades={filteredTrades} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2">
                <TradesTable trades={filteredTrades} />
              </div>

              <div className="lg:col-span-2">
                <ChartsSection trades={filteredTrades} />
              </div>
            </div>
          </div>
        </div>

        {/* Data Summary */}
        <div className="mt-8 p-4 bg-white rounded-lg shadow">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">Tín Hiệu Giao Dịch</p>
              <p className="text-2xl font-semibold">{tradingSignals.length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Kết Quả Giao Dịch</p>
              <p className="text-2xl font-semibold">{tradeResults.length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Giao Dịch Đã Khớp</p>
              <p className="text-2xl font-semibold">{matchedTrades.length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Giao Dịch Đã Lọc</p>
              <p className="text-2xl font-semibold">{filteredTrades.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}