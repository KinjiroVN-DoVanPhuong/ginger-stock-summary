'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Filter, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { tradingService } from '@/services/tradingService';
import { TradingSignal } from '@/types/trading';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function SignalsPage() {
    const { t } = useLanguage();
    const [tradingSignals, setTradingSignals] = useState<TradingSignal[]>([]);
    const [filteredSignals, setFilteredSignals] = useState<TradingSignal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        symbol: '',
    });

    // Load data on component mount
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const signals = await tradingService.getTradingSignals();
                
                // Sort by date (newest first)
                const sortedSignals = signals.sort((a, b) => {
                    const dateA = a.date ? new Date(a.date).getTime() : (a.timestamp || 0);
                    const dateB = b.date ? new Date(b.date).getTime() : (b.timestamp || 0);
                    return dateB - dateA;
                });
                
                setTradingSignals(sortedSignals);
                setFilteredSignals(sortedSignals);
            } catch (err) {
                console.error('Error loading trading signals:', err);
                setError('Không thể tải dữ liệu tín hiệu giao dịch. Vui lòng kiểm tra kết nối Firebase của bạn.');
            } finally {
                setLoading(false);
            }
        };

        loadData();

        // Set up real-time listener
        const unsubscribe = tradingService.subscribeToTradingSignals((signals) => {
            const sortedSignals = signals.sort((a, b) => {
                const dateA = a.date ? new Date(a.date).getTime() : (a.timestamp || 0);
                const dateB = b.date ? new Date(b.date).getTime() : (b.timestamp || 0);
                return dateB - dateA;
            });
            setTradingSignals(sortedSignals);
            applyFilters(sortedSignals, filters);
        });

        // Cleanup subscription
        return () => unsubscribe();
    }, []);

    // Apply filters when they change
    useEffect(() => {
        applyFilters(tradingSignals, filters);
    }, [filters, tradingSignals]);

    const applyFilters = (signals: TradingSignal[], currentFilters: typeof filters) => {
        let filtered = [...signals];

        // Filter by symbol
        if (currentFilters.symbol) {
            filtered = filtered.filter(signal => 
                signal.symbol.toLowerCase().includes(currentFilters.symbol.toLowerCase())
            );
        }

        // Filter by date range
        if (currentFilters.startDate) {
            const startDate = new Date(currentFilters.startDate);
            filtered = filtered.filter(signal => {
                const signalDate = signal.date ? new Date(signal.date) : (signal.timestamp ? new Date(signal.timestamp) : null);
                return signalDate && signalDate >= startDate;
            });
        }

        if (currentFilters.endDate) {
            const endDate = new Date(currentFilters.endDate);
            endDate.setHours(23, 59, 59, 999); // End of day
            filtered = filtered.filter(signal => {
                const signalDate = signal.date ? new Date(signal.date) : (signal.timestamp ? new Date(signal.timestamp) : null);
                return signalDate && signalDate <= endDate;
            });
        }

        setFilteredSignals(filtered);
    };

    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            startDate: '',
            endDate: '',
            symbol: '',
        });
    };

    const formatDate = (signal: TradingSignal) => {
        if (signal.date) {
            try {
                return format(new Date(signal.date), 'dd/MM/yyyy', { locale: vi });
            } catch (error) {
                return signal.date;
            }
        }
        if (signal.timestamp) {
            return format(new Date(signal.timestamp), 'dd/MM/yyyy', { locale: vi });
        }
        return 'N/A';
    };

    const getConfidenceColor = (confidence: number) => {
        // Handle both percentage (0-100) and decimal (0-1) formats
        const confidenceValue = confidence < 1 ? confidence * 100 : confidence;
        if (confidenceValue >= 80) return 'bg-green-100 text-green-800';
        if (confidenceValue >= 60) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải tín hiệu giao dịch...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
                    <div className="text-red-500 text-4xl mb-4">⚠️</div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Lỗi Kết Nối</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Quay lại trang chủ
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header - Mobile Optimized */}
            <header className="bg-white shadow sticky top-0 z-10">
                <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-3">
                            <Link
                                href="/"
                                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors active:scale-95"
                                aria-label="Quay lại trang chủ"
                            >
                                <ArrowLeft className="h-5 w-5 text-gray-700" />
                            </Link>
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Tín Hiệu Giao Dịch</h1>
                                <p className="text-sm sm:text-base text-gray-600 truncate">Danh sách tín hiệu giao dịch AI</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-2">
                            <div className="text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                                <span className="font-medium">{filteredSignals.length}</span> tín hiệu
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
                {/* Filters Panel - Mobile Optimized */}
                <div className="bg-white rounded-lg shadow mb-4 sm:mb-6">
                    <div className="p-4 sm:p-6 border-b">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Filter className="h-5 w-5 text-gray-500" />
                                <h2 className="text-lg font-semibold text-gray-900">Bộ Lọc</h2>
                            </div>
                            <button
                                onClick={clearFilters}
                                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors active:scale-95"
                            >
                                Xóa tất cả
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Symbol Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Mã Chứng Khoán
                                </label>
                                <input
                                    type="text"
                                    value={filters.symbol}
                                    onChange={(e) => handleFilterChange('symbol', e.target.value)}
                                    placeholder="VD: VN30, VIC, VHM..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                                />
                            </div>

                            {/* Date Range Filters */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Start Date Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Từ Ngày
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="date"
                                            value={filters.startDate}
                                            onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                                        />
                                    </div>
                                </div>

                                {/* End Date Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Đến Ngày
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="date"
                                            value={filters.endDate}
                                            onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Active Filters */}
                    {(filters.symbol || filters.startDate || filters.endDate) && (
                        <div className="p-4 bg-blue-50 border-b">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium text-blue-700">Bộ lọc đang hoạt động:</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {filters.symbol && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                                        Mã: {filters.symbol}
                                    </span>
                                )}
                                {filters.startDate && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                                        Từ: {format(new Date(filters.startDate), 'dd/MM/yyyy', { locale: vi })}
                                    </span>
                                )}
                                {filters.endDate && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                                        Đến: {format(new Date(filters.endDate), 'dd/MM/yyyy', { locale: vi })}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Signals Display - Mobile Cards & Desktop Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {filteredSignals.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className="text-gray-400 text-4xl mb-4">📊</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy tín hiệu</h3>
                            <p className="text-gray-600">
                                {tradingSignals.length === 0 
                                    ? 'Chưa có tín hiệu giao dịch nào trong hệ thống.'
                                    : 'Không có tín hiệu nào phù hợp với bộ lọc hiện tại.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile Cards View */}
                            <div className="md:hidden">
                                <div className="divide-y divide-gray-200">
                                    {filteredSignals.map((signal) => (
                                        <div key={signal.id} className="p-4 hover:bg-gray-50 transition-colors">
                                            {/* Header Row */}
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-sm font-bold text-gray-900">{signal.symbol}</span>
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getConfidenceColor(signal.confidence)}`}>
                                                            {signal.confidence < 1 ? (signal.confidence * 100).toFixed(1) : signal.confidence.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-gray-500">{formatDate(signal)}</div>
                                                </div>
                                            </div>

                                            {/* Price Information */}
                                            <div className="grid grid-cols-3 gap-3 mb-3">
                                                <div className="text-center">
                                                    <div className="text-xs text-gray-500 mb-1">Giá Vào</div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {signal.entry_price.toLocaleString('vi-VN')}
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-xs text-gray-500 mb-1">Mục Tiêu</div>
                                                    <div className="text-sm font-medium text-green-600">
                                                        {signal.take_profit_price.toLocaleString('vi-VN')}
                                                    </div>
                                                    <div className="text-xs text-green-500">
                                                        +{(((signal.take_profit_price - signal.entry_price) / signal.entry_price) * 100).toFixed(2)}%
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-xs text-gray-500 mb-1">Cắt Lỗ</div>
                                                    <div className="text-sm font-medium text-red-600">
                                                        {signal.stop_loss_price.toLocaleString('vi-VN')}
                                                    </div>
                                                    <div className="text-xs text-red-500">
                                                        -{(((signal.entry_price - signal.stop_loss_price) / signal.entry_price) * 100).toFixed(2)}%
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Reason */}
                                            <div className="text-sm text-gray-700">
                                                <div className="text-xs text-gray-500 mb-1">Lý do:</div>
                                                <div className="line-clamp-2">{signal.reason || 'Không có lý do cụ thể'}</div>
                                            </div>
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
                                                    Ngày
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Mã CK
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Giá Vào
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Mục Tiêu
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Cắt Lỗ
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Độ Tin Cậy
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Lý Do
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredSignals.map((signal) => (
                                                <tr key={signal.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {formatDate(signal)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-bold text-gray-900">
                                                            {signal.symbol}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {signal.entry_price.toLocaleString('vi-VN')}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-green-600">
                                                            {signal.take_profit_price.toLocaleString('vi-VN')}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            +{(((signal.take_profit_price - signal.entry_price) / signal.entry_price) * 100).toFixed(2)}%
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-red-600">
                                                            {signal.stop_loss_price.toLocaleString('vi-VN')}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            -{(((signal.entry_price - signal.stop_loss_price) / signal.entry_price) * 100).toFixed(2)}%
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConfidenceColor(signal.confidence)}`}>
                                                            {signal.confidence < 1 ? (signal.confidence * 100).toFixed(1) : signal.confidence.toFixed(1)}%
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-700 max-w-xs">
                                                            {signal.reason || 'Không có lý do cụ thể'}
                                                        </div>
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
                    {filteredSignals.length > 0 && (
                        <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t">
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                                <div className="text-sm text-gray-600">
                                    Hiển thị <span className="font-medium">{filteredSignals.length}</span> tín hiệu
                                </div>
                                <div className="text-sm text-gray-600">
                                    Độ tin cậy trung bình: <span className="font-medium">
                                        {(() => {
                                            const totalConfidence = filteredSignals.reduce((sum, signal) => {
                                                return sum + (signal.confidence < 1 ? signal.confidence * 100 : signal.confidence);
                                            }, 0);
                                            return (totalConfidence / filteredSignals.length).toFixed(1);
                                        })()}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats Cards - Mobile Optimized */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 sm:p-6 rounded-lg border border-blue-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm text-blue-600 font-medium">Tổng Tín Hiệu</p>
                                <p className="text-xl sm:text-2xl font-bold text-gray-900">{tradingSignals.length}</p>
                            </div>
                            <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Tín hiệu giao dịch trong hệ thống</p>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-6 rounded-lg border border-green-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm text-green-600 font-medium">Độ Tin Cậy TB</p>
                                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                    {(() => {
                                        if (tradingSignals.length === 0) return '0%';
                                        const totalConfidence = tradingSignals.reduce((sum, signal) => {
                                            return sum + (signal.confidence < 1 ? signal.confidence * 100 : signal.confidence);
                                        }, 0);
                                        return (totalConfidence / tradingSignals.length).toFixed(1) + '%';
                                    })()}
                                </p>
                            </div>
                            <div className="h-6 w-6 sm:h-8 sm:w-8 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-green-600 font-bold text-sm sm:text-base">✓</span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Độ tin cậy trung bình của tín hiệu</p>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 sm:p-6 rounded-lg border border-purple-100 sm:col-span-2 lg:col-span-1">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm text-purple-600 font-medium">Mã CK Phổ Biến</p>
                                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                    {(() => {
                                        const symbolCounts: Record<string, number> = {};
                                        tradingSignals.forEach(signal => {
                                            symbolCounts[signal.symbol] = (symbolCounts[signal.symbol] || 0) + 1;
                                        });
                                        const mostCommon = Object.entries(symbolCounts).sort((a, b) => b[1] - a[1])[0];
                                        return mostCommon ? mostCommon[0] : 'N/A';
                                    })()}
                                </p>
                            </div>
                            <div className="flex gap-1">
                                <div className="h-6 w-1 sm:h-8 sm:w-2 bg-purple-400 rounded-full"></div>
                                <div className="h-6 w-1 sm:h-8 sm:w-2 bg-purple-400 rounded-full"></div>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Mã chứng khoán có nhiều tín hiệu nhất</p>
                    </div>
                </div>

                {/* Back to Dashboard - Mobile Optimized */}
                <div className="mt-6 sm:mt-8 text-center">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-3 w-full sm:w-auto bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors active:scale-95"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Quay lại Bảng Điều Khiển
                    </Link>
                </div>
            </div>
        </div>
    );
}
