'use client';

import { useState, useEffect } from 'react';
import { tradingService } from '@/services/tradingService';
import { BuyMonitoring, SellMonitoring } from '@/types/trading';
import { TrendingUp, TrendingDown, DollarSign, Package, Calendar, Filter, X, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ProfitLossSummary {
  totalInvestment: number;
  currentValue: number;
  profitLossAmount: number;
  profitLossPercentage: number;
  mostProfitableSymbol: string;
  mostProfitableAmount: number;
  mostLossSymbol: string;
  mostLossAmount: number;
}

export default function TradingTab() {
  const [buyMonitoring, setBuyMonitoring] = useState<BuyMonitoring[]>([]);
  const [sellMonitoring, setSellMonitoring] = useState<SellMonitoring[]>([]);
  const [filteredBuyMonitoring, setFilteredBuyMonitoring] = useState<BuyMonitoring[]>([]);
  const [loading, setLoading] = useState(true);
  const [profitLossSummary, setProfitLossSummary] = useState<ProfitLossSummary | null>(null);
  const [filters, setFilters] = useState({
    symbol: '',
    status: 'ALL' as 'ALL' | 'HOLDING' | 'STOP_LOSS' | 'TAKE_PROFIT',
  });

  // State for sell dialog
  const [showSellDialog, setShowSellDialog] = useState(false);
  const [selectedBuy, setSelectedBuy] = useState<BuyMonitoring | null>(null);
  const [sellForm, setSellForm] = useState({
    sell_price: '',
    volume: '',
    sell_date: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [buyData, sellData] = await Promise.all([
          tradingService.getBuyMonitoring(),
          tradingService.getSellMonitoring()
        ]);

        setBuyMonitoring(buyData);
        setSellMonitoring(sellData);
        setFilteredBuyMonitoring(buyData);
      } catch (error) {
        console.error('Error loading trading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Set up real-time listeners
    const unsubscribeBuy = tradingService.subscribeToBuyMonitoring((buyData) => {
      setBuyMonitoring(buyData);
      applyFilters(buyData, filters);
    });

    const unsubscribeSell = tradingService.subscribeToSellMonitoring((sellData) => {
      setSellMonitoring(sellData);
    });

    // Cleanup subscriptions
    return () => {
      unsubscribeBuy();
      unsubscribeSell();
    };
  }, []);

  // Calculate profit/loss summary
  useEffect(() => {
    if (buyMonitoring.length > 0) {
      calculateProfitLossSummary();
    }
  }, [buyMonitoring, sellMonitoring]);

  // Apply filters when they change
  useEffect(() => {
    applyFilters(buyMonitoring, filters);
  }, [filters, buyMonitoring]);

  const calculateProfitLossSummary = () => {
    // Group buy orders by symbol
    const buyBySymbol: Record<string, BuyMonitoring[]> = {};
    buyMonitoring.forEach(buy => {
      if (!buyBySymbol[buy.symbol]) {
        buyBySymbol[buy.symbol] = [];
      }
      buyBySymbol[buy.symbol].push(buy);
    });

    let totalInvestment = 0;
    let currentValue = 0;
    let totalProfitLoss = 0;
    const symbolProfits: Record<string, number> = {};

    // Calculate for each symbol based ONLY on buy list with current price
    Object.keys(buyBySymbol).forEach(symbol => {
      const symbolBuys = buyBySymbol[symbol];

      // Calculate total bought volume and value
      const totalBoughtVolume = symbolBuys.reduce((sum, buy) => sum + buy.volume, 0);
      const totalBoughtValue = symbolBuys.reduce((sum, buy) => sum + (buy.enter_price * buy.volume), 0);

      // Calculate current value based on current price (use enter_price if current_price not available)
      const currentValueForSymbol = symbolBuys.reduce((sum, buy) => {
        const currentPrice = buy.current_price || buy.enter_price;
        return sum + (currentPrice * buy.volume);
      }, 0);

      // Calculate profit/loss for this symbol (unrealized)
      const symbolProfitLoss = currentValueForSymbol - totalBoughtValue;

      totalInvestment += totalBoughtValue;
      currentValue += currentValueForSymbol;
      totalProfitLoss += symbolProfitLoss;

      symbolProfits[symbol] = symbolProfitLoss;
    });

    // Find most profitable and most loss symbols
    let mostProfitableSymbol = '';
    let mostProfitableAmount = 0;
    let mostLossSymbol = '';
    let mostLossAmount = 0;

    Object.entries(symbolProfits).forEach(([symbol, profit]) => {
      if (profit > mostProfitableAmount) {
        mostProfitableAmount = profit;
        mostProfitableSymbol = symbol;
      }
      if (profit < mostLossAmount) {
        mostLossAmount = profit;
        mostLossSymbol = symbol;
      }
    });

    const profitLossPercentage = totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0;

    setProfitLossSummary({
      totalInvestment,
      currentValue,
      profitLossAmount: totalProfitLoss,
      profitLossPercentage,
      mostProfitableSymbol,
      mostProfitableAmount,
      mostLossSymbol,
      mostLossAmount,
    });
  };

  const applyFilters = (buyData: BuyMonitoring[], currentFilters: typeof filters) => {
    let filtered = [...buyData];

    // Filter by symbol
    if (currentFilters.symbol) {
      filtered = filtered.filter(buy =>
        buy.symbol.toLowerCase().includes(currentFilters.symbol.toLowerCase())
      );
    }

    // Filter by status
    if (currentFilters.status !== 'ALL') {
      filtered = filtered.filter(buy => buy.status === currentFilters.status);
    }

    // Filter out fully sold positions
    filtered = filtered.filter(buy => {
      const symbolBuys = buyMonitoring.filter(b => b.symbol === buy.symbol);
      const symbolSells = sellMonitoring.filter(s => s.symbol === buy.symbol);
      
      const totalBuyVolume = symbolBuys.reduce((sum, b) => sum + b.volume, 0);
      const totalSellVolume = symbolSells.reduce((sum, s) => sum + s.volume, 0);
      
      // Only show if buy volume > sell volume for this symbol
      return totalBuyVolume > totalSellVolume;
    });

    setFilteredBuyMonitoring(filtered);
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
      status: 'ALL',
    });
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi });
    } catch (error) {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN');
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'HOLDING':
        return 'bg-blue-100 text-blue-800';
      case 'STOP_LOSS':
        return 'bg-red-100 text-red-800';
      case 'TAKE_PROFIT':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'HOLDING':
        return 'Đang nắm giữ';
      case 'STOP_LOSS':
        return 'Cảnh báo cắt lỗ';
      case 'TAKE_PROFIT':
        return 'Cảnh báo chốt lời';
      default:
        return 'Chưa xác định';
    }
  };

  // Sell dialog handlers
  const handleSellClick = (buy: BuyMonitoring) => {
    setSelectedBuy(buy);
    setSellForm({
      sell_price: (buy.current_price || buy.enter_price).toString(),
      volume: Math.min(100, buy.volume).toString(),
      sell_date: format(new Date(), 'yyyy-MM-dd')
    });
    setShowSellDialog(true);
    setSaveMessage(null);
  };

  const handleSellFormChange = (key: keyof typeof sellForm, value: string) => {
    setSellForm(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSell = async () => {
    if (!selectedBuy) {
      setSaveMessage({ type: 'error', text: 'Không tìm thấy thông tin lệnh mua' });
      return;
    }

    // Validate form
    if (!sellForm.sell_price || !sellForm.volume || !sellForm.sell_date) {
      setSaveMessage({ type: 'error', text: 'Vui lòng điền đầy đủ thông tin' });
      return;
    }

    const sellPrice = parseFloat(sellForm.sell_price);
    const volume = parseInt(sellForm.volume);

    if (isNaN(sellPrice) || sellPrice <= 0) {
      setSaveMessage({ type: 'error', text: 'Giá bán phải là số dương' });
      return;
    }

    if (isNaN(volume) || volume <= 0) {
      setSaveMessage({ type: 'error', text: 'Khối lượng phải là số dương' });
      return;
    }

    if (volume > selectedBuy.volume) {
      setSaveMessage({ 
        type: 'error', 
        text: `Khối lượng bán không được vượt quá ${selectedBuy.volume.toLocaleString('vi-VN')} (khối lượng mua)` 
      });
      return;
    }

    try {
      setIsSaving(true);
      setSaveMessage(null);

      const sellData = {
        buy_monitoring_id: selectedBuy.id || '',
        symbol: selectedBuy.symbol,
        sell_price: sellPrice,
        volume: volume,
        sell_date: sellForm.sell_date
      };

      await tradingService.saveSellMonitoring(sellData);
      
      setSaveMessage({ 
        type: 'success', 
        text: 'Đã lưu thông tin bán thành công!' 
      });
      
      // Reset form after successful save
      setTimeout(() => {
        setShowSellDialog(false);
        setSaveMessage(null);
        setSelectedBuy(null);
      }, 2000);
    } catch (error) {
      console.error('Error saving sell monitoring:', error);
      setSaveMessage({ 
        type: 'error', 
        text: 'Lỗi khi lưu thông tin bán. Vui lòng thử lại.' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseSellDialog = () => {
    setShowSellDialog(false);
    setSelectedBuy(null);
    setSellForm({
      sell_price: '',
      volume: '',
      sell_date: ''
    });
    setSaveMessage(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu giao dịch...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Giao Dịch</h2>
          <p className="text-sm text-gray-600">Theo dõi lợi nhuận và danh sách lệnh mua/bán</p>
        </div>
        <div className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
          Hiển thị <span className="font-bold">{filteredBuyMonitoring.length}</span> lệnh mua
        </div>
      </div>

      {/* Profit/Loss Summary Cards */}
      {profitLossSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Investment */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 sm:p-6 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-blue-600 font-medium">Tổng Đầu Tư</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {formatCurrency(profitLossSummary.totalInvestment)}
                </p>
              </div>
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Tổng giá trị đầu tư</p>
          </div>

          {/* Current Value */}
          <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 sm:p-6 rounded-lg border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-purple-600 font-medium">Giá Trị Hiện Tại</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {formatCurrency(profitLossSummary.currentValue)}
                </p>
              </div>
              <div className="h-6 w-6 sm:h-8 sm:w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold text-sm sm:text-base">$</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Tổng giá trị hiện tại</p>
          </div>

          {/* Profit/Loss */}
          <div className={`p-4 sm:p-6 rounded-lg border ${
            profitLossSummary.profitLossAmount >= 0 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-100' 
              : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-100'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">Lợi Nhuận/Lỗ</p>
                <p className={`text-xl sm:text-2xl font-bold ${
                  profitLossSummary.profitLossAmount >= 0 ? 'text-green-700' : 'text-red-700'
                }`}>
                  {profitLossSummary.profitLossAmount >= 0 ? '+' : ''}{formatCurrency(profitLossSummary.profitLossAmount)}
                </p>
                <p className={`text-sm ${
                  profitLossSummary.profitLossPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {profitLossSummary.profitLossPercentage >= 0 ? '+' : ''}{profitLossSummary.profitLossPercentage.toFixed(2)}%
                </p>
              </div>
              {profitLossSummary.profitLossAmount >= 0 ? (
                <ArrowUpRight className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
              ) : (
                <ArrowDownRight className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">Tổng lợi nhuận/lỗ thực tế</p>
          </div>

          {/* Most Profitable/Loss */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 sm:p-6 rounded-lg border border-amber-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-amber-600 font-medium">Mã Lãi/Nhiều Nhất</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900">
                  {profitLossSummary.mostProfitableSymbol || 'N/A'}
                </p>
                <p className="text-sm text-green-600">
                  {profitLossSummary.mostProfitableAmount > 0 ? '+' : ''}{formatCurrency(profitLossSummary.mostProfitableAmount)}
                </p>
              </div>
              <div className="flex flex-col items-center">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 mb-1" />
                <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Mã lãi nhất & lỗ nhất</p>
          </div>
        </div>
      )}

      {/* Filters Panel */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 sm:p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-900">Bộ Lọc Lệnh Mua</h3>
            </div>
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors active:scale-95"
            >
              Xóa tất cả
            </button>
          </div>

          <div className="space-y-4">
            {/* Symbol Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Mã Chứng Khoán
              </label>
              <input
                type="text"
                value={filters.symbol}
                onChange={(e) => handleFilterChange('symbol', e.target.value)}
                placeholder="VD: VN30, VIC, VHM..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Trạng Thái
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['ALL', 'HOLDING', 'STOP_LOSS', 'TAKE_PROFIT'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleFilterChange('status', status)}
                    className={`
                      px-4 py-2.5 text-sm font-medium rounded-lg transition-colors active:scale-95
                      ${filters.status === status
                        ? status === 'ALL' 
                          ? 'bg-blue-600 text-white'
                          : status === 'HOLDING'
                          ? 'bg-blue-100 text-blue-800'
                          : status === 'STOP_LOSS'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                     {status === 'ALL' ? 'Tất cả' : 
                      status === 'HOLDING' ? 'Đang giữ' :
                      status === 'STOP_LOSS' ? 'Cảnh báo cắt lỗ' :
                      'Cảnh báo chốt lời'}
                   </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {(filters.symbol || filters.status !== 'ALL') && (
          <div className="p-4 bg-blue-50 border-b">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-blue-700">Bộ lọc đang hoạt động:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.symbol && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  Mã: {filters.symbol}
                </span>
              )}
              {filters.status !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  Trạng thái: {filters.status === 'HOLDING' ? 'Đang giữ' : filters.status === 'STOP_LOSS' ? 'Cảnh báo cắt lỗ' : 'Cảnh báo chốt lời'}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Buy Monitoring Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 sm:p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Danh Sách Lệnh Mua</h3>
          <p className="text-sm text-gray-600">Các lệnh mua đang nắm giữ (không hiển thị mã đã bán hết)</p>
        </div>

        {filteredBuyMonitoring.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 text-4xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy lệnh mua</h3>
            <p className="text-gray-600">
              {buyMonitoring.length === 0
                ? 'Chưa có lệnh mua nào trong hệ thống.'
                : 'Không có lệnh mua nào phù hợp với bộ lọc hiện tại.'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Cards View */}
            <div className="md:hidden">
              <div className="divide-y divide-gray-200">
                {filteredBuyMonitoring.map((buy) => {
                  // Calculate current profit/loss based on current price if available
                  const currentPrice = buy.current_price || buy.enter_price;
                  const profitLossAmount = (currentPrice - buy.enter_price) * buy.volume;
                  const profitLossPercentage = ((currentPrice - buy.enter_price) / buy.enter_price) * 100;
                  
                  return (
                    <div key={buy.id} className="p-4 hover:bg-gray-50 transition-colors">
                      {/* Header Row */}
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-gray-900">{buy.symbol}</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(buy.status)}`}>
                              {getStatusText(buy.status)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">{formatDate(buy.buy_date)}</div>
                        </div>
                      </div>

                      {/* Price Information */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">Giá Mua</div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(buy.enter_price)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">Giá Hiện Tại</div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(currentPrice)}
                          </div>
                        </div>
                      </div>

                      {/* Volume and Profit/Loss */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">Khối Lượng</div>
                          <div className="text-sm font-medium text-gray-900">
                            {buy.volume.toLocaleString('vi-VN')}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">Lợi Nhuận/Lỗ</div>
                          <div className={`text-sm font-medium ${profitLossAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {profitLossAmount >= 0 ? '+' : ''}{formatCurrency(profitLossAmount)}
                          </div>
                          <div className={`text-xs ${profitLossPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {profitLossPercentage >= 0 ? '+' : ''}{profitLossPercentage.toFixed(2)}%
                          </div>
                        </div>
                      </div>

                      {/* Stop Loss and Take Profit */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">Cắt Lỗ</div>
                          <div className="text-sm font-medium text-red-600">
                            {formatCurrency(buy.signal_stop_loss_price)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">Chốt Lời</div>
                          <div className="text-sm font-medium text-green-600">
                            {formatCurrency(buy.signal_take_profit_price)}
                          </div>
                        </div>
                      </div>

                      {/* Sell Button */}
                      <button
                        onClick={() => handleSellClick(buy)}
                        className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors active:scale-95"
                      >
                        <span>Bán Cổ Phiếu</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày Mua
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mã CK
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Giá Mua
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Khối Lượng
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Giá Hiện Tại
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lợi Nhuận/Lỗ
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cắt Lỗ
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Chốt Lời
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng Thái
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hành Động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBuyMonitoring.map((buy) => {
                      // Calculate current profit/loss based on current price if available
                      const currentPrice = buy.current_price || buy.enter_price;
                      const profitLossAmount = (currentPrice - buy.enter_price) * buy.volume;
                      const profitLossPercentage = ((currentPrice - buy.enter_price) / buy.enter_price) * 100;
                      
                      return (
                        <tr key={buy.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatDate(buy.buy_date)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-gray-900">
                              {buy.symbol}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(buy.enter_price)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {buy.volume.toLocaleString('vi-VN')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(currentPrice)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${profitLossAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {profitLossAmount >= 0 ? '+' : ''}{formatCurrency(profitLossAmount)}
                            </div>
                            <div className={`text-xs ${profitLossPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {profitLossPercentage >= 0 ? '+' : ''}{profitLossPercentage.toFixed(2)}%
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-red-600">
                              {formatCurrency(buy.signal_stop_loss_price)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-green-600">
                              {formatCurrency(buy.signal_take_profit_price)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(buy.status)}`}>
                              {getStatusText(buy.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleSellClick(buy)}
                              className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors active:scale-95"
                            >
                              Bán
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Summary */}
        {filteredBuyMonitoring.length > 0 && (
          <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
              <div className="text-sm text-gray-600">
                Hiển thị <span className="font-medium">{filteredBuyMonitoring.length}</span> lệnh mua
              </div>
              <div className="text-sm text-gray-600">
                Tổng khối lượng: <span className="font-medium">
                  {filteredBuyMonitoring.reduce((sum, buy) => sum + buy.volume, 0).toLocaleString('vi-VN')}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sell Monitoring Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 sm:p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Danh Sách Lệnh Bán</h3>
          <p className="text-sm text-gray-600">Các lệnh bán đã thực hiện</p>
        </div>

        {sellMonitoring.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 text-4xl mb-4">💰</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy lệnh bán</h3>
            <p className="text-gray-600">Chưa có lệnh bán nào trong hệ thống.</p>
          </div>
        ) : (
          <>
            {/* Mobile Cards View */}
            <div className="md:hidden">
              <div className="divide-y divide-gray-200">
                {sellMonitoring.map((sell) => (
                  <div key={sell.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-gray-900">{sell.symbol}</span>
                        </div>
                        <div className="text-xs text-gray-500">{formatDate(sell.sell_date)}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">Giá Bán</div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(sell.sell_price)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">Khối Lượng</div>
                        <div className="text-sm font-medium text-gray-900">
                          {sell.volume.toLocaleString('vi-VN')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày Bán
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mã CK
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Giá Bán
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Khối Lượng
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sellMonitoring.map((sell) => (
                      <tr key={sell.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatDate(sell.sell_date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">
                            {sell.symbol}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(sell.sell_price)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {sell.volume.toLocaleString('vi-VN')}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Summary */}
        {sellMonitoring.length > 0 && (
          <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
              <div className="text-sm text-gray-600">
                Hiển thị <span className="font-medium">{sellMonitoring.length}</span> lệnh bán
              </div>
              <div className="text-sm text-gray-600">
                Tổng khối lượng: <span className="font-medium">
                  {sellMonitoring.reduce((sum, sell) => sum + sell.volume, 0).toLocaleString('vi-VN')}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sell Dialog */}
      {showSellDialog && selectedBuy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Nhập thông tin bán</h3>
                <p className="text-sm text-gray-600">
                  {selectedBuy.symbol} • Khối lượng mua: {selectedBuy.volume.toLocaleString('vi-VN')} CP
                </p>
              </div>
              <button
                onClick={handleCloseSellDialog}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Dialog Content */}
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                {/* Buy Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Giá mua</p>
                    <p className="font-medium">{formatCurrency(selectedBuy.enter_price)}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Khối lượng mua</p>
                    <p className="font-medium">{selectedBuy.volume.toLocaleString('vi-VN')} CP</p>
                  </div>
                </div>

                {/* Sell Form */}
                <div className="space-y-4">
                  {/* Sell Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        Giá bán
                      </div>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={sellForm.sell_price}
                      onChange={(e) => handleSellFormChange('sell_price', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                      placeholder="Nhập giá bán"
                    />
                  </div>

                  {/* Volume */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4 text-gray-500" />
                        Khối lượng bán (số lượng cổ phiếu)
                      </div>
                    </label>
                    <input
                      type="number"
                      value={sellForm.volume}
                      onChange={(e) => handleSellFormChange('volume', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                      placeholder={`Tối đa: ${selectedBuy.volume.toLocaleString('vi-VN')}`}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Khối lượng mua: {selectedBuy.volume.toLocaleString('vi-VN')} CP
                    </p>
                  </div>

                  {/* Sell Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        Ngày bán
                      </div>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="date"
                        value={sellForm.sell_date}
                        onChange={(e) => handleSellFormChange('sell_date', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                      />
                    </div>
                  </div>
                </div>

                {/* Save Message */}
                {saveMessage && (
                  <div className={`p-3 rounded-lg ${saveMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    <p className="text-sm">{saveMessage.text}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Dialog Footer */}
            <div className="p-4 border-t">
              <div className="flex gap-3">
                <button
                  onClick={handleCloseSellDialog}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors active:scale-95"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveSell}
                  disabled={isSaving}
                  className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Đang lưu...
                    </div>
                  ) : 'Lưu thông tin bán'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
