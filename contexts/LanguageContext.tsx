'use client';

import React, { createContext, useContext, ReactNode } from 'react';

interface LanguageContextType {
    t: (key: string) => string;
    getTermInfo: (term: string) => { term: string; description: string } | null;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Vietnamese translations only
const translations = {
    // Dashboard
    'dashboard.title': 'Bảng Điều Khiển Hiệu Suất Giao Dịch Chứng Khoán',
    'dashboard.description': 'Giám sát thời gian thực tín hiệu giao dịch AI và kết quả',
    'dashboard.connectionStatus': 'Trạng Thái Kết Nối',
    'dashboard.connected': 'Đã Kết Nối',
    'dashboard.disconnected': 'Mất Kết Nối',
    'dashboard.totalTrades': 'Tổng Giao Dịch',
    'dashboard.soldTrades': 'Đã Bán',
    'dashboard.winRate': 'Tỷ Lệ Thắng',
    'dashboard.totalReturn': 'Tổng Lợi Nhuận',
    'dashboard.avgReturn': 'Lợi Nhuận Trung Bình',
    'dashboard.avgRiskReward': 'Tỷ Lệ R:R TB',
    'dashboard.maxDrawdown': 'Thua Lỗ Tối Đa',
    'dashboard.avgHoldingDays': 'Số Ngày Nắm Giữ TB',
    'dashboard.performanceCharts': 'Biểu Đồ Hiệu Suất',
    'dashboard.chartsDescription': 'Phân tích trực quan hiệu suất giao dịch',
    'dashboard.equityCurve': 'Đường Cong Vốn',
    'dashboard.winLossDistribution': 'Phân Phối Thắng/Thua',
    'dashboard.symbolPerformance': 'Hiệu Suất Mã CK',
    'dashboard.tradesTable': 'Bảng Giao Dịch',
    'dashboard.filters': 'Bộ Lọc',

    // Table headers
    'table.symbol': 'Mã CK',
    'table.buyPrice': 'Giá Mua',
    'table.sellPrice': 'Giá Bán',
    'table.pnl': 'Lợi Nhuận',
    'table.status': 'Trạng Thái',
    'table.buyDate': 'Ngày Mua',
    'table.sellDate': 'Ngày Bán',
    'table.confidence': 'Độ Tin Cậy',
    'table.riskReward': 'Rủi Ro/Lợi Nhuận',
    'table.holdingDays': 'Số Ngày Nắm Giữ',

    // Status
    'status.win': 'THẮNG',
    'status.loss': 'THUA',
    'status.holding': 'ĐANG NẮM GIỮ',
    'status.sold': 'ĐÃ BÁN',

    // Filters
    'filters.allSymbols': 'Tất Cả Mã',
    'filters.allStatus': 'Tất Cả Trạng Thái',
    'filters.startDate': 'Ngày Bắt Đầu',
    'filters.endDate': 'Ngày Kết Thúc',
    'filters.apply': 'Áp Dụng Bộ Lọc',
    'filters.clear': 'Xóa Bộ Lọc',
    'filters.activeFilters': 'Bộ Lọc Đang Hoạt Động',

    // Charts
    'charts.equityCurve': 'Đường Cong Vốn',
    'charts.cumulativePnl': 'Lợi Nhuận Tích Lũy',
    'charts.tradePnl': 'Lợi Nhuận Giao Dịch',
    'charts.wins': 'Thắng',
    'charts.losses': 'Thua',
    'charts.holding': 'Đang Nắm Giữ',
    'charts.totalReturn': 'Tổng Lợi Nhuận',
    'charts.winRate': 'Tỷ Lệ Thắng',
    'charts.equityInsights': 'Thông Tin Đường Cong Vốn',
    'charts.tradeDistribution': 'Phân Phối Giao Dịch',
    'charts.bestPerformer': 'Mã Tốt Nhất',
    'charts.positiveReturns': 'Lợi nhuận tích lũy dương',
    'charts.negativeReturns': 'Lợi nhuận tích lũy âm',
    'charts.winningTrades': 'giao dịch thắng',
    'charts.soldTrades': 'giao dịch đã bán',
    'charts.noCompletedTrades': 'Không có giao dịch hoàn thành',

    // Actions
    'actions.refresh': 'Làm Mới Dữ Liệu',
    'actions.analyze': 'Phân Tích Hiệu Suất Với AI',

    // Metrics
    'metrics.profit': 'Lãi',
    'metrics.loss': 'Lỗ',
    'metrics.positive': 'Dương',
    'metrics.negative': 'Âm',
    'metrics.good': 'Tốt',
    'metrics.fair': 'Khá',
    'metrics.poor': 'Kém',
    'metrics.return': 'lợi nhuận',
};

// Financial term explanations (English terms with Vietnamese explanations)
const financialTerms = {
    'P/E': {
        term: 'P/E (Price-to-Earnings Ratio)',
        description: 'Tỷ lệ giá trên thu nhập - Chỉ số đo lường giá cổ phiếu so với thu nhập trên mỗi cổ phiếu. P/E cao có thể cho thấy cổ phiếu đắt đỏ hoặc thị trường kỳ vọng tăng trưởng cao.'
    },
    'P&L': {
        term: 'P&L (Profit and Loss)',
        description: 'Lợi nhuận và thua lỗ - Báo cáo tài chính thể hiện thu nhập, chi phí và lợi nhuận/thua lỗ trong một khoảng thời gian.'
    },
    'R:R': {
        term: 'R:R (Risk-to-Reward Ratio)',
        description: 'Tỷ lệ rủi ro/lợi nhuận - Tỷ lệ giữa số tiền có thể mất (rủi ro) so với số tiền có thể kiếm được (lợi nhuận) trong một giao dịch.'
    },
    'Drawdown': {
        term: 'Drawdown',
        description: 'Mức sụt giảm - Sự sụt giảm từ đỉnh đến đáy trong giá trị tài khoản hoặc giá cổ phiếu, thường được biểu thị bằng phần trăm.'
    },
    'Equity': {
        term: 'Equity',
        description: 'Vốn chủ sở hữu - Giá trị còn lại của tài sản sau khi trừ đi các khoản nợ. Trong giao dịch, đây là số dư tài khoản hiện tại.'
    },
    'Risk/Reward': {
        term: 'Risk/Reward',
        description: 'Rủi ro/Lợi nhuận - Tỷ lệ giữa tiềm năng thua lỗ so với tiềm năng lợi nhuận trong một giao dịch.'
    },
    'Confidence': {
        term: 'Confidence',
        description: 'Độ tin cậy - Mức độ chắc chắn của tín hiệu giao dịch AI, thường được biểu thị bằng phần trăm.'
    },
    'Symbol': {
        term: 'Symbol',
        description: 'Mã chứng khoán - Mã giao dịch duy nhất đại diện cho một cổ phiếu trên thị trường.'
    }
};

interface LanguageProviderProps {
    children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
    const t = (key: string): string => {
        return translations[key as keyof typeof translations] || key;
    };

    const getTermInfo = (term: string): { term: string; description: string } | null => {
        return financialTerms[term as keyof typeof financialTerms] || null;
    };

    return (
        <LanguageContext.Provider value={{ t, getTermInfo }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
