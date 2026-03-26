import { MatchedTrade, FilterOptions } from '@/types/trading';
import TradesTable from '@/components/TradesTable';
import FiltersPanel from '@/components/FiltersPanel';
import { DollarSign, TrendingUp, Calendar, Package } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

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
  // Calculate transaction statistics
  const completedTrades = matchedTrades.filter(trade => trade.result.status !== 'HOLDING');
  const holdingTrades = matchedTrades.filter(trade => trade.result.status === 'HOLDING');
  const winningTrades = completedTrades.filter(trade => trade.result.status === 'WIN');
  const losingTrades = completedTrades.filter(trade => trade.result.status === 'LOSS');

  // Calculate total profit/loss
  const totalProfit = winningTrades.reduce((sum, trade) => sum + trade.pnl_absolute, 0);
  const totalLoss = losingTrades.reduce((sum, trade) => sum + Math.abs(trade.pnl_absolute), 0);
  const netProfit = totalProfit - totalLoss;

  // Calculate average holding days
  const completedWithDates = completedTrades.filter(trade => trade.holding_days !== null);
  const avgHoldingDays = completedWithDates.length > 0
    ? completedWithDates.reduce((sum, trade) => sum + (trade.holding_days || 0), 0) / completedWithDates.length
    : 0;

  // Get unique symbols
  const uniqueSymbols = Array.from(new Set(matchedTrades.map(trade => trade.symbol)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Giao Dịch</h2>
          <p className="text-sm text-gray-600">Danh sách và thống kê giao dịch đã thực hiện</p>
        </div>
        <div className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
          Hiển thị <span className="font-bold">{filteredTrades.length}</span> giao dịch
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
              <p className="text-xs sm:text-sm text-green-600 font-medium">Lợi Nhuận Ròng</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {netProfit >= 0 ? '+' : ''}{netProfit.toLocaleString('vi-VN')} VND
              </p>
            </div>
            <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
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

      {/* Filters and Table */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bộ Lọc Giao Dịch</h3>
            <FiltersPanel
              filters={filters}
              onFilterChange={onFilterChange}
              symbols={uniqueSymbols}
            />
          </div>

          {/* Additional Stats */}
          <div className="mt-6 bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thống Kê Chi Tiết</h3>
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
                <span className="text-sm text-gray-600">Lợi nhuận trung bình:</span>
                <span className={`font-medium ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {completedTrades.length > 0 ? (netProfit / completedTrades.length).toLocaleString('vi-VN') : '0'} VND
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Danh Sách Giao Dịch</h3>
              <p className="text-sm text-gray-600">Các giao dịch đã được khớp với tín hiệu</p>
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
                    Tổng lợi nhuận: <span className={`font-medium ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {netProfit >= 0 ? '+' : ''}{netProfit.toLocaleString('vi-VN')} VND
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
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
            <h4 className="text-sm font-medium text-gray-700 mb-2">Thống Kê Theo Mã CK</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {uniqueSymbols.slice(0, 5).map(symbol => {
                const symbolTrades = matchedTrades.filter(trade => trade.symbol === symbol);
                const symbolWins = symbolTrades.filter(trade => trade.result.status === 'WIN').length;
                const symbolCompleted = symbolTrades.filter(trade => trade.result.status !== 'HOLDING').length;
                const winRate = symbolCompleted > 0 ? (symbolWins / symbolCompleted) * 100 : 0;
                
                return (
                  <div key={symbol} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                    <span className="text-sm font-medium text-gray-900">{symbol}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">{symbolTrades.length} giao dịch</span>
                      <span className={`text-xs font-medium ${winRate >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                        {winRate.toFixed(0)}% thắng
                      </span>
                    </div>
                  </div>
                );
              })}
              {uniqueSymbols.length > 5 && (
                <div className="text-center text-xs text-gray-500 pt-2">
                  +{uniqueSymbols.length - 5} mã chứng khoán khác
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}