import { TradingSignal, TradeResult, MatchedTrade } from '@/types/trading';
import { TrendingUp, Activity, BarChart3, DollarSign, Signal, Package, Target, TrendingDown } from 'lucide-react';

interface HomeTabProps {
  tradingSignals: TradingSignal[];
  tradeResults: TradeResult[];
  matchedTrades: MatchedTrade[];
}

export default function HomeTab({
  tradingSignals,
  tradeResults,
  matchedTrades,
}: HomeTabProps) {
  // Calculate summary statistics
  const totalSignals = tradingSignals.length;
  const totalResults = tradeResults.length;
  const totalMatched = matchedTrades.length;

  // Calculate average confidence
  const avgConfidence = tradingSignals.length > 0
    ? tradingSignals.reduce((sum, signal) => sum + (signal.confidence < 1 ? signal.confidence * 100 : signal.confidence), 0) / tradingSignals.length
    : 0;

  // Calculate win rate
  const completedTrades = matchedTrades.filter(trade => trade.result.status !== 'HOLDING');
  const winRate = completedTrades.length > 0
    ? (completedTrades.filter(trade => trade.result.status === 'WIN').length / completedTrades.length) * 100
    : 0;

  // Calculate total return
  const totalReturn = completedTrades.reduce((sum, trade) => sum + trade.pnl_percentage, 0);
  const avgReturn = completedTrades.length > 0 ? totalReturn / completedTrades.length : 0;

  // Calculate profit/loss
  const winningTrades = completedTrades.filter(trade => trade.result.status === 'WIN');
  const losingTrades = completedTrades.filter(trade => trade.result.status === 'LOSS');
  const totalProfit = winningTrades.reduce((sum, trade) => sum + trade.pnl_absolute, 0);
  const totalLoss = losingTrades.reduce((sum, trade) => sum + Math.abs(trade.pnl_absolute), 0);
  const netProfit = totalProfit - totalLoss;

  // Get unique symbols
  const uniqueSymbols = Array.from(new Set(matchedTrades.map(trade => trade.symbol)));
  const mostTradedSymbol = uniqueSymbols.length > 0 
    ? uniqueSymbols.reduce((a, b) => 
        matchedTrades.filter(t => t.symbol === a).length > matchedTrades.filter(t => t.symbol === b).length ? a : b
      )
    : 'N/A';

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-blue-600 font-medium">Tín Hiệu</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalSignals}</p>
            </div>
            <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Tín hiệu giao dịch trong hệ thống</p>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-green-600 font-medium">Giao Dịch</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalMatched}</p>
            </div>
            <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Giao dịch đã khớp với tín hiệu</p>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-purple-600 font-medium">Tỷ Lệ Thắng</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{winRate.toFixed(1)}%</p>
            </div>
            <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Tỷ lệ giao dịch thắng</p>
        </div>

        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-amber-600 font-medium">Lợi Nhuận TB</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{avgReturn.toFixed(1)}%</p>
            </div>
            <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-amber-500" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Lợi nhuận trung bình (%)</p>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Signal className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Thống Kê Tín Hiệu</h3>
              <p className="text-sm text-gray-600">Chất lượng tín hiệu giao dịch</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Độ tin cậy trung bình:</span>
              <span className="font-medium">{avgConfidence.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Số mã CK có tín hiệu:</span>
              <span className="font-medium">{Array.from(new Set(tradingSignals.map(s => s.symbol))).length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Mã CK phổ biến:</span>
              <span className="font-medium">{mostTradedSymbol}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Thống Kê Giao Dịch</h3>
              <p className="text-sm text-gray-600">Hiệu suất giao dịch tổng thể</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Giao dịch hoàn thành:</span>
              <span className="font-medium">{completedTrades.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Giao dịch đang nắm giữ:</span>
              <span className="font-medium text-blue-600">{matchedTrades.length - completedTrades.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Số mã CK đã giao dịch:</span>
              <span className="font-medium">{uniqueSymbols.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Hiệu Suất Tài Chính</h3>
              <p className="text-sm text-gray-600">Kết quả tài chính chi tiết</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Lợi nhuận ròng:</span>
              <span className={`font-medium ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netProfit >= 0 ? '+' : ''}{netProfit.toLocaleString('vi-VN')} VND
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Lợi nhuận trung bình:</span>
              <span className={`font-medium ${avgReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {avgReturn.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tổng lãi/lỗ:</span>
              <span className={`font-medium ${totalProfit >= totalLoss ? 'text-green-600' : 'text-red-600'}`}>
                {totalProfit.toLocaleString('vi-VN')} / {totalLoss.toLocaleString('vi-VN')} VND
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
