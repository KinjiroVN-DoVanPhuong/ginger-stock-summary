import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';

// Firebase configuration (same as in config.ts)
const firebaseConfig = {
    apiKey: "AIzaSyDummyKeyReplaceWithRealOne",
    authDomain: "ginger-stock-ai-trading.firebaseapp.com",
    databaseURL: "https://ginger-stock-ai-trading-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "ginger-stock-ai-trading",
    storageBucket: "ginger-stock-ai-trading.appspot.com",
    messagingSenderId: "110647972831847982934",
    appId: "1:110647972831847982934:web:dummy_app_id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Sample stock symbols
const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX'];

// Generate sample trading signals
function generateTradingSignals() {
    const signals: any = {};

    symbols.forEach((symbol, index) => {
        const basePrice = 100 + Math.random() * 900; // $100-$1000
        const entryPrice = basePrice;
        const stopLossPrice = entryPrice * (0.95 + Math.random() * 0.03); // 95-98% of entry
        const takeProfitPrice = entryPrice * (1.02 + Math.random() * 0.05); // 102-107% of entry
        const confidence = 70 + Math.random() * 25; // 70-95%

        signals[`signal_${index}`] = {
            symbol,
            entry_price: parseFloat(entryPrice.toFixed(2)),
            stop_loss_price: parseFloat(stopLossPrice.toFixed(2)),
            take_profit_price: parseFloat(takeProfitPrice.toFixed(2)),
            confidence: parseFloat(confidence.toFixed(1)),
            timestamp: Date.now() - (index * 86400000) // Spread over days
        };
    });

    return signals;
}

// Generate sample trade results
function generateTradeResults() {
    const results: any = {};
    let resultId = 0;

    symbols.forEach((symbol, symbolIndex) => {
        // Generate 2-4 trades per symbol
        const numTrades = 2 + Math.floor(Math.random() * 3);

        for (let i = 0; i < numTrades; i++) {
            const basePrice = 100 + Math.random() * 900;
            const buyPrice = basePrice;
            const isWin = Math.random() > 0.4; // 60% win rate
            const isHolding = Math.random() > 0.8; // 20% holding

            let sellPrice = null;
            let status: 'WIN' | 'LOSS' | 'HOLDING' = 'HOLDING';
            let sellDate = null;

            if (!isHolding) {
                if (isWin) {
                    sellPrice = buyPrice * (1.01 + Math.random() * 0.05); // 1-6% profit
                    status = 'WIN';
                } else {
                    sellPrice = buyPrice * (0.97 + Math.random() * 0.02); // 1-3% loss
                    status = 'LOSS';
                }
                sellPrice = parseFloat(sellPrice.toFixed(2));
                sellDate = new Date(Date.now() - (resultId * 2 * 86400000)).toISOString().split('T')[0];
            }

            const buyDate = new Date(Date.now() - (resultId * 2 * 86400000 + 86400000)).toISOString().split('T')[0];

            results[`result_${resultId}`] = {
                symbol,
                buy_price: parseFloat(buyPrice.toFixed(2)),
                sell_price: sellPrice,
                buy_date: buyDate,
                sell_date: sellDate,
                status,
                timestamp: Date.now() - (resultId * 2 * 86400000)
            };

            resultId++;
        }
    });

    return results;
}

// Write data to Firebase
async function writeSampleData() {
    try {
        console.log('Generating sample data...');

        const signals = generateTradingSignals();
        const results = generateTradeResults();

        console.log(`Generated ${Object.keys(signals).length} trading signals`);
        console.log(`Generated ${Object.keys(results).length} trade results`);

        // Write to Firebase
        await set(ref(database, 'trading_signals'), signals);
        console.log('✓ Trading signals written to Firebase');

        await set(ref(database, 'result_monitoring'), results);
        console.log('✓ Trade results written to Firebase');

        console.log('\n✅ Sample data generation complete!');
        console.log('\nData structure:');
        console.log('- trading_signals: AI-generated trading signals');
        console.log('- result_monitoring: Executed trades with results');
        console.log('\nYou can now run the dashboard to see the data in action.');

    } catch (error) {
        console.error('Error writing sample data:', error);
    }
}

// Run the script
writeSampleData();