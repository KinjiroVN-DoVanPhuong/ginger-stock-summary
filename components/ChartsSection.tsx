
'use client';

import { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { MatchedTrade } from '@/types/trading';
import { parseISO } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import TermInfoIcon from './TermInfoIcon';

interface ChartsSectionProps {
    trades: MatchedTrade[];
}

export default function ChartsSection({ trades }: ChartsSectionProps) {
    const [activeChart, setActiveChart] = useState<'equity' | 'distribution' | 'performance'>('equity');
    const { t } = useLanguage();

    // Prepare equity curve data
    const prepareEquityData = () => {
        if (trades.length === 0) return [];

        const completedTrades = trades.filter(trade => trade.result.status !== 'HOLDING');
        if (completedTrades.length === 0) return [];

        // Sort trades by sell date
        const sortedTrades = [...completedTrades].sort((a, b) => {
            const dateA = a.result.sell_date ? parseISO(a.result.sell_date).getTime() : 0;
            const dateB = b.result.sell_date ? parseISO(b.result.sell_date).getTime() : 0;
            return dateA - dateB;
        });

        let cumulativePnl = 0;
        const equityData = [];

        // Add initial point
        equityData.push({
            date: 'Start',
            pnl: 0,
            cumulative: 0
        });

        // Add each trade
        sortedTrades.forEach((trade, index) => {
            cumulativePnl += trade.pnl_percentage;
            let dateLabel = `Trade ${index + 1}`;

            if (trade.result.sell_date) {
                try {
                    const sellDate = new Date(trade.result.sell_date);
                    // Format as MM/DD
                    const month = (sellDate.getMonth() + 1).toString().padStart(2, '0');
                    const day = sellDate.getDate().toString().padStart(2, '0');
                    dateLabel = `${month}/${day}`;
                } catch (error) {
                    dateLabel = `Trade ${index + 1}`;
                }
            }

            equityData.push({
                date: dateLabel,
                pnl: trade.pnl_percentage,
                cumulative: cumulativePnl
            });
        });

        return equityData;
    };

    // Prepare win/loss distribution data
    const prepareDistributionData = () => {
        const soldTrades = trades.filter(trade => trade.result.status === 'WIN' || trade.result.status === 'LOSS');
        const holdingTrades = trades.filter(trade => trade.result.status === 'HOLDING');

        return [
            { name: 'Đã bán', value: soldTrades.length, color: '#8b5cf6' },
            { name: 'Đang nắm giữ', value: holdingTrades.length, color: '#3b82f6' }
        ].filter(item => item.value > 0);
    };

    // Prepare performance by symbol data (using percentage returns for equal position sizing)
    const preparePerformanceData = () => {
        if (trades.length === 0) return [];

        const symbolMap = new Map();

        trades.forEach(trade => {
            if (!symbolMap.has(trade.symbol)) {
                symbolMap.set(trade.symbol, {
                    symbol: trade.symbol,
                    trades: 0,
                    wins: 0,
                    losses: 0,
                    totalReturnPercentage: 0
                });
            }

            const data = symbolMap.get(trade.symbol);
            data.trades += 1;
            data.totalReturnPercentage += trade.pnl_percentage;

            if (trade.result.status === 'WIN') {
                data.wins += 1;
            } else if (trade.result.status === 'LOSS') {
                data.losses += 1;
            }
        });

        return Array.from(symbolMap.values())
            .map(data => ({
                ...data,
                avgReturnPercentage: data.trades > 0 ? data.totalReturnPercentage / data.trades : 0,
                winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0
            }))
            .sort((a, b) => b.totalReturnPercentage - a.totalReturnPercentage)
            .slice(0, 8); // Top 8 symbols
    };

    const equityData = prepareEquityData();
    const distributionData = prepareDistributionData();
    const performanceData = preparePerformanceData();

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                    <p className="font-medium text-gray-900">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: {entry.value.toFixed(2)}%
                            {entry.name === 'pnl' && entry.value >= 0 ? ' (Lãi)' : entry.name === 'pnl' ? ' (Lỗ)' : ''}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const chartTabs = [
        { id: 'equity', label: t('dashboard.equityCurve'), icon: <TrendingUp className="h-4 w-4" /> },
        { id: 'distribution', label: t('dashboard.winLossDistribution'), icon: <PieChartIcon className="h-4 w-4" /> },
        { id: 'performance', label: t('dashboard.symbolPerformance'), icon: <BarChart3 className="h-4 w-4" /> }
    ];

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.performanceCharts')}</h2>
                        <p className="text-sm text-gray-500">{t('dashboard.chartsDescription')}</p>
                    </div>

                    <div className="flex space-x-1">
                        {chartTabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveChart(tab.id as any)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeChart === tab.id
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-6">
                <div className="h-80">
                    {trades.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500">
                            <BarChart3 className="h-16 w-16 text-gray-300 mb-4" />
                            <p className="text-lg font-medium">Không có dữ liệu</p>
                            <p className="text-sm">Cần dữ liệu giao dịch để hiển thị biểu đồ</p>
                        </div>
                    ) : (
                        <>
                            {activeChart === 'equity' && (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={equityData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#666"
                                            tick={{ fontSize: 12 }}
                                        />
                                        <YAxis
                                            stroke="#666"
                                            tickFormatter={(value) => `${value.toFixed(1)}%`}
                                            tick={{ fontSize: 12 }}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="cumulative"
                                            name="Lợi Nhuận Tích Lũy"
                                            stroke="#3b82f6"
                                            strokeWidth={2}
                                            dot={{ r: 4 }}
                                            activeDot={{ r: 6 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="pnl"
                                            name="Lợi Nhuận Giao Dịch"
                                            stroke="#10b981"
                                            strokeWidth={1}
                                            strokeDasharray="3 3"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}

                            {activeChart === 'distribution' && (
                                <div className="h-full flex flex-col lg:flex-row items-center justify-center gap-8">
                                    <div className="lg:w-1/2 h-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={distributionData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {distributionData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value) => [value, 'Giao dịch']} />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="lg:w-1/2">
                                        <div className="space-y-4">
                                            {distributionData.map((item, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="h-3 w-3 rounded-full"
                                                            style={{ backgroundColor: item.color }}
                                                        />
                                                        <span className="font-medium text-gray-900">{item.name}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-lg font-bold">{item.value}</p>
                                                        <p className="text-sm text-gray-500">giao dịch</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeChart === 'performance' && (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="symbol"
                                            stroke="#666"
                                            tick={{ fontSize: 12 }}
                                        />
                                        <YAxis
                                            yAxisId="left"
                                            stroke="#666"
                                            tickFormatter={(value) => `${value.toFixed(1)}%`}
                                            tick={{ fontSize: 12 }}
                                        />
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            stroke="#666"
                                            tickFormatter={(value) => `${value}%`}
                                            tick={{ fontSize: 12 }}
                                        />
                                        <Tooltip
                                            formatter={(value, name) => {
                                                if (name === 'totalReturnPercentage') return [`${Number(value).toFixed(2)}%`, 'Tổng Lợi Nhuận'];
                                                if (name === 'avgReturnPercentage') return [`${Number(value).toFixed(2)}%`, 'Lợi Nhuận TB'];
                                                if (name === 'winRate') return [`${Number(value).toFixed(1)}%`, 'Tỷ Lệ Thắng'];
                                                return [value, name];
                                            }}
                                        />
                                        <Legend />
                                        <Bar
                                            yAxisId="left"
                                            dataKey="totalReturnPercentage"
                                            name="Tổng Lợi Nhuận"
                                            fill="#3b82f6"
                                            radius={[4, 4, 0, 0]}
                                        />
                                        <Line
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey="winRate"
                                            name="Tỷ Lệ Thắng"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                            dot={{ r: 4 }}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </>
                    )}
                </div>

                {trades.length > 0 && (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="font-medium">{t('charts.equityInsights')}</p>
                            <p className="mt-1">
                                {equityData.length > 0 && equityData[equityData.length - 1].cumulative >= 0
                                    ? t('charts.positiveReturns')
                                    : t('charts.negativeReturns')}
                            </p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="font-medium">{t('charts.tradeDistribution')}</p>
                            <p className="mt-1">
                                {distributionData.find(d => d.name === 'Đã bán')?.value || 0} {t('charts.soldTrades')}
                            </p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="font-medium">{t('charts.bestPerformer')}</p>
                            <p className="mt-1">
                                {performanceData.length > 0
                                    ? `${performanceData[0].symbol}: ${performanceData[0].totalReturnPercentage.toFixed(2)}%`
                                    : t('charts.noCompletedTrades')}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}