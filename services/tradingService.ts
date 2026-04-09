import { ref, onValue, off, get, query, orderByChild, equalTo, push, set, update } from 'firebase/database';
import { database } from '@/lib/firebase/config';
import { TradingSignal, TradeResult, MatchedTrade, DashboardMetrics, FilterOptions, BuyMonitoring, SellMonitoring } from '@/types/trading';
import { differenceInDays, parseISO } from 'date-fns';

const TRADING_SIGNALS_PATH = 'trading_signals';
const RESULT_MONITORING_PATH = 'result_monitoring';
const BUY_MONITORING_PATH = 'buy_monitoring';
const SELL_MONITORING_PATH = 'sell_monitoring';
const TRADING_SIGNAL_REQUEST_PATH = 'trading_signal_request';

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

    // Update signal status
    async updateSignalStatus(signalId: string, buyStatus: 'chua_mua' | 'da_mua'): Promise<void> {
        const signalRef = ref(database, `${TRADING_SIGNALS_PATH}/${signalId}`);
        await update(signalRef, {
            buy_status: buyStatus
        });
    },

    // Delete signal
    async deleteSignal(signalId: string): Promise<void> {
        const signalRef = ref(database, `${TRADING_SIGNALS_PATH}/${signalId}`);
        await set(signalRef, null);
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
        
        // Update signal status to 'da_mua'
        if (buyData.signal_id) {
            await this.updateSignalStatus(buyData.signal_id, 'da_mua');
        }
        
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
    },

    // Trading Signal Request functions
    async createTradingSignalRequest(): Promise<string> {
        const requestsRef = ref(database, TRADING_SIGNAL_REQUEST_PATH);
        const newRequestRef = push(requestsRef);
        
        const request = {
            request_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
            status: 'request',
            created_at: Date.now()
        };

        await set(newRequestRef, request);
        return newRequestRef.key || '';
    },

    async getTradingSignalRequests(): Promise<any[]> {
        const requestsRef = ref(database, TRADING_SIGNAL_REQUEST_PATH);
        const snapshot = await get(requestsRef);

        if (!snapshot.exists()) {
            return [];
        }

        const data = snapshot.val();
        const requests: any[] = [];

        Object.keys(data).forEach((key) => {
            requests.push({
                id: key,
                ...data[key]
            });
        });

        // Sort by created_at (newest first)
        requests.sort((a, b) => b.created_at - a.created_at);
        return requests;
    },

    async getLatestTradingSignalRequest(): Promise<any | null> {
        const requests = await this.getTradingSignalRequests();
        return requests.length > 0 ? requests[0] : null;
    },

    async hasActiveTradingSignalRequest(): Promise<boolean> {
        const requests = await this.getTradingSignalRequests();
        return requests.some(request => request.status === 'request' || request.status === 'running');
    },

    async deleteOldTradingSignalRequests(daysOld: number = 7): Promise<void> {
        const requests = await this.getTradingSignalRequests();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        
        const deletePromises = requests
            .filter(request => {
                const requestDate = new Date(request.request_date);
                return requestDate <= cutoffDate;
            })
            .map(request => {
                const requestRef = ref(database, `${TRADING_SIGNAL_REQUEST_PATH}/${request.id}`);
                return set(requestRef, null);
            });

        await Promise.all(deletePromises);
    },

    async updateTradingSignalRequestStatus(requestId: string, status: 'request' | 'running' | 'done' | 'error'): Promise<void> {
        const requestRef = ref(database, `${TRADING_SIGNAL_REQUEST_PATH}/${requestId}`);
        await update(requestRef, {
            status,
            updated_at: Date.now()
        });
    },

    // Sell monitoring functions
    async saveSellMonitoring(sellData: Omit<SellMonitoring, 'id' | 'created_at'>): Promise<string> {
        const sellMonitoringRef = ref(database, SELL_MONITORING_PATH);
        const newSellRef = push(sellMonitoringRef);
        
        const sellMonitoring: SellMonitoring = {
            ...sellData,
            created_at: Date.now()
        };

        await set(newSellRef, sellMonitoring);
        return newSellRef.key || '';
    },

    async getSellMonitoringByBuyId(buyMonitoringId: string): Promise<SellMonitoring[]> {
        const sellMonitoringRef = ref(database, SELL_MONITORING_PATH);
        const buyIdQuery = query(sellMonitoringRef, orderByChild('buy_monitoring_id'), equalTo(buyMonitoringId));
        const snapshot = await get(buyIdQuery);

        if (!snapshot.exists()) {
            return [];
        }

        const data = snapshot.val();
        const sellMonitoring: SellMonitoring[] = [];

        Object.keys(data).forEach((key) => {
            sellMonitoring.push({
                id: key,
                ...data[key]
            });
        });

        return sellMonitoring;
    },

    async getSellMonitoringBySymbol(symbol: string): Promise<SellMonitoring[]> {
        const sellMonitoringRef = ref(database, SELL_MONITORING_PATH);
        const symbolQuery = query(sellMonitoringRef, orderByChild('symbol'), equalTo(symbol));
        const snapshot = await get(symbolQuery);

        if (!snapshot.exists()) {
            return [];
        }

        const data = snapshot.val();
        const sellMonitoring: SellMonitoring[] = [];

        Object.keys(data).forEach((key) => {
            sellMonitoring.push({
                id: key,
                ...data[key]
            });
        });

        return sellMonitoring;
    },

    subscribeToSellMonitoring(callback: (sellMonitoring: SellMonitoring[]) => void) {
        const sellMonitoringRef = ref(database, SELL_MONITORING_PATH);

        const handleData = (snapshot: any) => {
            const data = snapshot.val();
            const sellMonitoring: SellMonitoring[] = [];

            if (data) {
                Object.keys(data).forEach((key) => {
                    sellMonitoring.push({
                        id: key,
                        ...data[key]
                    });
                });
            }

            callback(sellMonitoring);
        };

        onValue(sellMonitoringRef, handleData);

        // Return unsubscribe function
        return () => off(sellMonitoringRef, 'value', handleData);
    },

    // Asset calculation functions
    async getStockHoldings(): Promise<Array<{
        symbol: string;
        total_bought_volume: number;
        total_sold_volume: number;
        average_buy_price: number;
        current_holding_volume: number;
        total_investment: number;
        current_value: number;
        profit_loss_percentage: number;
        profit_loss_amount: number;
    }>> {
        const [buyMonitoring, sellMonitoring] = await Promise.all([
            this.getBuyMonitoring(),
            this.getSellMonitoring()
        ]);

        // Group by symbol
        const holdingsBySymbol: Record<string, {
            symbol: string;
            buyTransactions: BuyMonitoring[];
            sellTransactions: SellMonitoring[];
        }> = {};

        // Process buy transactions
        buyMonitoring.forEach(buy => {
            if (!holdingsBySymbol[buy.symbol]) {
                holdingsBySymbol[buy.symbol] = {
                    symbol: buy.symbol,
                    buyTransactions: [],
                    sellTransactions: []
                };
            }
            holdingsBySymbol[buy.symbol].buyTransactions.push(buy);
        });

        // Process sell transactions
        sellMonitoring.forEach(sell => {
            if (!holdingsBySymbol[sell.symbol]) {
                holdingsBySymbol[sell.symbol] = {
                    symbol: sell.symbol,
                    buyTransactions: [],
                    sellTransactions: []
                };
            }
            holdingsBySymbol[sell.symbol].sellTransactions.push(sell);
        });

        // Calculate holdings for each symbol
        const holdings = Object.values(holdingsBySymbol).map(holding => {
            const totalBoughtVolume = holding.buyTransactions.reduce((sum, buy) => sum + buy.volume, 0);
            const totalSoldVolume = holding.sellTransactions.reduce((sum, sell) => sum + sell.volume, 0);
            const currentHoldingVolume = totalBoughtVolume - totalSoldVolume;

            // Calculate average buy price (weighted by volume)
            const totalBuyValue = holding.buyTransactions.reduce((sum, buy) => sum + (buy.enter_price * buy.volume), 0);
            const averageBuyPrice = totalBoughtVolume > 0 ? totalBuyValue / totalBoughtVolume : 0;

            // Calculate total investment (based on bought volume)
            const totalInvestment = totalBuyValue;

            // Calculate current value (using average buy price for simplicity - in real app, would use current market price)
            const currentValue = currentHoldingVolume * averageBuyPrice;

            // Calculate profit/loss
            const totalSellValue = holding.sellTransactions.reduce((sum, sell) => sum + (sell.sell_price * sell.volume), 0);
            const profitLossAmount = totalSellValue - (averageBuyPrice * totalSoldVolume);
            const profitLossPercentage = (averageBuyPrice * totalSoldVolume) > 0 
                ? (profitLossAmount / (averageBuyPrice * totalSoldVolume)) * 100 
                : 0;

            return {
                symbol: holding.symbol,
                total_bought_volume: totalBoughtVolume,
                total_sold_volume: totalSoldVolume,
                average_buy_price: averageBuyPrice,
                current_holding_volume: currentHoldingVolume,
                total_investment: totalInvestment,
                current_value: currentValue,
                profit_loss_percentage: profitLossPercentage,
                profit_loss_amount: profitLossAmount
            };
        });

        return holdings;
    },

    async getBuyMonitoring(): Promise<BuyMonitoring[]> {
        const buyMonitoringRef = ref(database, BUY_MONITORING_PATH);
        const snapshot = await get(buyMonitoringRef);

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

    async getSellMonitoring(): Promise<SellMonitoring[]> {
        const sellMonitoringRef = ref(database, SELL_MONITORING_PATH);
        const snapshot = await get(sellMonitoringRef);

        if (!snapshot.exists()) {
            return [];
        }

        const data = snapshot.val();
        const sellMonitoring: SellMonitoring[] = [];

        Object.keys(data).forEach((key) => {
            sellMonitoring.push({
                id: key,
                ...data[key]
            });
        });

        return sellMonitoring;
    },

    // Delete buy monitoring by symbol
    async deleteBuyMonitoringBySymbol(symbol: string): Promise<void> {
        const buyMonitoring = await this.getBuyMonitoringBySymbol(symbol);
        
        const deletePromises = buyMonitoring.map(buy => {
            const buyRef = ref(database, `${BUY_MONITORING_PATH}/${buy.id}`);
            return set(buyRef, null);
        });

        await Promise.all(deletePromises);
    },

    // Check and delete buy orders when total sell volume equals total buy volume for a symbol
    async checkAndDeleteFullySoldBuyOrders(): Promise<void> {
        const [buyMonitoring, sellMonitoring] = await Promise.all([
            this.getBuyMonitoring(),
            this.getSellMonitoring()
        ]);

        // Group buy orders by symbol
        const buyBySymbol: Record<string, BuyMonitoring[]> = {};
        buyMonitoring.forEach(buy => {
            if (!buyBySymbol[buy.symbol]) {
                buyBySymbol[buy.symbol] = [];
            }
            buyBySymbol[buy.symbol].push(buy);
        });

        // Group sell orders by symbol
        const sellBySymbol: Record<string, SellMonitoring[]> = {};
        sellMonitoring.forEach(sell => {
            if (!sellBySymbol[sell.symbol]) {
                sellBySymbol[sell.symbol] = [];
            }
            sellBySymbol[sell.symbol].push(sell);
        });

        // Check each symbol
        const symbolsToDelete: string[] = [];

        for (const symbol in buyBySymbol) {
            const totalBuyVolume = buyBySymbol[symbol].reduce((sum, buy) => sum + buy.volume, 0);
            const totalSellVolume = sellBySymbol[symbol] 
                ? sellBySymbol[symbol].reduce((sum, sell) => sum + sell.volume, 0)
                : 0;

            // If total sell volume equals total buy volume, mark for deletion
            if (totalBuyVolume > 0 && totalSellVolume === totalBuyVolume) {
                symbolsToDelete.push(symbol);
            }
        }

        // Delete buy orders for symbols that are fully sold
        const deletePromises = symbolsToDelete.map(symbol => 
            this.deleteBuyMonitoringBySymbol(symbol)
        );

        await Promise.all(deletePromises);
    }
};
