import { ArrowUpRight, ArrowDownRight, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { MatchedTrade } from '@/types/trading';
import { useLanguage } from '@/contexts/LanguageContext';
import TermInfoIcon from './TermInfoIcon';

interface TradesTableProps {
    trades: MatchedTrade[];
}

export default function TradesTable({ trades }: TradesTableProps) {
    const { t } = useLanguage();
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'WIN':
            case 'LOSS':
                return 'bg-purple-100 text-purple-800';
            case 'HOLDING':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getPnlColor = (pnl: number) => {
        if (pnl > 0) return 'text-green-600';
        if (pnl < 0) return 'text-red-600';
        return 'text-gray-600';
    };

    const getPnlIcon = (pnl: number) => {
        if (pnl > 0) return <ArrowUpRight className="h-4 w-4" />;
        if (pnl < 0) return <ArrowDownRight className="h-4 w-4" />;
        return null;
    };

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.tradesTable')}</h2>
                        <p className="text-sm text-gray-500">Tín hiệu giao dịch đã khớp với kết quả thực hiện</p>
                    </div>
                    <div className="text-sm text-gray-500">
                        Hiển thị {trades.length} {trades.length === 1 ? 'giao dịch' : 'giao dịch'}
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('table.symbol')}
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('table.buyPrice')}
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('table.sellPrice')}
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('table.pnl')}
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('table.status')}
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('table.buyDate')}
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('table.sellDate')}
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('table.riskReward')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {trades.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <Clock className="h-12 w-12 text-gray-300 mb-4" />
                                        <p className="text-lg font-medium">Không tìm thấy giao dịch</p>
                                        <p className="text-sm">Thử điều chỉnh bộ lọc của bạn</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            trades.map((trade, index) => (
                                <tr key={index} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <span className="text-blue-600 font-bold">{trade.symbol.charAt(0)}</span>
                                            </div>
                                            <div className="ml-3">
                                                <div className="text-sm font-medium text-gray-900">{trade.symbol}</div>
                                                <div className="text-xs text-gray-500">
                                                    Độ tin cậy: {trade.signal.confidence.toFixed(1)}%
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{formatCurrency(trade.result.buy_price)}</div>
                                        <div className="text-xs text-gray-500">
                                            Giá vào: {formatCurrency(trade.signal.entry_price)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {trade.result.sell_price ? (
                                            <>
                                                <div className="text-sm text-gray-900">{formatCurrency(trade.result.sell_price)}</div>
                                                <div className="text-xs text-gray-500">
                                                    Mục tiêu: {formatCurrency(trade.signal.take_profit_price)}
                                                </div>
                                            </>
                                        ) : (
                                            <span className="text-sm text-gray-400">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className={`flex items-center ${getPnlColor(trade.pnl_absolute)}`}>
                                            {getPnlIcon(trade.pnl_absolute)}
                                            <span className="ml-1 font-medium">
                                                {formatCurrency(trade.pnl_absolute)}
                                            </span>
                                        </div>
                                        <div className={`text-xs ${getPnlColor(trade.pnl_absolute)}`}>
                                            {trade.pnl_percentage > 0 ? '+' : ''}{trade.pnl_percentage.toFixed(2)}%
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(trade.result.status)}`}>
                                            {trade.result.status === 'HOLDING' && <Clock className="h-3 w-3 mr-1" />}
                                            {(trade.result.status === 'WIN' || trade.result.status === 'LOSS') && <TrendingUp className="h-3 w-3 mr-1" />}
                                            {trade.result.status === 'WIN' || trade.result.status === 'LOSS' ? t('status.sold') : t('status.holding')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(trade.result.buy_date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(trade.result.sell_date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{trade.risk_reward.toFixed(2)}</div>
                                        <div className="text-xs text-gray-500">
                                            {trade.holding_days ? `${trade.holding_days}d` : '—'}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {trades.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <div>
                            <span className="font-medium">Tóm tắt:</span>
                            <span className="ml-2">
                                {trades.filter(t => t.result.status === 'WIN' || t.result.status === 'LOSS').length} Đã bán,
                                {trades.filter(t => t.result.status === 'HOLDING').length} Đang nắm giữ
                            </span>
                        </div>
                        <div>
                            Tổng P&L:
                            <span className={`ml-2 font-medium ${trades.reduce((sum, t) => sum + t.pnl_absolute, 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(trades.reduce((sum, t) => sum + t.pnl_absolute, 0))}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}