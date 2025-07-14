import { BollingerBands } from 'trading-signals';
import { getBars } from './alpaca';

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
  upper: string;
  middle: string;
  lower: string;
}

export const getBollingerBands = async (symbols: string[]): Promise<Record<string, BollingerBandResult>> => {
  const bars = await getBars(symbols);
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
      upper: upper.toPrecision(12),
      middle: middle.toPrecision(12),
      lower: lower.toPrecision(12),
    };
  }

  return results;
};
