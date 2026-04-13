'use client';

import { useState, useEffect } from 'react';
import { tradingService } from '@/services/tradingService';
import { BuyMonitoring, SellMonitoring } from '@/types/trading';
import { PieChart, DollarSign, TrendingUp, TrendingDown, Package, Calendar, X, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface StockHolding {
  symbol: string;
  total_bought_volume: number;
  total_sold_volume: number;
  average_buy_price: number;
  current_holding_volume: number;
  total_investment: number;
  current_value: number;
  profit_loss_percentage: number;
  profit_loss_amount: number;
  buy_monitoring_ids: string[];
}

interface InvestmentPerformance {
  totalAssets: number;
  stockValue: number;
  cashValue: number;
  totalInvestment: number;
  totalProfitLoss: number;
  totalProfitLossPercentage: number;
  roi: number;
}

export default function AssetsTab() {
  const [buyMonitoring, setBuyMonitoring] = useState<BuyMonitoring[]>([]);
  const [sellMonitoring, setSellMonitoring] = useState<SellMonitoring[]>([]);
  const [stockHoldings, setStockHoldings] = useState<StockHolding[]>([]);
  const [cashValue, setCashValue] = useState<number>(0);
  const [investmentPerformance, setInvestmentPerformance] = useState<InvestmentPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSellDialog, setShowSellDialog] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<StockHolding | null>(null);
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
        
        // Calculate stock holdings
        calculateStockHoldings(buyData, sellData);
        
        // Calculate cash value
        calculateCashValue(sellData);
      } catch (error) {
        console.error('Error loading assets data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Set up real-time listeners
    const unsubscribeBuy = tradingService.subscribeToBuyMonitoring((buyData) => {
      setBuyMonitoring(buyData);
      calculateStockHoldings(buyData, sellMonitoring);
    });

    const unsubscribeSell = tradingService.subscribeToSellMonitoring((sellData) => {
      setSellMonitoring(sellData);
      calculateStockHoldings(buyMonitoring, sellData);
      calculateCashValue(sellData);
    });

    // Cleanup subscriptions
    return () => {
      unsubscribeBuy();
      unsubscribeSell();
    };
  }, []);

  // Calculate investment performance when holdings change
  useEffect(() => {
    if (stockHoldings.length > 0) {
      calculateInvestmentPerformance();
    }
  }, [stockHoldings, cashValue]);

  const calculateStockHoldings = (buyData: BuyMonitoring[], sellData: SellMonitoring[]) => {
    // Group by symbol
    const holdingsBySymbol: Record<string, StockHolding> = {};

    // Process buy transactions
    buyData.forEach(buy => {
      if (!holdingsBySymbol[buy.symbol]) {
        holdingsBySymbol[buy.symbol] = {
          symbol: buy.symbol,
          total_bought_volume: 0,
          total_sold_volume: 0,
          average_buy_price: 0,
          current_holding_volume: 0,
          total_investment: 0,
          current_value: 0,
          profit_loss_percentage: 0,
          profit_loss_amount: 0,
          buy_monitoring_ids: []
        };
      }
      
      const holding = holdingsBySymbol[buy.symbol];
      holding.total_bought_volume += buy.volume;
      holding.total_investment += buy.enter_price * buy.volume;
      holding.buy_monitoring_ids.push(buy.id || '');
    });

    // Process sell transactions
    sellData.forEach(sell => {
      if (holdingsBySymbol[sell.symbol]) {
        holdingsBySymbol[sell.symbol].total_sold_volume += sell.volume;
      }
    });

    // Calculate final holdings
    const holdings: StockHolding[] = Object.values(holdingsBySymbol)
      .map(holding => {
        // Calculate current holding volume (only show if > 0)
        holding.current_holding_volume = holding.total_bought_volume - holding.total_sold_volume;
        
        // Calculate average buy price
        holding.average_buy_price = holding.total_bought_volume > 0 
          ? holding.total_investment / holding.total_bought_volume 
          : 0;

        // Calculate current value (using average buy price as current price for simplicity)
        // In real app, would use current market price
        holding.current_value = holding.current_holding_volume * holding.average_buy_price;

        // Calculate profit/loss for current holdings (unrealized)
        const currentHoldingCost = holding.current_holding_volume * holding.average_buy_price;
        holding.profit_loss_amount = holding.current_value - currentHoldingCost;
        holding.profit_loss_percentage = currentHoldingCost > 0 
          ? (holding.profit_loss_amount / currentHoldingCost) * 100 
          : 0;

        return holding;
      })
      .filter(holding => holding.current_holding_volume > 0); // Only show holdings with volume > 0

    setStockHoldings(holdings);
  };

  const calculateCashValue = (sellData: SellMonitoring[]) => {
    const totalCash = sellData.reduce((sum, sell) => {
      return sum + (sell.sell_price * sell.volume);
    }, 0);
    setCashValue(totalCash);
  };

  const calculateInvestmentPerformance = () => {
    const stockValue = stockHoldings.reduce((sum, holding) => sum + holding.current_value, 0);
    const totalInvestment = stockHoldings.reduce((sum, holding) => sum + holding.total_investment, 0);
    const totalAssets = stockValue + cashValue;
    
    const totalProfitLoss = stockHoldings.reduce((sum, holding) => sum + holding.profit_loss_amount, 0);
    const totalProfitLossPercentage = totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0;
    
    const roi = totalInvestment > 0 ? ((totalAssets - totalInvestment) / totalInvestment) * 100 : 0;

    setInvestmentPerformance({
      totalAssets,
      stockValue,
      cashValue,
      totalInvestment,
      totalProfitLoss,
      totalProfitLossPercentage,
      roi
    });
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN');
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi });
    } catch (error) {
      return dateString;
    }
  };

  const handleSellClick = (holding: StockHolding) => {
    setSelectedHolding(holding);
    setSellForm({
      sell_price: holding.average_buy_price.toString(),
      volume: Math.min(100, holding.current_holding_volume).toString(),
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
    if (!selectedHolding || selectedHolding.buy_monitoring_ids.length === 0) {
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

    if (volume > selectedHolding.current_holding_volume) {
      setSaveMessage({ 
        type: 'error', 
        text: `Khối lượng bán không được vượt quá ${selectedHolding.current_holding_volume.toLocaleString('vi-VN')} (đang nắm giữ)` 
      });
      return;
    }

    try {
      setIsSaving(true);
      setSaveMessage(null);

      // Use the first buy monitoring ID for simplicity
      // In a real app, you might want to track which specific buy orders are being sold
      const buyMonitoringId = selectedHolding.buy_monitoring_ids[0];

      const sellData = {
        buy_monitoring_id: buyMonitoringId,
        symbol: selectedHolding.symbol,
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
        setSelectedHolding(null);
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
    setSelectedHolding(null);
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
          <p className="mt-4 text-gray-600">Đang tải dữ liệu tài sản...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Tài Sản Đầu Tư</h2>
          <p className="text-sm text-gray-600">Tổng quan tài sản và cổ phiếu đang nắm giữ</p>
        </div>
        <div className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
          Đang nắm giữ <span className="font-bold">{stockHoldings.length}</span> mã cổ phiếu
        </div>
      </div>

      {/* Investment Performance Cards */}
      {investmentPerformance && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Assets */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 sm:p-6 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-blue-600 font-medium">Tổng Tài Sản</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {formatCurrency(investmentPerformance.totalAssets)}
                </p>
              </div>
              <PieChart className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Giá trị tổng tài sản</p>
          </div>

          {/* Stock Value */}
          <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 sm:p-6 rounded-lg border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-purple-600 font-medium">Giá Trị Cổ Phiếu</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {formatCurrency(investmentPerformance.stockValue)}
                </p>
              </div>
              <div className="h-6 w-6 sm:h-8 sm:w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold text-sm sm:text-base">📈</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Tổng giá trị cổ phiếu đang nắm giữ</p>
          </div>

          {/* Cash Value */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-6 rounded-lg border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-green-600 font-medium">Tiền Mặt</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {formatCurrency(investmentPerformance.cashValue)}
                </p>
              </div>
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Tổng tiền mặt từ bán cổ phiếu</p>
          </div>

          {/* ROI */}
          <div className={`p-4 sm:p-6 rounded-lg border ${
            investmentPerformance.roi >= 0 
              ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-100' 
              : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-100'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">Hiệu Suất Đầu Tư (ROI)</p>
                <p className={`text-xl sm:text-2xl font-bold ${
                  investmentPerformance.roi >= 0 ? 'text-green-700' : 'text-red-700'
                }`}>
                  {investmentPerformance.roi >= 0 ? '+' : ''}{investmentPerformance.roi.toFixed(2)}%
                </p>
                <p className={`text-sm ${
                  investmentPerformance.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {investmentPerformance.totalProfitLoss >= 0 ? '+' : ''}{formatCurrency(investmentPerformance.totalProfitLoss)}
                </p>
              </div>
              {investmentPerformance.roi >= 0 ? (
                <ArrowUpRight className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
              ) : (
                <ArrowDownRight className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">Tổng lợi nhuận/lỗ & ROI</p>
          </div>
        </div>
      )}

      {/* Stock Holdings Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 sm:p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Cổ Phiếu Đang Nắm Giữ</h3>
          <p className="text-sm text-gray-600">Các mã cổ phiếu có khối lượng đã mua lớn hơn khối lượng đã bán</p>
        </div>

        {stockHoldings.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 text-4xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không có cổ phiếu đang nắm giữ</h3>
            <p className="text-gray-600">Chưa có cổ phiếu nào đang nắm giữ trong danh mục đầu tư.</p>
          </div>
        ) : (
          <>
            {/* Mobile Cards View */}
            <div className="md:hidden">
              <div className="divide-y divide-gray-200">
                {stockHoldings.map((holding) => (
                  <div key={holding.symbol} className="p-4 hover:bg-gray-50 transition-colors">
                    {/* Header Row */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-gray-900">{holding.symbol}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            holding.profit_loss_amount >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {holding.profit_loss_amount >= 0 ? '+' : ''}{holding.profit_loss_percentage.toFixed(2)}%
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Đang nắm giữ: {holding.current_holding_volume.toLocaleString('vi-VN')} CP
                        </div>
                      </div>
                    </div>

                    {/* Holding Information */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">Giá TB Mua</div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(holding.average_buy_price)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">Giá Trị Hiện Tại</div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(holding.current_value)}
                        </div>
                      </div>
                    </div>

                    {/* Profit/Loss */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">Đầu Tư</div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(holding.total_investment)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">Lợi Nhuận/Lỗ</div>
                        <div className={`text-sm font-medium ${holding.profit_loss_amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {holding.profit_loss_amount >= 0 ? '+' : ''}{formatCurrency(holding.profit_loss_amount)}
                        </div>
                      </div>
                    </div>

                    {/* Sell Button */}
                    <button
                      onClick={() => handleSellClick(holding)}
                      className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors active:scale-95"
                    >
                      <span>Bán Cổ Phiếu</span>
                    </button>
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
                        Mã CK
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Đang Nắm Giữ
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Giá TB Mua
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Đầu Tư
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Giá Trị Hiện Tại
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lợi Nhuận/Lỗ
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hành Động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stockHoldings.map((holding) => (
                      <tr key={holding.symbol} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">
                            {holding.symbol}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {holding.current_holding_volume.toLocaleString('vi-VN')} CP
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(holding.average_buy_price)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(holding.total_investment)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(holding.current_value)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${holding.profit_loss_amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {holding.profit_loss_amount >= 0 ? '+' : ''}{formatCurrency(holding.profit_loss_amount)}
                          </div>
                          <div className={`text-xs ${holding.profit_loss_percentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {holding.profit_loss_percentage >= 0 ? '+' : ''}{holding.profit_loss_percentage.toFixed(2)}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleSellClick(holding)}
                            className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors active:scale-95"
                          >
                            Bán
                          </button>
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
        {stockHoldings.length > 0 && (
          <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
              <div className="text-sm text-gray-600">
                Hiển thị <span className="font-medium">{stockHoldings.length}</span> mã cổ phiếu
              </div>
              <div className="text-sm text-gray-600">
                Tổng khối lượng: <span className="font-medium">
                  {stockHoldings.reduce((sum, holding) => sum + holding.current_holding_volume, 0).toLocaleString('vi-VN')} CP
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sell Dialog */}
      {showSellDialog && selectedHolding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Nhập thông tin bán</h3>
                <p className="text-sm text-gray-600">
                  {selectedHolding.symbol} • Đang nắm giữ: {selectedHolding.current_holding_volume.toLocaleString('vi-VN')} CP
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
                {/* Holding Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Giá TB mua</p>
                    <p className="font-medium">{formatCurrency(selectedHolding.average_buy_price)}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Đang nắm giữ</p>
                    <p className="font-medium">{selectedHolding.current_holding_volume.toLocaleString('vi-VN')} CP</p>
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
                      placeholder={`Tối đa: ${selectedHolding.current_holding_volume.toLocaleString('vi-VN')}`}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Đang nắm giữ: {selectedHolding.current_holding_volume.toLocaleString('vi-VN')} CP
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
