import { BollingerBands } from 'trading-signals';
import { Bar } from './alpaca';
import { getLatestOptionChain } from './yf';

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

    const { middle, upper, lower } = bb.getResultOrThrow();
    results[symbol] = {
      upper: upper.toNumber(),
      middle: middle.toNumber(),
      lower: lower.toNumber(),
    };
  }

  return results;
};

interface OptionChainRow {
  strike: number;
  lastPrice: number;
  bid?: number;
  ask?: number;
  impliedVolatility?: number;
}

const optionsTableTitle = () => ['strike', 'lastPrice', 'bid', 'ask', 'iv'].join(' | ');

const buildOptionsTable = (chains: OptionChainRow[]) => {
  return chains
    .map((chain) => {
      const strike = chain.strike.toFixed(2);
      const lastPrice = chain.lastPrice.toFixed(2);
      const bid = chain.bid?.toFixed(2) ?? '0';
      const ask = chain.ask?.toFixed(2) ?? '0';
      const impliedVolatility = chain.impliedVolatility?.toFixed(6) ?? '0';
      const values = [strike, lastPrice, bid, ask, impliedVolatility];
      return values.join(' | ');
    })
    .join('\n');
};

export interface BandCheckResult {
  type: 'SELL_CALL' | 'SELL_PUT';
  symbol: string;
  result: string;
  resultValue: string;
  optionsTableTitle: string;
  optionsTable: string;
  optionsExpirationDate?: string;
}

export const checkBollingerBands = async (bars: Map<string, Bar[]>, latestPrices: Record<string, number>) => {
  const bands = await getBollingerBands(bars);

  const results: BandCheckResult[] = [];
  for (const symbol of bars.keys()) {
    const latestPrice = latestPrices[symbol];
    const { upper, lower } = bands[symbol];

    if (isNearOrPastUpperBand(latestPrice, upper)) {
      const optionsChain = await getLatestOptionChain(symbol);
      const topOutOfTheMoneyCalls = optionsChain.calls
        .filter((call) => {
          return call.strike > latestPrice;
        })
        .slice(0, 10);
      const optionsTable = buildOptionsTable(topOutOfTheMoneyCalls);

      results.push({
        type: 'SELL_CALL',
        symbol,
        result: 'Passed Upper band or within 1%',
        resultValue: `Current: ${latestPrice.toFixed(2)} \n Upper: ${upper.toFixed(2)}`,
        optionsTableTitle: optionsTableTitle(),
        optionsTable: optionsTable,
      });
    } else if (isNearOrPastLowerBand(latestPrice, lower)) {
      const optionsChain = await getLatestOptionChain(symbol);
      const topOutOfTheMoneyPuts = optionsChain.puts
        .filter((put) => {
          return put.strike < latestPrice;
        })
        .slice(0, 10);
      const optionsTable = buildOptionsTable(topOutOfTheMoneyPuts);

      results.push({
        type: 'SELL_PUT',
        symbol,
        result: 'Passed Lower band or within 1%',
        resultValue: `Current: ${latestPrice} \n Lower: ${lower}`,
        optionsTableTitle: optionsTableTitle(),
        optionsTable: optionsTable,
      });
    }

    console.log(`[BollingerChecker][date(${new Date().toISOString()})]: Finished checking ${symbol}`);
  }

  console.log(`[BollingerChecker][date(${new Date().toISOString()})]: Total results: ${results.length}`);
  return results;
};
