import { BollingerBands } from 'trading-signals';
import { Bar } from './alpaca';

/**
 * Returns true if the price is above the upper band, or within a given percentage threshold of the upper band.
 * @param price - The current price.
 * @param upperBandPrice - The upper Bollinger Band price.
 * @param thresholdPercent - The percentage threshold (default: 1 for 1%).
 */
export const isNearOrPastUpperBand = (price: number, upperBandPrice: number, thresholdPercent = 1): boolean => {
  const threshold = price * (1 + thresholdPercent / 100);
  return threshold >= upperBandPrice;
};

/**
 * Returns true if the price is below the lower band, or within a given percentage threshold of the lower band.
 * @param price - The current price.
 * @param lowerBandPrice - The lower Bollinger Band price.
 * @param thresholdPercent - The percentage threshold (default: 1 for 1%).
 */
export const isNearOrPastLowerBand = (price: number, lowerBandPrice: number, thresholdPercent = 1): boolean => {
  const threshold = price * (1 - thresholdPercent / 100);
  return threshold <= lowerBandPrice;
};

interface BollingerBandResult {
  upper: number;
  middle: number;
  lower: number;
}

export const getBollingerBands = async (bars: Map<string, Bar[]>): Promise<Record<string, BollingerBandResult>> => {
  const results: Record<string, BollingerBandResult> = {};

  for (const [symbol, value] of bars.entries()) {
    const bb = new BollingerBands(20);

    for (const bar of value) {
      bb.add(bar.ClosePrice);
    }

    // Note: `getResultOrThrow` will throw an error if the indicator is not stable.
    // We have more data points than the required period, so it should be stable.
    const { middle, upper, lower } = bb.getResultOrThrow();
    results[symbol] = {
      upper: upper.toNumber(),
      middle: middle.toNumber(),
      lower: lower.toNumber(),
    };
  }

  return results;
};

interface BandCheckResult {
  type: 'SELL_CALL' | 'SELL_PUT';
  symbol: string;
  result: string;
  resultValue: string;
  optionsTableTitle: string;
  optionsTable: string;
}

export const checkBollingerBands = async (bars: Map<string, Bar[]>, latestPrices: Record<string, number>) => {
  const bands = await getBollingerBands(bars);

  const results: BandCheckResult[] = [];
  for (const symbol of bars.keys()) {
    const latestPrice = latestPrices[symbol];
    const { upper, lower } = bands[symbol];

    if (isNearOrPastUpperBand(latestPrice, upper)) {
      // const optionsChain = await getYahooFinanceOptions('AAPL');
      // TODO get top 10 option chain
      results.push({
        type: 'SELL_CALL',
        symbol,
        result: 'Passed Upper band or within 1%',
        resultValue: `Current: ${latestPrice} \n Upper: ${upper}`,
        optionsTableTitle: 'TODO',
        optionsTable: '...',
      });
    } else if (isNearOrPastLowerBand(latestPrice, lower)) {
      // TODO get top 10 option chain
      results.push({
        type: 'SELL_PUT',
        symbol,
        result: 'Passed Lower band or within 1%',
        resultValue: `Current: ${latestPrice} \n Lower: ${lower}`,
        optionsTableTitle: 'TODO',
        optionsTable: '...',
      });
    }

    console.log(`[BollingerChecker][date(${new Date().toISOString()})]: Finished checking ${symbol}`);
  }

  return results;
};
