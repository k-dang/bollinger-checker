import { OptionContract } from '../core/types/options';

export const optionsTableTitle = ['strike', 'lastPrice', 'bid', 'ask', 'iv'].join(' | ');

/**
 * Builds a formatted options table string from an array of option contracts
 * @param chains - Array of option contracts to format
 * @returns Formatted table string with pipe-separated columns
 */
export const buildOptionsTable = (chains: OptionContract[]) => {
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
