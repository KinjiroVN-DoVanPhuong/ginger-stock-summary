'use client';

import { useState, useEffect } from 'react';
import { tradingService } from '@/services/tradingService';
import { TradingSignal, TradeResult, MatchedTrade } from '@/types/trading';
import { TrendingUp, BarChart3, DollarSign } from 'lucide-react';

// Import tab components
import SignalsTab from '@/components/tabs/SignalsTab';
import AnalysisTab from '@/components/tabs/AnalysisTab';
import AssetsTab from '@/components/tabs/AssetsTab';

type TabType = 'signals' | 'analysis' | 'assets';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('signals');
  const [tradingSignals, setTradingSignals] = useState<TradingSignal[]>([]);
  const [tradeResults, setTradeResults] = useState<TradeResult[]>([]);
  const [matchedTrades, setMatchedTrades] = useState<MatchedTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    });

    const unsubscribeResults = tradingService.subscribeToTradeResults((results) => {
      setTradeResults(results);
      const matched = tradingService.matchTradesWithSignals(tradingSignals, results);
      setMatchedTrades(matched);
    });

    // Cleanup subscriptions
    return () => {
      unsubscribeSignals();
      unsubscribeResults();
    };
  }, []);

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
    { id: 'signals', label: 'Tín Hiệu', icon: <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" /> },
    { id: 'analysis', label: 'Phân Tích', icon: <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" /> },
    { id: 'assets', label: 'Tài Sản', icon: <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Mobile Tab Menu Button */}
        <div className="sm:hidden mb-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex items-center justify-between w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm"
          >
            <div className="flex items-center gap-2">
              {tabs.find(tab => tab.id === activeTab)?.icon}
              <span className="font-medium">{tabs.find(tab => tab.id === activeTab)?.label}</span>
            </div>
            <svg
              className={`w-5 h-5 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Mobile Tab Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="mt-2 bg-white border border-gray-300 rounded-lg shadow-lg">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as TabType);
                    setMobileMenuOpen(false);
                  }}
                  className={`
                    flex items-center gap-3 w-full px-4 py-3 text-left transition-colors
                    ${activeTab === tab.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                    ${tab.id !== 'signals' ? 'border-t border-gray-100' : ''}
                  `}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Tab Navigation */}
        <div className="hidden sm:block mb-6">
          <div className="flex gap-2 border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`
                  flex items-center justify-start gap-2 px-4 py-4 text-sm font-medium transition-colors
                  ${activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          {activeTab === 'signals' && (
            <SignalsTab
              tradingSignals={tradingSignals}
            />
          )}

          {activeTab === 'analysis' && (
            <AnalysisTab />
          )}

          {activeTab === 'assets' && (
            <AssetsTab />
          )}
        </div>
      </div>
    </div>
  );
}