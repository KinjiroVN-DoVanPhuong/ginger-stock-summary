'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Package, Calendar, X, Filter } from 'lucide-react';
import { tradingService } from '@/services/tradingService';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface StockHolding {
    symbol: string;
    total_bought_volume: number;
    total_sold_volume: number;
    average_buy_price: number;
    current_holding_volume: number;
    total_investment: number;
    current_value: number;
    profit_loss_percentage: number;
    profit_loss_amount: number;
}

interface SellForm {
    sell_price: string;
    volume: string;
    sell_date: string;
}

export default function AssetsTab() {
    const [holdings, setHoldings] = useState<StockHolding[]>([]);
    const [filteredHoldings, setFilteredHoldings] = useState<StockHolding[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
    const [showSellDialog, setShowSellDialog] = useState(false);
    const [sellForm, setSellForm] = useState<SellForm>({
        sell_price: '',
        volume: '',
        sell_date: format(new Date(), 'yyyy-MM-dd')
    });
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [filters, setFilters] = useState({
        symbol: '',
        minProfit: '',
        maxProfit: ''
    });

    // Load holdings on component mount
    useEffect(() => {
        loadHoldings();
        
        // Set up real-time listeners
        const unsubscribeBuy = tradingService.subscribeToBuyMonitoring(() => {
            loadHoldings();
        });
        
        const unsubscribeSell = tradingService.subscribeToSellMonitoring(() => {
            loadHoldings();
        });

        return () => {
            unsubscribeBuy();
            unsubscribeSell();
        };
    }, []);

    // Apply filters when they change
    useEffect(() => {
        applyFilters(holdings, filters);
    }, [filters, holdings]);

    const loadHoldings = async () => {
        try {
            setLoading(true);
            const data = await tradingService.getStockHoldings();
            setHoldings(data);
            applyFilters(data, filters);
        } catch (err) {
            console.error('Error loading stock holdings:', err);
            setError('Không thể tải dữ liệu tài sản. Vui lòng kiểm tra kết nối Firebase của bạn.');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = (holdings: StockHolding[], currentFilters: typeof filters) => {
        let filtered = [...holdings];

        // Filter by symbol
        if (currentFilters.symbol) {
            filtered = filtered.filter(holding =>
                holding.symbol.toLowerCase().includes(currentFilters.symbol.toLowerCase())
            );
        }

        // Filter by minimum profit percentage
        if (currentFilters.minProfit) {
            const minProfit = parseFloat(currentFilters.minProfit);
            if (!isNaN(minProfit)) {
                filtered = filtered.filter(holding => holding.profit_loss_percentage >= minProfit);
            }
        }

        // Filter by maximum profit percentage
        if (currentFilters.maxProfit) {
            const maxProfit = parseFloat(currentFilters.maxProfit);
            if (!isNaN(maxProfit)) {
                filtered = filtered.filter(holding => holding.profit_loss_percentage <= maxProfit);
            }
        }

        setFilteredHoldings(filtered);
    };

    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            symbol: '',
            minProfit: '',
            maxProfit: ''
        });
    };

    const handleSellClick = (symbol: string) => {
        setSelectedSymbol(symbol);
        const holding = holdings.find(h => h.symbol === symbol);
        if (holding) {
            setSellForm({
                sell_price: holding.average_buy_price.toFixed(2),
                volume: Math.min(100, holding.current_holding_volume).toString(),
                sell_date: format(new Date(), 'yyyy-MM-dd')
            });
        }
        setShowSellDialog(true);
        setSaveMessage(null);
    };

    const handleSellFormChange = (key: keyof typeof sellForm, value: string) => {
        setSellForm(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSaveSell = async () => {
        if (!selectedSymbol) {
            setSaveMessage({ type: 'error', text: 'Không tìm thấy mã chứng khoán' });
            return;
        }

        // Validate form
        if (!sellForm.sell_price || !sellForm.volume || !sellForm.sell_date) {
            setSaveMessage({ type: 'error', text: 'Vui lòng điền đầy đủ thông tin' });
            return;
        }

        const sellPrice = parseFloat(sellForm.sell_price);
        const volume = parseInt(sellForm.volume);

        if (isNaN(sellPrice) || sellPrice <= 0) {
            setSaveMessage({ type: 'error', text: 'Giá bán phải là số dương' });
            return;
        }

        if (isNaN(volume) || volume <= 0) {
            setSaveMessage({ type: 'error', text: 'Khối lượng phải là số dương' });
            return;
        }

        // Check if we have enough volume to sell
        const holding = holdings.find(h => h.symbol === selectedSymbol);
        if (holding && volume > holding.current_holding_volume) {
            setSaveMessage({ 
                type: 'error', 
                text: `Khối lượng bán (${volume}) vượt quá số lượng đang nắm giữ (${holding.current_holding_volume})` 
            });
            return;
        }

        try {
            setIsSaving(true);
            setSaveMessage(null);

            // Get buy monitoring records for this symbol to find the buy_monitoring_id
            const buyMonitoring = await tradingService.getBuyMonitoringBySymbol(selectedSymbol);
            if (buyMonitoring.length === 0) {
                setSaveMessage({ type: 'error', text: 'Không tìm thấy thông tin mua cho mã này' });
                return;
            }

            // For simplicity, use the first buy monitoring record
            // In a real app, you might want to implement FIFO or specific lot selection
            const buyMonitoringId = buyMonitoring[0].id;
            if (!buyMonitoringId) {
                setSaveMessage({ type: 'error', text: 'Không tìm thấy ID giao dịch mua' });
                return;
            }

            const sellData = {
                buy_monitoring_id: buyMonitoringId,
                symbol: selectedSymbol,
                sell_price: sellPrice,
                volume: volume,
                sell_date: sellForm.sell_date
            };

            await tradingService.saveSellMonitoring(sellData);
            
            setSaveMessage({ 
                type: 'success', 
                text: 'Đã lưu thông tin bán thành công!' 
            });
            
            // Reset form after successful save
            setTimeout(() => {
                setShowSellDialog(false);
                setSaveMessage(null);
                loadHoldings(); // Refresh holdings
            }, 2000);
        } catch (error) {
            console.error('Error saving sell monitoring:', error);
            setSaveMessage({ 
                type: 'error', 
                text: 'Lỗi khi lưu thông tin bán. Vui lòng thử lại.' 
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCloseSellDialog = () => {
        setShowSellDialog(false);
        setSelectedSymbol(null);
        setSellForm({
            sell_price: '',
            volume: '',
            sell_date: format(new Date(), 'yyyy-MM-dd')
        });
        setSaveMessage(null);
    };

    const getProfitLossColor = (percentage: number) => {
        if (percentage > 0) return 'text-green-600';
        if (percentage < 0) return 'text-red-600';
        return 'text-gray-600';
    };

    const getProfitLossBgColor = (percentage: number) => {
        if (percentage > 0) return 'bg-green-50';
        if (percentage < 0) return 'bg-red-50';
        return 'bg-gray-50';
    };

    const getProfitLossIcon = (percentage: number) => {
        if (percentage > 0) return <TrendingUp className="h-4 w-4" />;
        if (percentage < 0) return <TrendingDown className="h-4 w-4" />;
        return null;
    };

    // Calculate summary metrics
    const totalProfitLoss = holdings.reduce((sum, holding) => sum + holding.profit_loss_amount, 0);
    const bestPerforming = holdings.length > 0 
        ? holdings.reduce((best, current) => 
            current.profit_loss_percentage > best.profit_loss_percentage ? current : best
          )
        : null;
    const worstPerforming = holdings.length > 0 
        ? holdings.reduce((worst, current) => 
            current.profit_loss_percentage < worst.profit_loss_percentage ? current : worst
          )
        : null;

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải thông tin tài sản...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <div className="text-red-500 text-4xl mb-4">⚠️</div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Lỗi Kết Nối</h2>
                <p className="text-gray-600 mb-4">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Tài Sản Đầu Tư</h2>
                    <p className="text-sm text-gray-600">Danh sách cổ phiếu đang nắm giữ và thông tin lãi/lỗ</p>
                </div>
                <div className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
                    Hiển thị <span className="font-bold">{filteredHoldings.length}</span> mã cổ phiếu
                </div>
            </div>

            {/* Summary Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 sm:p-6 rounded-lg border border-blue-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm text-blue-600 font-medium">Tổng Lãi/Lỗ ($)</p>
                            <p className={`text-xl sm:text-2xl font-bold ${getProfitLossColor(totalProfitLoss)}`}>
                                {totalProfitLoss >= 0 ? '+' : ''}{totalProfitLoss.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $
                            </p>
                        </div>
                        <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Tổng lãi/lỗ từ tất cả giao dịch</p>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-6 rounded-lg border border-green-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm text-green-600 font-medium">Mã Tốt Nhất</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                {bestPerforming ? bestPerforming.symbol : 'N/A'}
                            </p>
                            {bestPerforming && (
                                <p className={`text-sm font-medium ${getProfitLossColor(bestPerforming.profit_loss_percentage)}`}>
                                    {bestPerforming.profit_loss_percentage >= 0 ? '+' : ''}{bestPerforming.profit_loss_percentage.toFixed(2)}%
                                </p>
                            )}
                        </div>
                        <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Mã có tỷ suất lợi nhuận cao nhất</p>
                </div>

                <div className="bg-gradient-to-r from-red-50 to-rose-50 p-4 sm:p-6 rounded-lg border border-red-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm text-red-600 font-medium">Mã Kém Nhất</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                {worstPerforming ? worstPerforming.symbol : 'N/A'}
                            </p>
                            {worstPerforming && (
                                <p className={`text-sm font-medium ${getProfitLossColor(worstPerforming.profit_loss_percentage)}`}>
                                    {worstPerforming.profit_loss_percentage >= 0 ? '+' : ''}{worstPerforming.profit_loss_percentage.toFixed(2)}%
                                </p>
                            )}
                        </div>
                        <TrendingDown className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Mã có tỷ suất lợi nhuận thấp nhất</p>
                </div>
            </div>

            {/* Filters Panel */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-4 sm:p-6 border-b">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Filter className="h-5 w-5 text-gray-500" />
                            <h3 className="text-lg font-semibold text-gray-900">Bộ Lọc Tài Sản</h3>
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

                        {/* Profit Range Filters */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Min Profit Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Lãi/Lỗ Tối Thiểu (%)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={filters.minProfit}
                                    onChange={(e) => handleFilterChange('minProfit', e.target.value)}
                                    placeholder="VD: 5.0"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                                />
                            </div>

                            {/* Max Profit Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Lãi/Lỗ Tối Đa (%)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={filters.maxProfit}
                                    onChange={(e) => handleFilterChange('maxProfit', e.target.value)}
                                    placeholder="VD: 20.0"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active Filters */}
                {(filters.symbol || filters.minProfit || filters.maxProfit) && (
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
                            {filters.minProfit && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                                    Lãi/Lỗ tối thiểu: {filters.minProfit}%
                                </span>
                            )}
                            {filters.maxProfit && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                                    Lãi/Lỗ tối đa: {filters.maxProfit}%
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Holdings Display */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {filteredHoldings.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="text-gray-400 text-4xl mb-4">📊</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy tài sản</h3>
                        <p className="text-gray-600">
                            {holdings.length === 0
                                ? 'Chưa có cổ phiếu nào trong danh mục đầu tư.'
                                : 'Không có cổ phiếu nào phù hợp với bộ lọc hiện tại.'}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Mobile Cards View */}
                        <div className="md:hidden">
                            <div className="divide-y divide-gray-200">
                                {filteredHoldings.map((holding) => (
                                    <div key={holding.symbol} className="p-4 hover:bg-gray-50 transition-colors">
                                        {/* Header Row */}
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-bold text-gray-900">{holding.symbol}</span>
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getProfitLossBgColor(holding.profit_loss_percentage)} ${getProfitLossColor(holding.profit_loss_percentage)}`}>
                                                        {getProfitLossIcon(holding.profit_loss_percentage)}
                                                        {holding.profit_loss_percentage >= 0 ? '+' : ''}{holding.profit_loss_percentage.toFixed(2)}%
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Đang nắm giữ: {holding.current_holding_volume.toLocaleString('vi-VN')} CP
                                                </div>
                                            </div>
                                        </div>

                                        {/* Holding Information */}
                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            <div className="text-center">
                                                <div className="text-xs text-gray-500 mb-1">Đã mua</div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {holding.total_bought_volume.toLocaleString('vi-VN')}
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-xs text-gray-500 mb-1">Đã bán</div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {holding.total_sold_volume.toLocaleString('vi-VN')}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Profit/Loss Information */}
                                        <div className="mb-3">
                                            <div className="text-xs text-gray-500 mb-1">Lãi/Lỗ</div>
                                            <div className={`text-sm font-medium ${getProfitLossColor(holding.profit_loss_amount)}`}>
                                                {holding.profit_loss_amount >= 0 ? '+' : ''}{holding.profit_loss_amount.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $
                                            </div>
                                        </div>

                                        {/* Action Button for Mobile */}
                                        <div className="mt-4">
                                            <button
                                                onClick={() => handleSellClick(holding.symbol)}
                                                disabled={holding.current_holding_volume === 0}
                                                className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <DollarSign className="h-4 w-4 mr-1.5" />
                                                Bán Cổ Phiếu
                                            </button>
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
                                                Mã CK
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Đã Mua
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Đã Bán
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Đang Nắm Giữ
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Giá Mua TB
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Lãi/Lỗ (%)
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Lãi/Lỗ ($)
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Hành Động
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredHoldings.map((holding) => (
                                            <tr key={holding.symbol} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-bold text-gray-900">
                                                        {holding.symbol}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {holding.total_bought_volume.toLocaleString('vi-VN')}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {holding.total_sold_volume.toLocaleString('vi-VN')}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {holding.current_holding_volume.toLocaleString('vi-VN')}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {holding.average_buy_price.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getProfitLossBgColor(holding.profit_loss_percentage)} ${getProfitLossColor(holding.profit_loss_percentage)}`}>
                                                        {getProfitLossIcon(holding.profit_loss_percentage)}
                                                        {holding.profit_loss_percentage >= 0 ? '+' : ''}{holding.profit_loss_percentage.toFixed(2)}%
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className={`text-sm font-medium ${getProfitLossColor(holding.profit_loss_amount)}`}>
                                                        {holding.profit_loss_amount >= 0 ? '+' : ''}{holding.profit_loss_amount.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <button
                                                        onClick={() => handleSellClick(holding.symbol)}
                                                        disabled={holding.current_holding_volume === 0}
                                                        className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <DollarSign className="h-4 w-4 mr-1.5" />
                                                        Bán
                                                    </button>
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
                {filteredHoldings.length > 0 && (
                    <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                            <div className="text-sm text-gray-600">
                                Hiển thị <span className="font-medium">{filteredHoldings.length}</span> mã cổ phiếu
                            </div>
                            <div className="text-sm text-gray-600">
                                Tổng lãi/lỗ: <span className={`font-medium ${getProfitLossColor(totalProfitLoss)}`}>
                                    {totalProfitLoss >= 0 ? '+' : ''}{totalProfitLoss.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Sell Dialog */}
            {showSellDialog && selectedSymbol && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
                        {/* Dialog Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Nhập thông tin bán</h3>
                                <p className="text-sm text-gray-600">
                                    {selectedSymbol}
                                </p>
                            </div>
                            <button
                                onClick={handleCloseSellDialog}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Dialog Content */}
                        <div className="p-4 overflow-y-auto max-h-[60vh]">
                            <div className="space-y-4">
                                {/* Holding Info */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Đang nắm giữ</p>
                                            <p className="font-medium">
                                                {holdings.find(h => h.symbol === selectedSymbol)?.current_holding_volume.toLocaleString('vi-VN') || 0} CP
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Giá mua trung bình</p>
                                            <p className="font-medium">
                                                {holdings.find(h => h.symbol === selectedSymbol)?.average_buy_price.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} $
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Sell Form */}
                                <div className="space-y-4">
                                    {/* Sell Price */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            <div className="flex items-center gap-1">
                                                <DollarSign className="h-4 w-4 text-gray-500" />
                                                Giá bán
                                            </div>
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={sellForm.sell_price}
                                            onChange={(e) => handleSellFormChange('sell_price', e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                                            placeholder="Nhập giá bán"
                                        />
                                    </div>

                                    {/* Volume */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            <div className="flex items-center gap-1">
                                                <Package className="h-4 w-4 text-gray-500" />
                                                Khối lượng bán (số lượng cổ phiếu)
                                            </div>
                                        </label>
                                        <input
                                            type="number"
                                            value={sellForm.volume}
                                            onChange={(e) => handleSellFormChange('volume', e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                                            placeholder="Nhập khối lượng bán"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Tối đa: {holdings.find(h => h.symbol === selectedSymbol)?.current_holding_volume || 0} CP
                                        </p>
                                    </div>

                                    {/* Sell Date */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4 text-gray-500" />
                                                Ngày bán
                                            </div>
                                        </label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                            <input
                                                type="date"
                                                value={sellForm.sell_date}
                                                onChange={(e) => handleSellFormChange('sell_date', e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                                            />
                                        </div>
                                    </div>

                                    {/* Save Message */}
                                    {saveMessage && (
                                        <div className={`p-3 rounded-lg ${saveMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{saveMessage.type === 'success' ? '✓' : '⚠'}</span>
                                                <span>{saveMessage.text}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Profit/Loss Preview */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Dự tính lãi/lỗ:</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Giá trị bán</p>
                                            <p className="font-medium">
                                                {(() => {
                                                    const sellPrice = parseFloat(sellForm.sell_price) || 0;
                                                    const volume = parseInt(sellForm.volume) || 0;
                                                    return (sellPrice * volume).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                                })()} $
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Lãi/Lỗ dự kiến</p>
                                            <p className={`font-medium ${(() => {
                                                const sellPrice = parseFloat(sellForm.sell_price) || 0;
                                                const volume = parseInt(sellForm.volume) || 0;
                                                const holding = holdings.find(h => h.symbol === selectedSymbol);
                                                const buyValue = holding ? holding.average_buy_price * volume : 0;
                                                const sellValue = sellPrice * volume;
                                                const profitLoss = sellValue - buyValue;
                                                return profitLoss >= 0 ? 'text-green-600' : 'text-red-600';
                                            })()}`}>
                                                {(() => {
                                                    const sellPrice = parseFloat(sellForm.sell_price) || 0;
                                                    const volume = parseInt(sellForm.volume) || 0;
                                                    const holding = holdings.find(h => h.symbol === selectedSymbol);
                                                    const buyValue = holding ? holding.average_buy_price * volume : 0;
                                                    const sellValue = sellPrice * volume;
                                                    const profitLoss = sellValue - buyValue;
                                                    return (profitLoss >= 0 ? '+' : '') + profitLoss.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' $';
                                                })()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Dialog Footer */}
                        <div className="p-4 border-t">
                            <div className="flex gap-3">
                                <button
                                    onClick={handleCloseSellDialog}
                                    className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors active:scale-95"
                                    disabled={isSaving}
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleSaveSell}
                                    disabled={isSaving}
                                    className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Đang lưu...
                                        </div>
                                    ) : (
                                        'Lưu thông tin bán'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
