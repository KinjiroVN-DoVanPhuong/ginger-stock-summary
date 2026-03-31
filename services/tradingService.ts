import { ref, onValue, off, get, query, orderByChild, equalTo, push, set } from 'firebase/database';
import { database } from '@/lib/firebase/config';
import { TradingSignal, TradeResult, MatchedTrade, DashboardMetrics, FilterOptions, BuyMonitoring } from '@/types/trading';
import { differenceInDays, parseISO } from 'date-fns';

const TRADING_SIGNALS_PATH = 'trading_signals';
const RESULT_MONITORING_PATH = 'result_monitoring';
const BUY_MONITORING_PATH = 'buy_monitoring';

// Firebase data operations
export const tradingService = {
    // Real-time listeners
    subscribeToTradingSignals(callback: (signals: TradingSignal[]) => void) {
        const signalsRef = ref(database, TRADING_SIGNALS_PATH);

        const handleData = (snapshot: any) => {
            const data = snapshot.val();
            const signals: TradingSignal[] = [];

            if (data) {
                Object.keys(data).forEach((key) => {
                    signals.push({
                        id: key,
                        ...data[key]
                    });
                });
            }

            callback(signals);
        };

        onValue(signalsRef, handleData);

        // Return unsubscribe function
        return () => off(signalsRef, 'value', handleData);
    },

    subscribeToTradeResults(callback: (results: TradeResult[]) => void) {
        const resultsRef = ref(database, RESULT_MONITORING_PATH);

        const handleData = (snapshot: any) => {
            const data = snapshot.val();
            const results: TradeResult[] = [];

            if (data) {
                Object.keys(data).forEach((key) => {
                    results.push({
                        id: key,
                        ...data[key]
                    });
                });
            }

            callback(results);
        };

        onValue(resultsRef, handleData);

        // Return unsubscribe function
        return () => off(resultsRef, 'value', handleData);
    },

    // One-time fetches
    async getTradingSignals(): Promise<TradingSignal[]> {
        const signalsRef = ref(database, TRADING_SIGNALS_PATH);
        const snapshot = await get(signalsRef);

        if (!snapshot.exists()) {
            return [];
        }

        const data = snapshot.val();
        const signals: TradingSignal[] = [];

        Object.keys(data).forEach((key) => {
            signals.push({
                id: key,
                ...data[key]
            });
        });

        return signals;
    },

    async getTradeResults(): Promise<TradeResult[]> {
        const resultsRef = ref(database, RESULT_MONITORING_PATH);
        const snapshot = await get(resultsRef);

        if (!snapshot.exists()) {
            return [];
        }

        const data = snapshot.val();
        const results: TradeResult[] = [];

        Object.keys(data).forEach((key) => {
            results.push({
                id: key,
                ...data[key]
            });
        });

        return results;
    },

    // Filtered queries
    async getTradeResultsBySymbol(symbol: string): Promise<TradeResult[]> {
        const resultsRef = ref(database, RESULT_MONITORING_PATH);
        const symbolQuery = query(resultsRef, orderByChild('symbol'), equalTo(symbol));
        const snapshot = await get(symbolQuery);

        if (!snapshot.exists()) {
            return [];
        }

        const data = snapshot.val();
        const results: TradeResult[] = [];

        Object.keys(data).forEach((key) => {
            results.push({
                id: key,
                ...data[key]
            });
        });

        return results;
    },

    // Business logic: Match trades with signals
    matchTradesWithSignals(signals: TradingSignal[], results: TradeResult[]): MatchedTrade[] {
        const matchedTrades: MatchedTrade[] = [];

        results.forEach((result) => {
            // Find signals for the same symbol
            const symbolSignals = signals.filter(signal => signal.symbol === result.symbol);

            if (symbolSignals.length > 0) {
                // Find the closest signal by date (simplified - using timestamp if available)
                let closestSignal = symbolSignals[0];

                if (result.timestamp && symbolSignals.length > 1) {
                    let minDiff = Math.abs((result.timestamp || 0) - (symbolSignals[0].timestamp || 0));

                    for (let i = 1; i < symbolSignals.length; i++) {
                        const diff = Math.abs((result.timestamp || 0) - (symbolSignals[i].timestamp || 0));
                        if (diff < minDiff) {
                            minDiff = diff;
                            closestSignal = symbolSignals[i];
                        }
                    }
                }

                // Calculate P&L
                const pnlAbsolute = result.sell_price ? result.sell_price - result.buy_price : 0;
                const pnlPercentage = result.sell_price ? ((result.sell_price - result.buy_price) / result.buy_price) * 100 : 0;

                // Determine status based on sell_price
                let status: 'WIN' | 'LOSS' | 'HOLDING';
                if (result.sell_price) {
                    // If there's a sell price, it's SOLD (WIN or LOSS based on price)
                    status = result.sell_price > result.buy_price ? 'WIN' : 'LOSS';
                } else {
                    // No sell price means still HOLDING
                    status = 'HOLDING';
                }

                // Update result with calculated status
                const updatedResult = {
                    ...result,
                    status
                };

                // Calculate risk/reward
                const risk = closestSignal.entry_price - closestSignal.stop_loss_price;
                const reward = closestSignal.take_profit_price - closestSignal.entry_price;
                const riskReward = risk > 0 ? reward / risk : 0;

                // Calculate holding days
                let holdingDays = null;
                if (result.buy_date && result.sell_date) {
                    try {
                        const buyDate = parseISO(result.buy_date);
                        const sellDate = parseISO(result.sell_date);
                        holdingDays = differenceInDays(sellDate, buyDate);
                    } catch (error) {
                        console.error('Error parsing dates:', error);
                    }
                }

                matchedTrades.push({
                    symbol: result.symbol,
                    signal: closestSignal,
                    result: updatedResult,
                    pnl_absolute: pnlAbsolute,
                    pnl_percentage: pnlPercentage,
                    risk_reward: riskReward,
                    holding_days: holdingDays
                });
            }
        });

        return matchedTrades;
    },

    // Calculate dashboard metrics (focus on percentage returns for equal position sizing)
    calculateMetrics(matchedTrades: MatchedTrade[]): DashboardMetrics {
        if (matchedTrades.length === 0) {
            return {
                total_trades: 0,
                winning_trades: 0,
                losing_trades: 0,
                holding_trades: 0,
                win_rate: 0,
                total_return_percentage: 0,
                avg_return_percentage: 0,
                avg_risk_reward: 0,
                max_drawdown_percentage: 0,
                avg_holding_days: 0
            };
        }

        const completedTrades = matchedTrades.filter(trade => trade.result.status !== 'HOLDING');
        const winningTrades = completedTrades.filter(trade => trade.result.status === 'WIN');
        const losingTrades = completedTrades.filter(trade => trade.result.status === 'LOSS');
        const holdingTrades = matchedTrades.filter(trade => trade.result.status === 'HOLDING');

        // Calculate win rate
        const winRate = completedTrades.length > 0
            ? (winningTrades.length / completedTrades.length) * 100
            : 0;

        // Calculate total return percentage (average of all trades since equal position sizing)
        const totalReturnPercentage = completedTrades.length > 0
            ? completedTrades.reduce((sum, trade) => sum + trade.pnl_percentage, 0)
            : 0;

        // Calculate average return percentage
        const avgReturnPercentage = completedTrades.length > 0
            ? totalReturnPercentage / completedTrades.length
            : 0;

        // Calculate average risk/reward
        const avgRiskReward = completedTrades.length > 0
            ? completedTrades.reduce((sum, trade) => sum + trade.risk_reward, 0) / completedTrades.length
            : 0;

        // Calculate max drawdown percentage (simplified - using percentage returns)
        let maxDrawdownPercentage = 0;
        let peak = 0;
        let runningTotal = 0;

        // Sort by date for drawdown calculation
        const sortedTrades = [...completedTrades].sort((a, b) => {
            const dateA = a.result.sell_date ? parseISO(a.result.sell_date).getTime() : 0;
            const dateB = b.result.sell_date ? parseISO(b.result.sell_date).getTime() : 0;
            return dateA - dateB;
        });

        sortedTrades.forEach(trade => {
            runningTotal += trade.pnl_percentage;
            if (runningTotal > peak) {
                peak = runningTotal;
            }
            const drawdown = peak - runningTotal;
            if (drawdown > maxDrawdownPercentage) {
                maxDrawdownPercentage = drawdown;
            }
        });

        // Calculate average holding days
        const completedWithDates = completedTrades.filter(trade => trade.holding_days !== null);
        const avgHoldingDays = completedWithDates.length > 0
            ? completedWithDates.reduce((sum, trade) => sum + (trade.holding_days || 0), 0) / completedWithDates.length
            : 0;

        return {
            total_trades: matchedTrades.length,
            winning_trades: winningTrades.length,
            losing_trades: losingTrades.length,
            holding_trades: holdingTrades.length,
            win_rate: parseFloat(winRate.toFixed(2)),
            total_return_percentage: parseFloat(totalReturnPercentage.toFixed(2)),
            avg_return_percentage: parseFloat(avgReturnPercentage.toFixed(2)),
            avg_risk_reward: parseFloat(avgRiskReward.toFixed(2)),
            max_drawdown_percentage: parseFloat(maxDrawdownPercentage.toFixed(2)),
            avg_holding_days: parseFloat(avgHoldingDays.toFixed(1))
        };
    },

    // Filter trades based on options
    filterTrades(matchedTrades: MatchedTrade[], filters: FilterOptions): MatchedTrade[] {
        return matchedTrades.filter(trade => {
            // Filter by symbol
            if (filters.symbol && filters.symbol !== 'ALL' && trade.symbol !== filters.symbol) {
                return false;
            }

            // Filter by status - handle SOLD (both WIN and LOSS)
            if (filters.status !== 'ALL') {
                if (filters.status === 'WIN') {
                    // When status is 'WIN' from FiltersPanel, it means SOLD (both WIN and LOSS)
                    // So we should include both WIN and LOSS trades
                    if (trade.result.status !== 'WIN' && trade.result.status !== 'LOSS') {
                        return false;
                    }
                } else if (trade.result.status !== filters.status) {
                    return false;
                }
            }

            // Filter by date range
            if (filters.startDate && trade.result.buy_date) {
                const buyDate = parseISO(trade.result.buy_date);
                const startDate = parseISO(filters.startDate);
                if (buyDate < startDate) {
                    return false;
                }
            }

            if (filters.endDate && trade.result.buy_date) {
                const buyDate = parseISO(trade.result.buy_date);
                const endDate = parseISO(filters.endDate);
                if (buyDate > endDate) {
                    return false;
                }
            }

            return true;
        });
    },

    // Buy monitoring functions
    async saveBuyMonitoring(buyData: Omit<BuyMonitoring, 'id' | 'created_at'>): Promise<string> {
        const buyMonitoringRef = ref(database, BUY_MONITORING_PATH);
        const newBuyRef = push(buyMonitoringRef);
        
        const buyMonitoring: BuyMonitoring = {
            ...buyData,
            created_at: Date.now()
        };

        await set(newBuyRef, buyMonitoring);
        return newBuyRef.key || '';
    },

    async getBuyMonitoringBySignalId(signalId: string): Promise<BuyMonitoring[]> {
        const buyMonitoringRef = ref(database, BUY_MONITORING_PATH);
        const signalQuery = query(buyMonitoringRef, orderByChild('signal_id'), equalTo(signalId));
        const snapshot = await get(signalQuery);

        if (!snapshot.exists()) {
            return [];
        }

        const data = snapshot.val();
        const buyMonitoring: BuyMonitoring[] = [];

        Object.keys(data).forEach((key) => {
            buyMonitoring.push({
                id: key,
                ...data[key]
            });
        });

        return buyMonitoring;
    },

    async getBuyMonitoringBySymbol(symbol: string): Promise<BuyMonitoring[]> {
        const buyMonitoringRef = ref(database, BUY_MONITORING_PATH);
        const symbolQuery = query(buyMonitoringRef, orderByChild('symbol'), equalTo(symbol));
        const snapshot = await get(symbolQuery);

        if (!snapshot.exists()) {
            return [];
        }

        const data = snapshot.val();
        const buyMonitoring: BuyMonitoring[] = [];

        Object.keys(data).forEach((key) => {
            buyMonitoring.push({
                id: key,
                ...data[key]
            });
        });

        return buyMonitoring;
    },

    subscribeToBuyMonitoring(callback: (buyMonitoring: BuyMonitoring[]) => void) {
        const buyMonitoringRef = ref(database, BUY_MONITORING_PATH);

        const handleData = (snapshot: any) => {
            const data = snapshot.val();
            const buyMonitoring: BuyMonitoring[] = [];

            if (data) {
                Object.keys(data).forEach((key) => {
                    buyMonitoring.push({
                        id: key,
                        ...data[key]
                    });
                });
            }

            callback(buyMonitoring);
        };

        onValue(buyMonitoringRef, handleData);

        // Return unsubscribe function
        return () => off(buyMonitoringRef, 'value', handleData);
    }
};
