'use client';

import { useState, useEffect } from 'react';
import { tradingService } from '@/services/tradingService';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Award, AlertTriangle } from 'lucide-react';

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

interface StatisticsSummary {
    totalInvestment: number;           // Tổng đầu tư = Tổng tiền đầu tư từ danh sách mua
    totalCurrentValue: number;         // Tổng giá trị hiện tại = Tiền cổ phiếu đã bán + Giá trị cổ phiếu chưa bán
    totalProfitLoss: number;           // Lãi/Lỗ = Tổng giá trị hiện tại - Tổng đầu tư
    totalProfitLossPercentage: number; // Phần trăm lãi/lỗ
    mostProfitableSymbol: string;      // Mã lãi nhiều nhất
    mostProfitableAmount: number;      // Số tiền lãi nhiều nhất
    mostLosingSymbol: string;          // Mã lỗ nhiều nhất
    mostLosingAmount: number;          // Số tiền lỗ nhiều nhất
    totalStocks: number;               // Tổng số mã cổ phiếu
    totalSoldValue: number;            // Tổng tiền cổ phiếu đã bán
    totalUnrealizedValue: number;      // Tổng giá trị cổ phiếu chưa bán
}

export default function StatisticsTab() {
    const [holdings, setHoldings] = useState<StockHolding[]>([]);
    const [statistics, setStatistics] = useState<StatisticsSummary | null>(null);
    const [loading, setLoading] = useState(true);

    // Load data on component mount
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const stockHoldings = await tradingService.getStockHoldings();
                setHoldings(stockHoldings);
                calculateStatistics(stockHoldings);
            } catch (error) {
                console.error('Error loading statistics data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();

        // Set up real-time listeners for buy and sell monitoring
        const unsubscribeBuy = tradingService.subscribeToBuyMonitoring(() => {
            loadData();
        });

        const unsubscribeSell = tradingService.subscribeToSellMonitoring(() => {
            loadData();
        });

        // Cleanup subscriptions
        return () => {
            unsubscribeBuy();
            unsubscribeSell();
        };
    }, []);

    const calculateStatistics = (stockHoldings: StockHolding[]) => {
        if (stockHoldings.length === 0) {
            setStatistics(null);
            return;
        }

        // Calculate totals
        const totalInvestment = stockHoldings.reduce((sum, holding) => sum + holding.total_investment, 0);
        const totalSoldValue = stockHoldings.reduce((sum, holding) => {
            const soldValue = holding.average_buy_price * holding.total_sold_volume;
            return sum + soldValue + holding.profit_loss_amount;
        }, 0);
        const totalUnrealizedValue = stockHoldings.reduce((sum, holding) => sum + holding.current_value, 0);
        const totalCurrentValue = totalSoldValue + totalUnrealizedValue;
        const totalProfitLoss = totalCurrentValue - totalInvestment;
        const totalProfitLossPercentage = totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0;

        // Find most profitable and most losing symbols
        let mostProfitableSymbol = '';
        let mostProfitableAmount = 0;
        let mostLosingSymbol = '';
        let mostLosingAmount = 0;

        stockHoldings.forEach(holding => {
            if (holding.profit_loss_amount > mostProfitableAmount) {
                mostProfitableAmount = holding.profit_loss_amount;
                mostProfitableSymbol = holding.symbol;
            }
            
            if (holding.profit_loss_amount < mostLosingAmount) {
                mostLosingAmount = holding.profit_loss_amount;
                mostLosingSymbol = holding.symbol;
            }
        });

        setStatistics({
            totalInvestment,
            totalCurrentValue,
            totalProfitLoss,
            totalProfitLossPercentage,
            mostProfitableSymbol,
            mostProfitableAmount,
            mostLosingSymbol,
            mostLosingAmount,
            totalStocks: stockHoldings.length,
            totalSoldValue,
            totalUnrealizedValue
        });
    };

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString('vi-VN');
    };

    const formatPercentage = (percentage: number) => {
        return percentage.toFixed(2);
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải dữ liệu thống kê...</p>
                </div>
            </div>
        );
    }

    if (!statistics) {
        return (
            <div className="space-y-6">
                <div className="text-center py-12">
                    <div className="text-gray-400 text-4xl mb-4">📊</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có dữ liệu thống kê</h3>
                    <p className="text-gray-600">
                        Chưa có giao dịch mua/bán nào trong hệ thống để tính toán thống kê.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Thống Kê Đầu Tư</h2>
                    <p className="text-sm text-gray-600">Tổng quan hiệu quả đầu tư và phân tích lãi/lỗ</p>
                </div>
                <div className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
                    Tổng số mã: <span className="font-bold">{statistics.totalStocks}</span>
                </div>
            </div>

            {/* Main Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Profit/Loss Card */}
                <div className={`p-4 sm:p-6 rounded-lg border ${
                    statistics.totalProfitLoss >= 0 
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-100' 
                        : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-100'
                }`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm text-gray-600 font-medium">Lãi/Lỗ Tổng</p>
                            <p className={`text-xl sm:text-2xl font-bold ${
                                statistics.totalProfitLoss >= 0 ? 'text-green-700' : 'text-red-700'
                            }`}>
                                {formatCurrency(statistics.totalProfitLoss)}
                            </p>
                            <p className={`text-sm ${
                                statistics.totalProfitLossPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                                {statistics.totalProfitLossPercentage >= 0 ? '+' : ''}{formatPercentage(statistics.totalProfitLossPercentage)}%
                            </p>
                        </div>
                        {statistics.totalProfitLoss >= 0 ? (
                            <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
                        ) : (
                            <TrendingDown className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Tổng giá trị hiện tại - Tổng đầu tư</p>
                </div>

                {/* Total Investment Card */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 sm:p-6 rounded-lg border border-blue-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm text-blue-600 font-medium">Tổng Đầu Tư</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                {formatCurrency(statistics.totalInvestment)}
                            </p>
                        </div>
                        <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Tổng tiền đầu tư từ danh sách mua</p>
                </div>

                {/* Total Current Value Card */}
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 sm:p-6 rounded-lg border border-purple-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm text-purple-600 font-medium">Tổng Giá Trị Hiện Tại</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                {formatCurrency(statistics.totalCurrentValue)}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-600">
                                    Đã bán: {formatCurrency(statistics.totalSoldValue)}
                                </span>
                                <span className="text-xs text-gray-600">•</span>
                                <span className="text-xs text-gray-600">
                                    Chưa bán: {formatCurrency(statistics.totalUnrealizedValue)}
                                </span>
                            </div>
                        </div>
                        <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Tiền cổ phiếu đã bán + Giá trị cổ phiếu chưa bán</p>
                </div>

                {/* Most Profitable Symbol Card */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-6 rounded-lg border border-green-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm text-green-600 font-medium">Mã Lãi Nhiều Nhất</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                {statistics.mostProfitableSymbol || 'N/A'}
                            </p>
                            <p className="text-sm text-green-600">
                                +{formatCurrency(statistics.mostProfitableAmount)}
                            </p>
                        </div>
                        <Award className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Mã cổ phiếu có lãi cao nhất</p>
                </div>
            </div>

            {/* Most Losing Symbol Card (Full Width) */}
            {statistics.mostLosingSymbol && (
                <div className="bg-gradient-to-r from-red-50 to-rose-50 p-4 sm:p-6 rounded-lg border border-red-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm text-red-600 font-medium">Mã Lỗ Nhiều Nhất</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                {statistics.mostLosingSymbol}
                            </p>
                            <p className="text-sm text-red-600">
                                {formatCurrency(statistics.mostLosingAmount)}
                            </p>
                        </div>
                        <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Mã cổ phiếu có lỗ nhiều nhất</p>
                </div>
            )}

            {/* Detailed Holdings Table */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-4 sm:p-6 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Chi Tiết Theo Mã Cổ Phiếu</h3>
                    <p className="text-sm text-gray-600 mt-1">Phân tích lãi/lỗ cho từng mã cổ phiếu</p>
                </div>

                {holdings.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="text-gray-400 text-4xl mb-4">📊</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Không có dữ liệu chi tiết</h3>
                        <p className="text-gray-600">Chưa có giao dịch mua/bán nào trong hệ thống.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Mã CK
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tổng Đầu Tư
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Đã Bán
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Chưa Bán
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Lãi/Lỗ
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        % Lãi/Lỗ
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {holdings.map((holding) => (
                                    <tr key={holding.symbol} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-gray-900">
                                                {holding.symbol}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                KL: {holding.total_bought_volume.toLocaleString('vi-VN')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {formatCurrency(holding.total_investment)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {formatCurrency(holding.average_buy_price * holding.total_sold_volume)}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                KL: {holding.total_sold_volume.toLocaleString('vi-VN')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {formatCurrency(holding.current_value)}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                KL: {holding.current_holding_volume.toLocaleString('vi-VN')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={`text-sm font-medium ${
                                                holding.profit_loss_amount >= 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {holding.profit_loss_amount >= 0 ? '+' : ''}{formatCurrency(holding.profit_loss_amount)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={`text-sm font-medium ${
                                                holding.profit_loss_percentage >= 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {holding.profit_loss_percentage >= 0 ? '+' : ''}{formatPercentage(holding.profit_loss_percentage)}%
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Summary */}
                {holdings.length > 0 && (
                    <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                            <div className="text-sm text-gray-600">
                                Hiển thị <span className="font-medium">{holdings.length}</span> mã cổ phiếu
                            </div>
                            <div className="text-sm text-gray-600">
                                Tổng lãi/lỗ: <span className={`font-medium ${
                                    statistics.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {statistics.totalProfitLoss >= 0 ? '+' : ''}{formatCurrency(statistics.totalProfitLoss)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
