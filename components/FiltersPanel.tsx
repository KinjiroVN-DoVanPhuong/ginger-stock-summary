import { Filter, Calendar, X } from 'lucide-react';
import { FilterOptions } from '@/types/trading';
import { useLanguage } from '@/contexts/LanguageContext';

interface FiltersPanelProps {
    filters: FilterOptions;
    onFilterChange: (filters: FilterOptions) => void;
    symbols: string[];
}

export default function FiltersPanel({ filters, onFilterChange, symbols }: FiltersPanelProps) {
    const { t } = useLanguage();
    const handleSymbolChange = (symbol: string) => {
        onFilterChange({ ...filters, symbol });
    };

    const handleStatusChange = (status: 'ALL' | 'SOLD' | 'HOLDING') => {
        // Convert SOLD to include both WIN and LOSS
        let filterStatus: FilterOptions['status'];
        if (status === 'SOLD') {
            // We need a special value to indicate SOLD (both WIN and LOSS)
            // We'll use 'WIN' as a placeholder, but we need to handle filtering differently
            filterStatus = 'WIN'; // This will be handled in the trading service
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

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-gray-500" />
                    <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.filters')}</h3>
                </div>

                {hasActiveFilters() && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                    >
                        <X className="h-4 w-4" />
                        {t('filters.clear')}
                    </button>
                )}
            </div>

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
                        // Determine if this button should appear active
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
                        <Calendar className="h-4 w-4" />
                        {t('filters.startDate')} - {t('filters.endDate')}
                    </div>
                </label>

                <div className="space-y-3">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">{t('filters.startDate')}</label>
                        <input
                            type="date"
                            value={filters.startDate || ''}
                            onChange={(e) => handleDateChange('startDate', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-gray-500 mb-1">{t('filters.endDate')}</label>
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
                    <h4 className="text-sm font-medium text-gray-700 mb-2">{t('filters.activeFilters')}</h4>
                    <div className="flex flex-wrap gap-2">
                        {filters.symbol !== 'ALL' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                {t('table.symbol')}: {filters.symbol}
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
                                {t('table.status')}: {filters.status === 'WIN' || filters.status === 'LOSS' ? t('status.sold') : t('status.holding')}
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
                                {t('filters.startDate')}: {new Date(filters.startDate).toLocaleDateString()}
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
                                {t('filters.endDate')}: {new Date(filters.endDate).toLocaleDateString()}
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

            {/* Filter Stats */}
            <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Mẹo Sử Dụng Bộ Lọc</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Sử dụng khoảng thời gian để phân tích các giai đoạn cụ thể</li>
                    <li>• Lọc theo mã để tập trung vào cổ phiếu cụ thể</li>
                    <li>• Bộ lọc trạng thái giúp phân tích mẫu thắng/thua</li>
                    <li>• Tất cả bộ lọc hoạt động cùng nhau để phân tích chính xác</li>
                </ul>
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
