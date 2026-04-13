'use client';

import { useState, useEffect } from 'react';
import { tradingService } from '@/services/tradingService';
import { BuyMonitoring, SellMonitoring } from '@/types/trading';
import { DollarSign, ShoppingBag, PieChart } from 'lucide-react';

interface AssetSummary {
  totalSoldValue: number;      // Tổng giá trị đã bán
  totalBoughtValue: number;    // Tổng giá trị đã mua
  totalAssets: number;         // Tổng tài sản
  currentStockValue: number;   // Giá trị cổ phiếu đang nắm giữ
  totalHoldingVolume: number;  // Tổng khối lượng đang nắm giữ
}

export default function AssetsTab() {
  const [buyMonitoring, setBuyMonitoring] = useState<BuyMonitoring[]>([]);
  const [sellMonitoring, setSellMonitoring] = useState<SellMonitoring[]>([]);
  const [assetSummary, setAssetSummary] = useState<AssetSummary | null>(null);
  const [loading, setLoading] = useState(true);

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
        
        // Calculate asset summary
        calculateAssetSummary(buyData, sellData);
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
      calculateAssetSummary(buyData, sellMonitoring);
    });

    const unsubscribeSell = tradingService.subscribeToSellMonitoring((sellData) => {
      setSellMonitoring(sellData);
      calculateAssetSummary(buyMonitoring, sellData);
    });

    // Cleanup subscriptions
    return () => {
      unsubscribeBuy();
      unsubscribeSell();
    };
  }, []);

  const calculateAssetSummary = (buyData: BuyMonitoring[], sellData: SellMonitoring[]) => {
    // 1. Tổng giá trị đã bán (từ bảng sell monitoring)
    const totalSoldValue = sellData.reduce((sum, sell) => {
      return sum + (sell.sell_price * sell.volume);
    }, 0);

    // 2. Tổng giá trị đã mua (từ bảng danh sách mua)
    const totalBoughtValue = buyData.reduce((sum, buy) => {
      return sum + (buy.enter_price * buy.volume);
    }, 0);

    // 3. Tính toán khối lượng và giá trị cổ phiếu đang nắm giữ
    // Group by symbol để tính khối lượng đang nắm giữ
    const holdingsBySymbol: Record<string, {
      totalBoughtVolume: number;
      totalSoldVolume: number;
      currentHoldingVolume: number;
      currentValue: number;
    }> = {};

    // Process buy transactions
    buyData.forEach(buy => {
      if (!holdingsBySymbol[buy.symbol]) {
        holdingsBySymbol[buy.symbol] = {
          totalBoughtVolume: 0,
          totalSoldVolume: 0,
          currentHoldingVolume: 0,
          currentValue: 0
        };
      }
      holdingsBySymbol[buy.symbol].totalBoughtVolume += buy.volume;
    });

    // Process sell transactions
    sellData.forEach(sell => {
      if (holdingsBySymbol[sell.symbol]) {
        holdingsBySymbol[sell.symbol].totalSoldVolume += sell.volume;
      }
    });

    // Calculate current holding volume and value for each symbol
    let totalHoldingVolume = 0;
    let currentStockValue = 0;

    Object.keys(holdingsBySymbol).forEach(symbol => {
      const holding = holdingsBySymbol[symbol];
      holding.currentHoldingVolume = holding.totalBoughtVolume - holding.totalSoldVolume;
      
      if (holding.currentHoldingVolume > 0) {
        totalHoldingVolume += holding.currentHoldingVolume;
        
        // Find the most recent buy for this symbol to get current price
        const symbolBuys = buyData.filter(buy => buy.symbol === symbol);
        if (symbolBuys.length > 0) {
          // Use current_price if available, otherwise use enter_price
          const mostRecentBuy = symbolBuys[symbolBuys.length - 1];
          const currentPrice = mostRecentBuy.current_price || mostRecentBuy.enter_price;
          holding.currentValue = holding.currentHoldingVolume * currentPrice;
          currentStockValue += holding.currentValue;
        }
      }
    });

    // 4. Tổng tài sản = Tổng giá trị đã bán + Giá trị cổ phiếu đang nắm giữ
    const totalAssets = totalSoldValue + currentStockValue;

    setAssetSummary({
      totalSoldValue,
      totalBoughtValue,
      totalAssets,
      currentStockValue,
      totalHoldingVolume
    });
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN');
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
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Tổng Quan Tài Sản</h2>
          <p className="text-sm text-gray-600">Thống kê tổng quan về tài sản đầu tư</p>
        </div>
      </div>

      {/* Asset Summary Cards */}
      {assetSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Total Sold Value */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-6 rounded-lg border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-green-600 font-medium">Tổng Giá Trị Đã Bán</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {formatCurrency(assetSummary.totalSoldValue)}
                </p>
              </div>
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Tổng số tiền từ danh sách đã bán</p>
          </div>

          {/* Total Bought Value */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 sm:p-6 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-blue-600 font-medium">Tổng Giá Trị Đã Mua</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {formatCurrency(assetSummary.totalBoughtValue)}
                </p>
              </div>
              <ShoppingBag className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Tổng số tiền từ danh sách đã mua</p>
          </div>

          {/* Total Assets */}
          <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 sm:p-6 rounded-lg border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-purple-600 font-medium">Tổng Tài Sản</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {formatCurrency(assetSummary.totalAssets)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-600">
                    Tiền mặt: {formatCurrency(assetSummary.totalSoldValue)}
                  </span>
                  <span className="text-xs text-gray-600">•</span>
                  <span className="text-xs text-gray-600">
                    Cổ phiếu: {formatCurrency(assetSummary.currentStockValue)}
                  </span>
                </div>
              </div>
              <PieChart className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Tổng tiền mặt + giá trị cổ phiếu đang nắm giữ</p>
          </div>
        </div>
      )}

      {/* Additional Information */}
      {assetSummary && (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Chi Tiết Tài Sản</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Current Stock Holdings */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">Cổ Phiếu Đang Nắm Giữ</p>
                <span className="text-sm font-bold text-gray-900">
                  {formatCurrency(assetSummary.currentStockValue)}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Tổng khối lượng: {assetSummary.totalHoldingVolume.toLocaleString('vi-VN')} CP
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Tính theo giá hiện tại từ danh sách mua
              </p>
            </div>

            {/* Investment Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">Tổng Đầu Tư</p>
                <span className="text-sm font-bold text-gray-900">
                  {formatCurrency(assetSummary.totalBoughtValue)}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Đã thu hồi: {formatCurrency(assetSummary.totalSoldValue)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Còn lại: {formatCurrency(assetSummary.totalBoughtValue - assetSummary.totalSoldValue)}
              </p>
            </div>
          </div>

          {/* Calculation Notes */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Ghi chú tính toán:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• <span className="font-medium">Tổng giá trị đã bán</span>: Tính từ bảng SellMonitoring (giá bán × khối lượng)</li>
              <li>• <span className="font-medium">Tổng giá trị đã mua</span>: Tính từ bảng BuyMonitoring (giá mua × khối lượng)</li>
              <li>• <span className="font-medium">Khối lượng đang nắm giữ</span>: Tổng khối lượng đã mua - Tổng khối lượng đã bán</li>
              <li>• <span className="font-medium">Giá trị cổ phiếu đang nắm giữ</span>: Khối lượng đang nắm giữ × Giá hiện tại (từ BuyMonitoring)</li>
              <li>• <span className="font-medium">Tổng tài sản</span>: Tổng giá trị đã bán + Giá trị cổ phiếu đang nắm giữ</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}