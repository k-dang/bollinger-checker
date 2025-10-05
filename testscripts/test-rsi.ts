import { evaluateRsiSignals } from '../src/core/checkers/rsiChecker';
import { AlpacaClient } from '../src/utils/alpaca';

const apiKey = process.env.ALPACA_API_KEY;
const apiSecret = process.env.ALPACA_API_SECRET;

// Fetch bar data from alpaca
const alpacaClient = new AlpacaClient(apiKey, apiSecret);
const tickers = ['AAPL'];

const bars = await alpacaClient.getBars(tickers, 71);

console.log('🔍 Testing RSI Calculation \n');

console.log(`📊 Calculating RSI for ${tickers.length} tickers...\n`);

// Calculate RSI with default parameters (14-period, 70/30 thresholds)
const rsiResults = evaluateRsiSignals(bars);

console.log('\n📈 RSI Results:');
console.log('================');

console.log(rsiResults.values());
