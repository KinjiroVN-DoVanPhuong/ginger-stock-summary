'use client';

import { useState, useEffect } from 'react';
import { tradingService } from '@/services/tradingService';
import { BuyMonitoring, SellMonitoring } from '@/types/trading';
import { DollarSign, ShoppingBag, PieChart, TrendingUp, TrendingDown } from 'lucide-react';

interface AssetSummary {
  totalSoldValue: number;      // Tổng giá trị đã bán (trước phí)
  totalBoughtValue: number;    // Tổng giá trị đã mua (trước phí)
  totalAssets: number;         // Tổng tài sản (sau phí)
  currentStockValue: number;   // Giá trị cổ phiếu đang nắm giữ
  totalHoldingVolume: number;  // Tổng khối lượng đang nắm giữ
  profitAmount: number;        // Lợi nhuận = tổng tài sản - tổng giá trị đã mua
  profitPercentage: number;    // Phần trăm lợi nhuận = (lợi nhuận / tổng giá trị đã mua) * 100
  totalFees: number;           // Tổng phí giao dịch
  buyFees: number;             // Phí mua (0.25%)
  sellFees: number;            // Phí bán (0.35%)
  cashAfterFees: number;       // Tiền mặt sau khi trừ phí
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

    // 4. Tính phí giao dịch
    // Phí mua = 0.25% trên giá trị của giao dịch mua
    const buyFees = buyData.reduce((sum, buy) => {
      const buyValue = buy.enter_price * buy.volume;
      return sum + (buyValue * 0.0025); // 0.25% = 0.0025
    }, 0);

    // Phí bán = 0.35% trên giá trị của giao dịch bán
    const sellFees = sellData.reduce((sum, sell) => {
      const sellValue = sell.sell_price * sell.volume;
      return sum + (sellValue * 0.0035); // 0.35% = 0.0035
    }, 0);

    const totalFees = buyFees + sellFees;

    // 5. Tính tiền mặt sau khi trừ phí
    // Tiền mặt = Tổng giá trị đã bán - Phí bán
    const cashAfterFees = totalSoldValue - sellFees;

    // 6. Tổng tài sản = Tiền mặt sau phí + Giá trị cổ phiếu đang nắm giữ - Tổng phí
    // Theo yêu cầu: Tổng tài sản = Tổng tiền mặt + giá trị cổ phiếu đang nắm giữ - phí
    // Phí ở đây là tổng phí (buyFees + sellFees)
    const totalAssets = cashAfterFees + currentStockValue - totalFees;

    // 7. Tính lợi nhuận = Tổng tài sản - Tổng giá trị đã mua
    const profitAmount = totalAssets - totalBoughtValue;
    
    // 8. Tính phần trăm lợi nhuận = (Lợi nhuận / Tổng giá trị đã mua) * 100
    const profitPercentage = totalBoughtValue > 0 ? (profitAmount / totalBoughtValue) * 100 : 0;

    setAssetSummary({
      totalSoldValue,
      totalBoughtValue,
      totalAssets,
      currentStockValue,
      totalHoldingVolume,
      profitAmount,
      profitPercentage,
      totalFees,
      buyFees,
      sellFees,
      cashAfterFees
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Profit Card */}
          <div className={`p-4 sm:p-6 rounded-lg border ${
            assetSummary.profitAmount >= 0 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-100' 
              : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-100'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">Lợi Nhuận</p>
                <p className={`text-xl sm:text-2xl font-bold ${
                  assetSummary.profitAmount >= 0 ? 'text-green-700' : 'text-red-700'
                }`}>
                  {formatCurrency(assetSummary.profitAmount)}
                </p>
                <p className={`text-sm ${
                  assetSummary.profitPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {assetSummary.profitPercentage >= 0 ? '+' : ''}{assetSummary.profitPercentage.toFixed(2)}%
                </p>
              </div>
              {assetSummary.profitAmount >= 0 ? (
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
              ) : (
                <TrendingDown className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">Tổng tài sản - Tổng giá trị đã mua</p>
          </div>

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
    </div>
  );
}