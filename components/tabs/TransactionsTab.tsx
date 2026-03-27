import { useState } from 'react';
import { MatchedTrade, FilterOptions } from '@/types/trading';
import TradesTable from '@/components/TradesTable';
import FiltersPopup from '@/components/FiltersPopup';
import { DollarSign, TrendingUp, Calendar, Package, Filter, Percent } from 'lucide-react';

interface TransactionsTabProps {
  matchedTrades: MatchedTrade[];
  filteredTrades: MatchedTrade[];
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
}

export default function TransactionsTab({
  matchedTrades,
  filteredTrades,
  filters,
  onFilterChange
}: TransactionsTabProps) {
  const [showFilters, setShowFilters] = useState(false);
  
  // Calculate transaction statistics
  const completedTrades = matchedTrades.filter(trade => trade.result.status !== 'HOLDING');
  const holdingTrades = matchedTrades.filter(trade => trade.result.status === 'HOLDING');
  const winningTrades = completedTrades.filter(trade => trade.result.status === 'WIN');
  const losingTrades = completedTrades.filter(trade => trade.result.status === 'LOSS');

  // Calculate total profit/loss
  const totalProfit = winningTrades.reduce((sum, trade) => sum + trade.pnl_absolute, 0);
  const totalLoss = losingTrades.reduce((sum, trade) => sum + Math.abs(trade.pnl_absolute), 0);
  const netProfit = totalProfit - totalLoss;

  // Calculate average profit percentage
  const avgProfitPercentage = completedTrades.length > 0
    ? completedTrades.reduce((sum, trade) => sum + trade.pnl_percentage, 0) / completedTrades.length
    : 0;

  // Calculate average holding days
  const completedWithDates = completedTrades.filter(trade => trade.holding_days !== null);
  const avgHoldingDays = completedWithDates.length > 0
    ? completedWithDates.reduce((sum, trade) => sum + (trade.holding_days || 0), 0) / completedWithDates.length
    : 0;

  // Get unique symbols
  const uniqueSymbols = Array.from(new Set(matchedTrades.map(trade => trade.symbol)));

  // Calculate average profit by symbol
  const symbolStats = uniqueSymbols.map(symbol => {
    const symbolTrades = matchedTrades.filter(trade => trade.symbol === symbol);
    const symbolCompleted = symbolTrades.filter(trade => trade.result.status !== 'HOLDING');
    const avgProfit = symbolCompleted.length > 0
      ? symbolCompleted.reduce((sum, trade) => sum + trade.pnl_percentage, 0) / symbolCompleted.length
      : 0;
    const symbolWins = symbolCompleted.filter(trade => trade.result.status === 'WIN').length;
    const winRate = symbolCompleted.length > 0 ? (symbolWins / symbolCompleted.length) * 100 : 0;
    
    return {
      symbol,
      avgProfit,
      winRate,
      totalTrades: symbolTrades.length,
      completedTrades: symbolCompleted.length
    };
  }).sort((a, b) => b.avgProfit - a.avgProfit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Giao Dịch</h2>
          <p className="text-sm text-gray-600">Danh sách và thống kê giao dịch đã thực hiện</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
            Hiển thị <span className="font-bold">{filteredTrades.length}</span> giao dịch
          </div>
          <button
            onClick={() => setShowFilters(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Filter className="h-4 w-4" />
            Bộ Lọc
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-blue-600 font-medium">Tổng Giao Dịch</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{matchedTrades.length}</p>
            </div>
            <Package className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Đã hoàn thành: {completedTrades.length}</span>
            <span>Đang nắm giữ: {holdingTrades.length}</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-green-600 font-medium">Lợi Nhuận TB (%)</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {avgProfitPercentage.toFixed(1)}%
              </p>
            </div>
            <Percent className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Lãi: {totalProfit.toLocaleString('vi-VN')}</span>
            <span>Lỗ: {totalLoss.toLocaleString('vi-VN')}</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-purple-600 font-medium">Tỷ Lệ Thắng</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {completedTrades.length > 0
                  ? ((winningTrades.length / completedTrades.length) * 100).toFixed(1)
                  : '0'}%
              </p>
            </div>
            <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Thắng: {winningTrades.length}</span>
            <span>Thua: {losingTrades.length}</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-amber-600 font-medium">Ngày Nắm Giữ TB</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{avgHoldingDays.toFixed(1)}</p>
            </div>
            <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-amber-500" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Số ngày nắm giữ trung bình</p>
        </div>
      </div>

      {/* Average Profit by Symbol */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Lợi Nhuận Trung Bình Theo Mã CK</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {symbolStats.slice(0, 6).map((stat, index) => (
            <div key={stat.symbol} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">{stat.symbol}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${stat.avgProfit >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {stat.avgProfit >= 0 ? '+' : ''}{stat.avgProfit.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {stat.completedTrades} giao dịch đã hoàn thành
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${stat.winRate >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.winRate.toFixed(0)}% thắng
                  </div>
                  <div className="text-xs text-gray-500">
                    {stat.totalTrades} giao dịch
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full ${stat.avgProfit >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(Math.abs(stat.avgProfit) * 2, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        {symbolStats.length > 6 && (
          <div className="text-center text-sm text-gray-500 mt-4">
            +{symbolStats.length - 6} mã chứng khoán khác
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Danh Sách Giao Dịch</h3>
            <p className="text-sm text-gray-600">Các giao dịch đã được khớp với tín hiệu</p>
          </div>
          <button
            onClick={() => setShowFilters(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="h-4 w-4" />
            Bộ Lọc
          </button>
        </div>
        <TradesTable trades={filteredTrades} />
        
        {/* Summary Footer */}
        {filteredTrades.length > 0 && (
          <div className="p-4 bg-gray-50 border-t">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
              <div className="text-sm text-gray-600">
                Hiển thị <span className="font-medium">{filteredTrades.length}</span> giao dịch
                {filters.symbol !== 'ALL' && ` cho mã ${filters.symbol}`}
              </div>
              <div className="text-sm text-gray-600">
                Lợi nhuận trung bình: <span className={`font-medium ${avgProfitPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {avgProfitPercentage >= 0 ? '+' : ''}{avgProfitPercentage.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Performance Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tóm Tắt Hiệu Suất</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Phân Phối Kết Quả</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Giao dịch thắng</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{winningTrades.length}</span>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${completedTrades.length > 0 ? (winningTrades.length / completedTrades.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Giao dịch thua</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{losingTrades.length}</span>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${completedTrades.length > 0 ? (losingTrades.length / completedTrades.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Đang nắm giữ</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{holdingTrades.length}</span>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${matchedTrades.length > 0 ? (holdingTrades.length / matchedTrades.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Thống Kê Chi Tiết</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tổng số mã CK:</span>
                <span className="font-medium">{uniqueSymbols.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Giao dịch đang nắm giữ:</span>
                <span className="font-medium text-blue-600">{holdingTrades.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Giao dịch đã hoàn thành:</span>
                <span className="font-medium text-green-600">{completedTrades.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Lợi nhuận ròng:</span>
                <span className={`font-medium ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {netProfit >= 0 ? '+' : ''}{netProfit.toLocaleString('vi-VN')} VND
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Popup */}
      <FiltersPopup
        filters={filters}
        onFilterChange={onFilterChange}
        symbols={uniqueSymbols}
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
      />
    </div>
  );
}