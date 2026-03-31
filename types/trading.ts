export interface TradingSignal {
    id?: string;
    symbol: string;
    entry_price: number;
    stop_loss_price: number;
    take_profit_price: number;
    confidence: number;
    reason?: string;
    date?: string;
    timestamp?: number;
    buy_status?: 'chua_mua' | 'da_mua';
}

export interface TradeResult {
    id?: string;
    symbol: string;
    buy_price: number;
    sell_price: number | null;
    buy_date: string;
    sell_date: string | null;
    status: 'WIN' | 'LOSS' | 'HOLDING';
    timestamp?: number;
}

export interface BuyMonitoring {
    id?: string;
    signal_id: string;
    symbol: string;
    enter_price: number;
    volume: number;
    buy_date: string;
    created_at: number;
    signal_entry_price: number;
    signal_stop_loss_price: number;
    signal_take_profit_price: number;
    signal_confidence: number;
}

export interface MatchedTrade {
    symbol: string;
    signal: TradingSignal;
    result: TradeResult;
    pnl_absolute: number;
    pnl_percentage: number;
    risk_reward: number;
    holding_days: number | null;
}

export interface DashboardMetrics {
    total_trades: number;
    winning_trades: number;
    losing_trades: number;
    holding_trades: number;
    win_rate: number;
    total_return_percentage: number;  // Total return as percentage (sum of all trade percentages)
    avg_return_percentage: number;    // Average return per trade as percentage
    avg_risk_reward: number;
    max_drawdown_percentage: number;  // Maximum drawdown as percentage
    avg_holding_days: number;
}

export interface FilterOptions {
    symbol: string;
    startDate: string | null;
    endDate: string | null;
    status: 'ALL' | 'WIN' | 'LOSS' | 'HOLDING';
}
