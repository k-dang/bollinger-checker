import Alpaca from '@alpacahq/alpaca-trade-api';

const alpaca = new Alpaca({
  keyId: process.env.ALPACA_API_KEY,
  secretKey: process.env.ALPACA_API_SECRET,
});

const options = {
  start: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 35 days ago
  timeframe: alpaca.newTimeframe(1, alpaca.timeframeUnit.DAY),
};

export const getBars = async (symbols: string[]) => {
  return alpaca.getMultiBarsV2(symbols, options);
};

export const getLatestPrices = async (symbols: string[]) => {
  const quotes = await alpaca.getSnapshots(symbols);
  return quotes.map((snapshot, index) => {
    return {
      symbol: symbols[index],
      latestPrice: snapshot.LatestTrade.Price,
    };
  });
};


