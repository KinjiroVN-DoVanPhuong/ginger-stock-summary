import { TrendingUp, TrendingDown, Target, Clock, BarChart3, Percent } from 'lucide-react';
import { MatchedTrade } from '@/types/trading';
import { tradingService } from '@/services/tradingService';
import { useLanguage } from '@/contexts/LanguageContext';
import TermInfoIcon from './TermInfoIcon';

interface MetricsCardsProps {
    trades: MatchedTrade[];
}

export default function MetricsCards({ trades }: MetricsCardsProps) {
    const metrics = tradingService.calculateMetrics(trades);
    const { t } = useLanguage();

    const cards = [
        {
            title: t('dashboard.totalTrades'),
            value: metrics.total_trades.toString(),
            icon: <BarChart3 className="h-5 w-5" />,
            color: 'bg-blue-50 text-blue-600 border-blue-100',
            iconColor: 'text-blue-500'
        },
        {
            title: t('dashboard.soldTrades'),
            value: (metrics.winning_trades + metrics.losing_trades).toString(),
            icon: <Percent className="h-5 w-5" />,
            color: 'bg-green-50 text-green-600 border-green-100',
            iconColor: 'text-green-500'
        },
        {
            title: t('dashboard.totalReturn'),
            value: `${metrics.total_return_percentage.toFixed(2)}%`,
            icon: <Percent className="h-5 w-5" />,
            color: metrics.total_return_percentage >= 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100',
            iconColor: metrics.total_return_percentage >= 0 ? 'text-emerald-500' : 'text-red-500',
            trend: metrics.total_return_percentage >= 0 ? 'up' : 'down'
        },
        {
            title: t('dashboard.avgReturn'),
            value: `${metrics.avg_return_percentage.toFixed(2)}%`,
            icon: <TrendingUp className="h-5 w-5" />,
            color: metrics.avg_return_percentage >= 0 ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100',
            iconColor: metrics.avg_return_percentage >= 0 ? 'text-green-500' : 'text-red-500',
            trend: metrics.avg_return_percentage >= 0 ? 'up' : 'down'
        },
        {
            title: t('dashboard.avgRiskReward'),
            value: metrics.avg_risk_reward.toFixed(2),
            icon: <Target className="h-5 w-5" />,
            color: 'bg-purple-50 text-purple-600 border-purple-100',
            iconColor: 'text-purple-500'
        },
        {
            title: t('dashboard.avgHoldingDays'),
            value: metrics.avg_holding_days.toFixed(1),
            icon: <Clock className="h-5 w-5" />,
            color: 'bg-cyan-50 text-cyan-600 border-cyan-100',
            iconColor: 'text-cyan-500'
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {cards.map((card, index) => (
                <div
                    key={index}
                    className={`p-4 rounded-lg border ${card.color} transition-transform hover:scale-[1.02] hover:shadow-md`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-lg ${card.iconColor} bg-white`}>
                            {card.icon}
                        </div>
                        {card.trend && (
                            <div className={`flex items-center ${card.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                                {card.trend === 'up' ? (
                                    <TrendingUp className="h-4 w-4" />
                                ) : (
                                    <TrendingDown className="h-4 w-4" />
                                )}
                            </div>
                        )}
                    </div>
                    <p className="text-2xl font-bold">{card.value}</p>
                    <div className="flex items-center gap-1">
                        <p className="text-sm font-medium mt-1">{card.title}</p>
                        {card.title === t('dashboard.avgRiskReward') && <TermInfoIcon term="R:R" className="ml-1" />}
                        {card.title === t('dashboard.avgReturn') && <TermInfoIcon term="P&L" className="ml-1" />}
                    </div>

                    {/* Additional context for some cards */}
                    {card.title === t('dashboard.soldTrades') && metrics.total_trades > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                            {metrics.winning_trades}W / {metrics.losing_trades}L / {metrics.holding_trades}H
                        </p>
                    )}

                    {card.title === t('dashboard.totalReturn') && metrics.total_trades > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                            {metrics.total_return_percentage >= 0 ? t('metrics.positive') : t('metrics.negative')} {t('metrics.return')}
                        </p>
                    )}

                    {card.title === t('dashboard.avgRiskReward') && metrics.avg_risk_reward > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                            {metrics.avg_risk_reward >= 1.5 ? t('metrics.good') : metrics.avg_risk_reward >= 1 ? t('metrics.fair') : t('metrics.poor')}
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
}