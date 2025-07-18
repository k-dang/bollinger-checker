import yahooFinance from 'yahoo-finance2';

const getYahooFinanceOptionsChain = async (symbol: string) => {
  yahooFinance.suppressNotices(['yahooSurvey']);
  const queryOptions = { lang: 'en-US', formatted: false, region: 'US' };
  const quote = await yahooFinance.options(symbol, queryOptions);
  return quote.options;
};

export const getLatestOptionChain = async (symbol: string) => {
  const optionsChain = await getYahooFinanceOptionsChain(symbol);
  if (optionsChain.length === 0) {
    throw new Error(`No options chain found for symbol: ${symbol}`);
  }
  return optionsChain[0];
};
