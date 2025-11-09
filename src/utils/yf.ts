import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({
  suppressNotices: ['yahooSurvey'],
  logger: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    info: (...args: any[]) => console.log('[YahooFinance] info', ...args),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    warn: (...args: any[]) => console.error('[YahooFinance] warn', ...args),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: (...args: any[]) => console.error('[YahooFinance] error', ...args),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    debug: (...args: any[]) => console.log('[YahooFinance] debug', ...args),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dir: (...args: any[]) => console.dir('[YahooFinance] dir', ...args),
  },
});

const getYahooFinanceOptionsChain = async (symbol: string) => {
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
