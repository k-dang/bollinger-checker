import yahooFinance from 'yahoo-finance2';

export const getYahooFinanceOptions = async (symbol: string) => {
  yahooFinance.suppressNotices(['yahooSurvey']);
  const queryOptions = { lang: 'en-US', formatted: false, region: 'US' };
  const quote = await yahooFinance.options(symbol, queryOptions);
  return quote.options;
};
