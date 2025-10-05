import { BollingerBands } from 'trading-signals';
import { IOptionsProvider } from '@/core/providers/OptionsProvider';
import { buildOptionsTable, optionsTableTitle } from '@/utils/optionsTable';
import { Bar, BandCheckResult, BollingerBandResult } from '@/core/types/technicals';
import { OptionContract } from '@/core/types/options';

/**
 * Returns true if the price is above the upper band, or within a given percentage threshold of the upper band.
 * @param price - The current price.
 * @param upperBandPrice - The upper Bollinger Band price.
 * @param thresholdPercent - The percentage threshold (default: 1 for 1%).
 */
export const isNearOrPastUpperBand = (price: number, upperBandPrice: number, thresholdPercent = 1) => {
  const lowerThreshold = upperBandPrice * (1 - thresholdPercent / 100);
  return price >= lowerThreshold;
};

/**
 * Returns true if the price is below the lower band, or within a given percentage threshold of the lower band.
 * @param price - The current price.
 * @param lowerBandPrice - The lower Bollinger Band price.
 * @param thresholdPercent - The percentage threshold (default: 1 for 1%).
 */
export const isNearOrPastLowerBand = (price: number, lowerBandPrice: number, thresholdPercent = 1) => {
  const upperThreshold = lowerBandPrice * (1 + thresholdPercent / 100);
  return price <= upperThreshold;
};

/**
 * Calculates Bollinger Bands for multiple symbols
 * @param bars - Map of symbol to price bars
 * @param period - Number of periods for calculation (default: 20)
 * @returns Record of symbol to Bollinger Band values
 * @throws Error if insufficient data for any symbol
 */
export const getBollingerBands = async (bars: Map<string, Bar[]>, period = 20): Promise<Record<string, BollingerBandResult>> => {
  const results: Record<string, BollingerBandResult> = {};

  for (const [symbol, value] of bars.entries()) {
    const bb = new BollingerBands(period);

    for (const bar of value) {
      bb.add(bar.ClosePrice);
    }

    const { middle, upper, lower } = bb.getResultOrThrow();
    results[symbol] = {
      upper: upper.toNumber(),
      middle: middle.toNumber(),
      lower: lower.toNumber(),
    };
  }

  return results;
};

/**
 * Filters out-of-the-money call options above the current price
 * @param calls - Array of call option contracts
 * @param currentPrice - Current stock price
 * @param limit - Maximum number of options to return
 * @returns Filtered and limited array of call options
 */
export const filterOutOfTheMoneyCallOptions = (calls: OptionContract[], currentPrice: number, limit: number): OptionContract[] => {
  return calls.filter((call) => call.strike > currentPrice).slice(0, limit);
};

/**
 * Filters out-of-the-money put options below the current price
 * @param puts - Array of put option contracts
 * @param currentPrice - Current stock price
 * @param limit - Maximum number of options to return
 * @returns Filtered and limited array of put options
 */
export const filterOutOfTheMoneyPutOptions = (puts: OptionContract[], currentPrice: number, limit: number): OptionContract[] => {
  return puts.filter((put) => put.strike < currentPrice).slice(0, limit);
};

/**
 * Creates a sell call signal result
 */
const createSellCallResult = (symbol: string, latestPrice: number, upperBand: number, optionsTable: string): BandCheckResult => ({
  type: 'SELL_CALL',
  symbol,
  resultTitle: 'Passed Upper band or within 1%',
  resultValue: `Current: ${latestPrice.toFixed(2)} \n Upper: ${upperBand.toFixed(2)}`,
  optionsTableTitle,
  optionsTable,
});

/**
 * Creates a sell put signal result
 */
const createSellPutResult = (symbol: string, latestPrice: number, lowerBand: number, optionsTable: string): BandCheckResult => ({
  type: 'SELL_PUT',
  symbol,
  resultTitle: 'Passed Lower band or within 1%',
  resultValue: `Current: ${latestPrice.toFixed(2)} \n Lower: ${lowerBand.toFixed(2)}`,
  optionsTableTitle,
  optionsTable,
});

/**
 * Evaluates a single symbol for Bollinger Band signals
 */
const evaluateSymbolSignal = async (
  symbol: string,
  latestPrice: number,
  bands: BollingerBandResult,
  optionsProvider: IOptionsProvider,
): Promise<BandCheckResult | null> => {
  const { upper, lower } = bands;

  // Check upper band signal
  if (isNearOrPastUpperBand(latestPrice, upper)) {
    const optionsChain = await optionsProvider.getLatestOptionChain(symbol);
    const filteredCalls = filterOutOfTheMoneyCallOptions(optionsChain.calls, latestPrice, 10);
    const optionsTable = buildOptionsTable(filteredCalls);

    return createSellCallResult(symbol, latestPrice, upper, optionsTable);
  }

  // Check lower band signal
  if (isNearOrPastLowerBand(latestPrice, lower)) {
    const optionsChain = await optionsProvider.getLatestOptionChain(symbol);
    const filteredPuts = filterOutOfTheMoneyPutOptions(optionsChain.puts, latestPrice, 10);
    const optionsTable = buildOptionsTable(filteredPuts);

    return createSellPutResult(symbol, latestPrice, lower, optionsTable);
  }

  return null;
};

/**
 * Evaluates Bollinger Band signals for multiple symbols and returns trading opportunities
 * @param bars - Historical price data for each symbol
 * @param latestPrices - Current prices for each symbol
 * @param optionsProvider - Provider for fetching options chain data
 * @returns Array of band check results with trading signals
 * @throws Error if Bollinger Bands cannot be calculated
 */
export const evaluateBollingerSignals = async (
  bars: Map<string, Bar[]>,
  latestPrices: Record<string, number>,
  optionsProvider: IOptionsProvider,
): Promise<BandCheckResult[]> => {
  // Calculate Bollinger Bands for all symbols
  const bands = await getBollingerBands(bars);

  // Evaluate signals for each symbol
  const results: BandCheckResult[] = [];
  for (const symbol of bars.keys()) {
    const latestPrice = latestPrices[symbol];
    const symbolBands = bands[symbol];

    const result = await evaluateSymbolSignal(symbol, latestPrice, symbolBands, optionsProvider);

    if (result !== null) {
      results.push(result);
    }

    console.log(`[BollingerChecker][date(${new Date().toISOString()})]: Finished checking ${symbol}`);
  }

  console.log(`[BollingerChecker][date(${new Date().toISOString()})]: Total results: ${results.length}`);
  return results;
};
