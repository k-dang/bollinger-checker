import Alpaca from '@alpacahq/alpaca-trade-api';
import { BollingerBands } from 'trading-signals';
import { isNearOrPastUpperBand, isNearOrPastLowerBand } from './bollingerChecker';

const alpaca = new Alpaca({
  keyId: process.env.ALPACA_API_KEY,
  secretKey: process.env.ALPACA_API_SECRET,
});

const options = {
  start: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 35 days ago
  timeframe: alpaca.newTimeframe(1, alpaca.timeframeUnit.DAY),
};



const getBands = async (symbols: string[]) => {
  const bars = await alpaca.getMultiBarsV2(symbols, options);

  for (const [key, value] of bars.entries()) {
    console.log(key);

    const bb = new BollingerBands(20);

    for (const bar of value) {
      bb.add(bar.ClosePrice);
    }

    const { middle, upper, lower } = bb.getResultOrThrow();
    console.table(value);

    // compare the last price to the bands
    console.table([{ upper: upper.toPrecision(12), middle: middle.toPrecision(12), lower: lower.toPrecision(12) }]);
  }

  // TODO return an array?
};

(async () => {
  // get bands for the symbols
  const symbols = ['AAPL', 'TSLA'];
  // await getBands(symbols);

  // get the last price
  const quotes = await alpaca.getSnapshots(symbols);

  for (const [key, value] of quotes.entries()) {
    const latestQuote = value.LatestQuote;
    const latestTrade = value.LatestTrade;
    console.log(symbols[key]);
    console.log(`Latest Bid Price: ${latestQuote.BidPrice}, Latest Ask Price: ${latestQuote.AskPrice}`);

    // use latest trade price to compare with bands
    const latestTradePrice = latestTrade.Price;
  }
})();
