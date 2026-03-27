import { TradingSignal, TradeResult, MatchedTrade } from '@/types/trading';
import { Signal, Package, Target } from 'lucide-react';

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
  // Calculate average confidence
  const avgConfidence = tradingSignals.length > 0
    ? tradingSignals.reduce((sum, signal) => sum + (signal.confidence < 1 ? signal.confidence * 100 : signal.confidence), 0) / tradingSignals.length
    : 0;

  // Calculate profit/loss statistics
  const completedTrades = matchedTrades.filter(trade => trade.result.status !== 'HOLDING');
  
  // Calculate average profit percentage
  const avgProfitPercentage = completedTrades.length > 0
    ? completedTrades.reduce((sum, trade) => sum + trade.pnl_percentage, 0) / completedTrades.length
    : 0;

  // Calculate profit/loss by symbol
  const uniqueSymbols = Array.from(new Set(matchedTrades.map(trade => trade.symbol)));
  const symbolStats = uniqueSymbols.map(symbol => {
    const symbolTrades = matchedTrades.filter(trade => trade.symbol === symbol);
    const symbolCompleted = symbolTrades.filter(trade => trade.result.status !== 'HOLDING');
    const avgProfit = symbolCompleted.length > 0
      ? symbolCompleted.reduce((sum, trade) => sum + trade.pnl_percentage, 0) / symbolCompleted.length
      : 0;
    
    return {
      symbol,
      avgProfit,
      totalTrades: symbolTrades.length,
      completedTrades: symbolCompleted.length
    };
  });

  // Find symbol with highest profit
  const highestProfitSymbol = symbolStats.length > 0
    ? symbolStats.reduce((a, b) => a.avgProfit > b.avgProfit ? a : b)
    : null;

  // Find symbol with highest loss (most negative profit)
  const highestLossSymbol = symbolStats.length > 0
    ? symbolStats.reduce((a, b) => a.avgProfit < b.avgProfit ? a : b)
    : null;

  // Get unique symbols for other stats
  const mostTradedSymbol = uniqueSymbols.length > 0 
    ? uniqueSymbols.reduce((a, b) => 
        matchedTrades.filter(t => t.symbol === a).length > matchedTrades.filter(t => t.symbol === b).length ? a : b
      )
    : 'N/A';

  return (
    <div className="space-y-6">
      {/* Detailed Stats - Reordered as requested: Hiệu Suất Tài chính first, then Thống kê giao dịch, then Thống kê Tín hiệu */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Hiệu Suất Tài chính - Updated with 3 specific metrics */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Hiệu Suất Tài Chính</h3>
              <p className="text-sm text-gray-600">Kết quả tài chính theo mã CK</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Lợi nhuận trung bình (%):</span>
              <span className={`font-medium ${avgProfitPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {avgProfitPercentage >= 0 ? '+' : ''}{avgProfitPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Mã lợi nhuận cao nhất (%):</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-green-600">
                  {highestProfitSymbol ? highestProfitSymbol.symbol : 'N/A'}
                </span>
                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                  {highestProfitSymbol ? `${highestProfitSymbol.avgProfit >= 0 ? '+' : ''}${highestProfitSymbol.avgProfit.toFixed(1)}%` : '0%'}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Mã lỗ nhiều nhất (%):</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-red-600">
                  {highestLossSymbol ? highestLossSymbol.symbol : 'N/A'}
                </span>
                <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
                  {highestLossSymbol ? `${highestLossSymbol.avgProfit >= 0 ? '+' : ''}${highestLossSymbol.avgProfit.toFixed(1)}%` : '0%'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Thống Kê Giao Dịch - Second position */}
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

        {/* Thống Kê Tín Hiệu - Third position */}
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
      </div>
    </div>
  );
}