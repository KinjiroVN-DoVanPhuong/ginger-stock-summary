'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Filter, BarChart3, ShoppingCart, ShoppingBag, X } from 'lucide-react';
import { tradingService } from '@/services/tradingService';
import { BuyMonitoring, SellMonitoring } from '@/types/trading';

interface OrderSummary {
  totalBuyOrders: number;
  totalSellOrders: number;
  totalProfitLoss: number;
  totalInvestment: number;
  totalCurrentValue: number;
}

export default function OrderBookTab() {
  const [buyOrders, setBuyOrders] = useState<BuyMonitoring[]>([]);
  const [sellOrders, setSellOrders] = useState<SellMonitoring[]>([]);
  const [filteredBuyOrders, setFilteredBuyOrders] = useState<BuyMonitoring[]>([]);
  const [filteredSellOrders, setFilteredSellOrders] = useState<SellMonitoring[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<OrderSummary>({
    totalBuyOrders: 0,
    totalSellOrders: 0,
    totalProfitLoss: 0,
    totalInvestment: 0,
    totalCurrentValue: 0
  });
  const [filters, setFilters] = useState({
    symbol: '',
    status: 'ALL'
  });
  const [showFilterPopup, setShowFilterPopup] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadData();
    
    // Set up real-time listeners
    const unsubscribeBuy = tradingService.subscribeToBuyMonitoring((orders) => {
      setBuyOrders(orders);
      applyFilters(orders, sellOrders, filters);
      calculateSummary(orders, sellOrders);
    });
    
    const unsubscribeSell = tradingService.subscribeToSellMonitoring((orders) => {
      setSellOrders(orders);
      applyFilters(buyOrders, orders, filters);
      calculateSummary(buyOrders, orders);
    });

    return () => {
      unsubscribeBuy();
      unsubscribeSell();
    };
  }, []);

  // Apply filters when they change
  useEffect(() => {
    applyFilters(buyOrders, sellOrders, filters);
  }, [filters, buyOrders, sellOrders]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [buyData, sellData] = await Promise.all([
        tradingService.getBuyMonitoring(),
        tradingService.getSellMonitoring()
      ]);
      
      setBuyOrders(buyData);
      setSellOrders(sellData);
      applyFilters(buyData, sellData, filters);
      calculateSummary(buyData, sellData);
    } catch (err) {
      console.error('Error loading order book data:', err);
      setError('Không thể tải dữ liệu sổ lệnh. Vui lòng kiểm tra kết nối Firebase của bạn.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (buyOrders: BuyMonitoring[], sellOrders: SellMonitoring[], currentFilters: typeof filters) => {
    let filteredBuy = [...buyOrders];
    let filteredSell = [...sellOrders];

    // Filter by symbol
    if (currentFilters.symbol) {
      filteredBuy = filteredBuy.filter(order =>
        order.symbol.toLowerCase().includes(currentFilters.symbol.toLowerCase())
      );
      filteredSell = filteredSell.filter(order =>
        order.symbol.toLowerCase().includes(currentFilters.symbol.toLowerCase())
      );
    }

    // Filter by status (for buy orders only)
    if (currentFilters.status !== 'ALL') {
      filteredBuy = filteredBuy.filter(order => order.status === currentFilters.status);
    }

    setFilteredBuyOrders(filteredBuy);
    setFilteredSellOrders(filteredSell);
  };

  const calculateSummary = (buyOrders: BuyMonitoring[], sellOrders: SellMonitoring[]) => {
    const totalBuyOrders = buyOrders.length;
    const totalSellOrders = sellOrders.length;
    
    // Calculate total investment (sum of buy orders value)
    const totalInvestment = buyOrders.reduce((sum, order) => {
      return sum + (order.enter_price * order.volume);
    }, 0);
    
    // Calculate total current value (using current_price if available, otherwise enter_price)
    const totalCurrentValue = buyOrders.reduce((sum, order) => {
      const currentPrice = order.current_price || order.enter_price;
      return sum + (currentPrice * order.volume);
    }, 0);
    
    // Calculate total profit/loss from sell orders
    const totalProfitLoss = sellOrders.reduce((sum, order) => {
      // Find corresponding buy order to calculate profit/loss
      const buyOrder = buyOrders.find(buy => buy.id === order.buy_monitoring_id);
      if (buyOrder) {
        const profitLoss = (order.sell_price - buyOrder.enter_price) * order.volume;
        return sum + profitLoss;
      }
      return sum;
    }, 0);

    setSummary({
      totalBuyOrders,
      totalSellOrders,
      totalProfitLoss,
      totalInvestment,
      totalCurrentValue
    });
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      symbol: '',
      status: 'ALL'
    });
  };

  const getStatusColor = (status?: 'HOLDING' | 'STOP_LOSS' | 'TAKE_PROFIT') => {
    switch (status) {
      case 'HOLDING': return 'bg-blue-100 text-blue-800';
      case 'STOP_LOSS': return 'bg-red-100 text-red-800';
      case 'TAKE_PROFIT': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status?: 'HOLDING' | 'STOP_LOSS' | 'TAKE_PROFIT') => {
    switch (status) {
      case 'HOLDING': return 'Đang nắm giữ';
      case 'STOP_LOSS': return 'Dừng lỗ';
      case 'TAKE_PROFIT': return 'Chốt lời';
      default: return 'Chưa xác định';
    }
  };

  const getProfitLossColor = (amount: number) => {
    if (amount > 0) return 'text-green-600';
    if (amount < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getProfitLossBgColor = (amount: number) => {
    if (amount > 0) return 'bg-green-50';
    if (amount < 0) return 'bg-red-50';
    return 'bg-gray-50';
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải sổ lệnh...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Lỗi Kết Nối</h2>
        <p className="text-gray-600 mb-4">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filter Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Sổ Lệnh</h2>
          <p className="text-sm text-gray-600">Danh sách lệnh mua và lệnh bán</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
            <span className="font-bold">{filteredBuyOrders.length}</span> mua • <span className="font-bold">{filteredSellOrders.length}</span> bán
          </div>
          <button
            onClick={() => setShowFilterPopup(true)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 bg-gray-50 rounded-lg hover:bg-gray-100"
          >
            <Filter className="h-4 w-4" />
            Bộ lọc
          </button>
        </div>
      </div>

      {/* Summary Overview - Compact */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Buy/Sell Orders in one row */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 font-medium">Lệnh Mua</p>
              <p className="text-lg font-bold text-gray-900">
                {summary.totalBuyOrders}
              </p>
            </div>
            <ShoppingCart className="h-5 w-5 text-blue-500" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-600 font-medium">Lệnh Bán</p>
              <p className="text-lg font-bold text-gray-900">
                {summary.totalSellOrders}
              </p>
            </div>
            <ShoppingBag className="h-5 w-5 text-purple-500" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-600 font-medium">Đầu Tư</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(summary.totalInvestment)}
              </p>
            </div>
            <DollarSign className="h-5 w-5 text-green-500" />
          </div>
        </div>

        {/* Combined Profit/Loss */}
        <div className={`bg-gradient-to-r p-4 rounded-lg border ${getProfitLossBgColor(summary.totalProfitLoss)} ${summary.totalProfitLoss > 0 ? 'from-green-50 to-emerald-50 border-green-100' : summary.totalProfitLoss < 0 ? 'from-red-50 to-rose-50 border-red-100' : 'from-gray-50 to-slate-50 border-gray-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium">Lãi/Lỗ</p>
              <div className="space-y-1">
                <p className={`text-lg font-bold ${getProfitLossColor(summary.totalProfitLoss)}`}>
                  {summary.totalProfitLoss >= 0 ? '+' : ''}{formatCurrency(summary.totalProfitLoss)}
                </p>
                <p className={`text-xs ${getProfitLossColor(summary.totalCurrentValue - summary.totalInvestment)}`}>
                  {summary.totalCurrentValue - summary.totalInvestment >= 0 ? '+' : ''}{formatCurrency(summary.totalCurrentValue - summary.totalInvestment)} (hiện tại)
                </p>
              </div>
            </div>
            {summary.totalProfitLoss > 0 ? (
              <TrendingUp className="h-5 w-5 text-green-500" />
            ) : summary.totalProfitLoss < 0 ? (
              <TrendingDown className="h-5 w-5 text-red-500" />
            ) : (
              <DollarSign className="h-5 w-5 text-gray-500" />
            )}
          </div>
        </div>
      </div>

      {/* Filter Popup */}
      {showFilterPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Bộ Lọc Sổ Lệnh</h3>
              <button
                onClick={() => setShowFilterPopup(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mã Chứng Khoán
                </label>
                <input
                  type="text"
                  value={filters.symbol}
                  onChange={(e) => handleFilterChange('symbol', e.target.value)}
                  placeholder="VD: KBC, VIC, VHM..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Trạng Thái Lệnh Mua
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="HOLDING">Đang nắm giữ</option>
                  <option value="STOP_LOSS">Dừng lỗ</option>
                  <option value="TAKE_PROFIT">Chốt lời</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border-t">
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 bg-gray-50 rounded-lg hover:bg-gray-100"
              >
                Xóa tất cả
              </button>
              <button
                onClick={() => setShowFilterPopup(false)}
                className="text-sm text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
              >
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Buy Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Lệnh Mua</h3>
          <p className="text-sm text-gray-600">Danh sách lệnh mua đang theo dõi</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá vào</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">KL</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá hiện tại</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dừng lỗ</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chốt lời</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBuyOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Không có lệnh mua nào
                  </td>
                </tr>
              ) : (
                filteredBuyOrders.map((order, index) => (
                  <tr key={index} className={`hover:bg-gray-50 ${getStatusColor(order.status)}`}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{order.symbol}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-gray-900">{formatCurrency(order.enter_price)}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-gray-900">{order.volume}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-gray-900">{formatCurrency(order.current_price || order.enter_price)}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-gray-900">{formatCurrency(order.signal_stop_loss_price)}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-gray-900">{formatCurrency(order.signal_take_profit_price)}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sell Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Lệnh Bán</h3>
          <p className="text-sm text-gray-600">Danh sách lệnh bán đã thực hiện</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá bán</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">KL</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày bán</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSellOrders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    Không có lệnh bán nào
                  </td>
                </tr>
              ) : (
                filteredSellOrders.map((order, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{order.symbol}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-gray-900">{formatCurrency(order.sell_price)}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-gray-900">{order.volume}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-gray-900">{formatDate(order.sell_date)}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
