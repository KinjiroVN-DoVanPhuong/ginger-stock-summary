import { Filter, X } from 'lucide-react';
import { FilterOptions } from '@/types/trading';
import { useLanguage } from '@/contexts/LanguageContext';

interface FiltersPopupProps {
    filters: FilterOptions;
    onFilterChange: (filters: FilterOptions) => void;
    symbols: string[];
    isOpen: boolean;
    onClose: () => void;
}

export default function FiltersPopup({ filters, onFilterChange, symbols, isOpen, onClose }: FiltersPopupProps) {
    const { t } = useLanguage();
    
    const handleSymbolChange = (symbol: string) => {
        onFilterChange({ ...filters, symbol });
    };

    const handleStatusChange = (status: 'ALL' | 'SOLD' | 'HOLDING') => {
        let filterStatus: FilterOptions['status'];
        if (status === 'SOLD') {
            filterStatus = 'WIN';
        } else if (status === 'HOLDING') {
            filterStatus = 'HOLDING';
        } else {
            filterStatus = 'ALL';
        }
        onFilterChange({ ...filters, status: filterStatus });
    };

    const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
        onFilterChange({ ...filters, [field]: value || null });
    };

    const clearFilters = () => {
        onFilterChange({
            symbol: 'ALL',
            startDate: null,
            endDate: null,
            status: 'ALL'
        });
    };

    const hasActiveFilters = () => {
        return filters.symbol !== 'ALL' ||
            filters.status !== 'ALL' ||
            filters.startDate !== null ||
            filters.endDate !== null;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
            
            {/* Modal */}
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b">
                        <div className="flex items-center gap-2">
                            <Filter className="h-5 w-5 text-gray-500" />
                            <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.filters')}</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 max-h-[70vh] overflow-y-auto">
                        {/* Symbol Filter */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('table.symbol')}
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => handleSymbolChange('ALL')}
                                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${filters.symbol === 'ALL'
                                        ? 'bg-blue-100 text-blue-700 font-medium'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {t('filters.allSymbols')}
                                </button>

                                {symbols.slice(0, 5).map((symbol) => (
                                    <button
                                        key={symbol}
                                        onClick={() => handleSymbolChange(symbol)}
                                        className={`px-3 py-2 text-sm rounded-lg transition-colors ${filters.symbol === symbol
                                            ? 'bg-blue-100 text-blue-700 font-medium'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {symbol}
                                    </button>
                                ))}

                                {symbols.length > 5 && (
                                    <div className="col-span-2">
                                        <select
                                            value={filters.symbol}
                                            onChange={(e) => handleSymbolChange(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="ALL">{t('filters.allSymbols')}</option>
                                            {symbols.map((symbol) => (
                                                <option key={symbol} value={symbol}>
                                                    {symbol}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('table.status')}
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {(['ALL', 'SOLD', 'HOLDING'] as const).map((status) => {
                                    const isActive = status === 'ALL'
                                        ? filters.status === 'ALL'
                                        : status === 'SOLD'
                                            ? filters.status === 'WIN' || filters.status === 'LOSS'
                                            : filters.status === 'HOLDING';

                                    return (
                                        <button
                                            key={status}
                                            onClick={() => handleStatusChange(status)}
                                            className={`px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-center gap-1 ${isActive
                                                ? getStatusColor(status, true)
                                                : getStatusColor(status, false)
                                                }`}
                                        >
                                            {status === 'ALL' && t('filters.allStatus')}
                                            {status === 'SOLD' && t('status.sold')}
                                            {status === 'HOLDING' && t('status.holding')}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Date Range Filter */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <div className="flex items-center gap-2">
                                    <span>Khoảng thời gian</span>
                                </div>
                            </label>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Từ ngày</label>
                                    <input
                                        type="date"
                                        value={filters.startDate || ''}
                                        onChange={(e) => handleDateChange('startDate', e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Đến ngày</label>
                                    <input
                                        type="date"
                                        value={filters.endDate || ''}
                                        onChange={(e) => handleDateChange('endDate', e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Active Filters Summary */}
                        {hasActiveFilters() && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Bộ lọc đang áp dụng</h4>
                                <div className="flex flex-wrap gap-2">
                                    {filters.symbol !== 'ALL' && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                            Mã: {filters.symbol}
                                            <button
                                                onClick={() => handleSymbolChange('ALL')}
                                                className="ml-1 text-blue-600 hover:text-blue-800"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    )}

                                    {filters.status !== 'ALL' && (
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${filters.status === 'WIN' || filters.status === 'LOSS' ? getStatusColor('SOLD', true) : getStatusColor(filters.status, true)}`}>
                                            Trạng thái: {filters.status === 'WIN' || filters.status === 'LOSS' ? 'Đã bán' : 'Đang nắm giữ'}
                                            <button
                                                onClick={() => handleStatusChange('ALL')}
                                                className="ml-1"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    )}

                                    {filters.startDate && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                                            Từ: {new Date(filters.startDate).toLocaleDateString('vi-VN')}
                                            <button
                                                onClick={() => handleDateChange('startDate', '')}
                                                className="ml-1 text-gray-600 hover:text-gray-800"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    )}

                                    {filters.endDate && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                                            Đến: {new Date(filters.endDate).toLocaleDateString('vi-VN')}
                                            <button
                                                onClick={() => handleDateChange('endDate', '')}
                                                className="ml-1 text-gray-600 hover:text-gray-800"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center p-4 border-t">
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Xóa tất cả bộ lọc
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Áp dụng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function getStatusColor(status: string, isActive: boolean) {
    if (!isActive) {
        return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
    }

    switch (status) {
        case 'WIN':
            return 'bg-green-100 text-green-800';
        case 'LOSS':
            return 'bg-red-100 text-red-800';
        case 'SOLD':
            return 'bg-purple-100 text-purple-800';
        case 'HOLDING':
            return 'bg-blue-100 text-blue-800';
        default:
            return 'bg-blue-100 text-blue-800';
    }
}