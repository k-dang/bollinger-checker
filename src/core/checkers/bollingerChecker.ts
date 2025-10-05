import { BollingerBands } from 'trading-signals';
import { IOptionsProvider } from '@/core/providers/OptionsProvider';
import { buildOptionsTable, optionsTableTitle } from '@/utils/optionsTable';
import { Bar, BandCheckResult, BollingerBandResult } from '@/core/types/technicals';

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

export const getBollingerBands = async (bars: Map<string, Bar[]>) => {
  const results: Record<string, BollingerBandResult> = {};

  for (const [symbol, value] of bars.entries()) {
    const bb = new BollingerBands(20);

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

export const checkBollingerBands = async (
  bars: Map<string, Bar[]>,
  latestPrices: Record<string, number>,
  optionsProvider: IOptionsProvider,
) => {
  const bands = await getBollingerBands(bars);

  const results: BandCheckResult[] = [];

  for (const symbol of bars.keys()) {
    const latestPrice = latestPrices[symbol];
    const { upper, lower } = bands[symbol];

    if (isNearOrPastUpperBand(latestPrice, upper)) {
      const optionsChain = await optionsProvider.getLatestOptionChain(symbol);
      const top10OutOfTheMoneyCalls = optionsChain.calls
        .filter((call) => {
          return call.strike > latestPrice;
        })
        .slice(0, 10);
      const optionsTable = buildOptionsTable(top10OutOfTheMoneyCalls);

      results.push({
        type: 'SELL_CALL',
        symbol,
        resultTitle: 'Passed Upper band or within 1%',
        resultValue: `Current: ${latestPrice.toFixed(2)} \n Upper: ${upper.toFixed(2)}`,
        optionsTableTitle: optionsTableTitle,
        optionsTable: optionsTable,
      });
    } else if (isNearOrPastLowerBand(latestPrice, lower)) {
      const optionsChain = await optionsProvider.getLatestOptionChain(symbol);
      const top10OutOfTheMoneyPuts = optionsChain.puts
        .filter((put) => {
          return put.strike < latestPrice;
        })
        .slice(0, 10);
      const optionsTable = buildOptionsTable(top10OutOfTheMoneyPuts);

      results.push({
        type: 'SELL_PUT',
        symbol,
        resultTitle: 'Passed Lower band or within 1%',
        resultValue: `Current: ${latestPrice.toFixed(2)} \n Lower: ${lower.toFixed(2)}`,
        optionsTableTitle: optionsTableTitle,
        optionsTable: optionsTable,
      });
    }

    console.log(`[BollingerChecker][date(${new Date().toISOString()})]: Finished checking ${symbol}`);
  }

  console.log(`[BollingerChecker][date(${new Date().toISOString()})]: Total results: ${results.length}`);
  return results;
};
