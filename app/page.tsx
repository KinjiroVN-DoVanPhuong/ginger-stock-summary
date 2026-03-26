'use client';

import { useState, useEffect } from 'react';
import MetricsCards from '@/components/MetricsCards';
import TradesTable from '@/components/TradesTable';
import ChartsSection from '@/components/ChartsSection';
import FiltersPanel from '@/components/FiltersPanel';
import { tradingService } from '@/services/tradingService';
import { TradingSignal, TradeResult, MatchedTrade, FilterOptions } from '@/types/trading';
import { Home as HomeIcon, TrendingUp, BarChart3, Activity } from 'lucide-react';

// Import tab components
import HomeTab from '@/components/tabs/HomeTab';
import TransactionsTab from '@/components/tabs/TransactionsTab';
import SignalsTab from '@/components/tabs/SignalsTab';
import AnalysisTab from '@/components/tabs/AnalysisTab';

type TabType = 'home' | 'transactions' | 'signals' | 'analysis';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
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

  const tabs = [
    { id: 'home', label: 'Tổng Quan', icon: <HomeIcon className="h-4 w-4 sm:h-5 sm:w-5" /> },
    { id: 'transactions', label: 'Giao Dịch', icon: <Activity className="h-4 w-4 sm:h-5 sm:w-5" /> },
    { id: 'signals', label: 'Tín Hiệu', icon: <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" /> },
    { id: 'analysis', label: 'Phân Tích', icon: <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`
                  flex items-center justify-center sm:justify-start gap-2 px-4 py-3 sm:py-4 text-sm font-medium transition-colors
                  ${activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 sm:bg-transparent'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }
                  rounded-t-lg sm:rounded-t-none
                `}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          {activeTab === 'home' && (
            <HomeTab
              tradingSignals={tradingSignals}
              tradeResults={tradeResults}
              matchedTrades={matchedTrades}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsTab
              matchedTrades={matchedTrades}
              filteredTrades={filteredTrades}
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          )}

          {activeTab === 'signals' && (
            <SignalsTab
              tradingSignals={tradingSignals}
            />
          )}

          {activeTab === 'analysis' && (
            <AnalysisTab />
          )}
        </div>
      </div>
    </div>
  );
}