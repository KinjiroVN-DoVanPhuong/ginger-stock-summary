import { BarChart3, Brain, RefreshCw, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';

interface DashboardHeaderProps {
    onAnalyzePerformance: () => void;
    totalTrades: number;
}

export default function DashboardHeader({ onAnalyzePerformance, totalTrades }: DashboardHeaderProps) {
    const { t } = useLanguage();

    return (
        <header className="bg-white shadow">
            <div className="container mx-auto px-4 py-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <BarChart3 className="h-8 w-8 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
                            <p className="text-gray-600">{t('dashboard.description')}</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Link
                            href="/signals"
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
                        >
                            <TrendingUp className="h-4 w-4" />
                            <span>Tín Hiệu Giao Dịch</span>
                        </Link>

                        <button
                            onClick={onAnalyzePerformance}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
                        >
                            <Brain className="h-4 w-4" />
                            <span>{t('actions.analyze')}</span>
                        </button>

                        <button
                            onClick={() => window.location.reload()}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <RefreshCw className="h-4 w-4" />
                            <span>{t('actions.refresh')}</span>
                        </button>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-600 font-medium">{t('dashboard.connectionStatus')}</p>
                                <p className="text-2xl font-bold text-gray-900">{t('dashboard.connected')}</p>
                            </div>
                            <div className="relative">
                                <div className="h-3 w-3 bg-green-500 rounded-full animate-ping"></div>
                                <div className="h-3 w-3 bg-green-500 rounded-full absolute top-0"></div>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Đã kết nối với Firebase Realtime Database</p>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-600 font-medium">{t('dashboard.totalTrades')}</p>
                                <p className="text-2xl font-bold text-gray-900">{totalTrades}</p>
                            </div>
                            <BarChart3 className="h-8 w-8 text-green-500" />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Tín hiệu giao dịch đã khớp với kết quả</p>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-purple-600 font-medium">Nguồn Dữ Liệu</p>
                                <p className="text-2xl font-bold text-gray-900">2 Nút</p>
                            </div>
                            <div className="flex gap-1">
                                <div className="h-8 w-2 bg-purple-400 rounded-full"></div>
                                <div className="h-8 w-2 bg-purple-400 rounded-full"></div>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">trading_signals & result_monitoring</p>
                    </div>
                </div>
            </div>
        </header>
    );
}