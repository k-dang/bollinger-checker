import { getLatestOptionChain } from '../../utils/yf';
import { OptionChain } from '../types/options';

export interface IOptionsProvider {
  getLatestOptionChain(symbol: string): Promise<OptionChain>;
}

/**
 * Yahoo Finance implementation of IOptionsProvider
 * Provides options chain data using the Yahoo Finance API
 */
export class YahooOptionsProvider implements IOptionsProvider {
  /**
   * Retrieves the latest options chain for a given symbol
   * @param symbol - The stock symbol to get options for
   * @returns Promise<OptionChain> - The options chain with calls and puts
   * @throws Error if no options chain is found or if the API call fails
   */
  async getLatestOptionChain(symbol: string): Promise<OptionChain> {
    try {
      console.log(`[YahooOptionsProvider][${new Date().toISOString()}]: Fetching options chain for ${symbol}`);

      const optionsChain = await getLatestOptionChain(symbol);

      // Transform the Yahoo Finance response to match our interface
      const transformedChain = {
        calls: optionsChain.calls.map((contract) => ({
          strike: contract.strike,
          lastPrice: contract.lastPrice,
          bid: contract.bid,
          ask: contract.ask,
          impliedVolatility: contract.impliedVolatility,
        })),
        puts: optionsChain.puts.map((contract) => ({
          strike: contract.strike,
          lastPrice: contract.lastPrice,
          bid: contract.bid,
          ask: contract.ask,
          impliedVolatility: contract.impliedVolatility,
        })),
      };

      console.log(
        `[YahooOptionsProvider][${new Date().toISOString()}]: Successfully fetched options chain for ${symbol} - ${transformedChain.calls.length} calls, ${transformedChain.puts.length} puts`,
      );

      return transformedChain;
    } catch (error) {
      console.error(`[YahooOptionsProvider][${new Date().toISOString()}]: Error fetching options chain for ${symbol}:`, error);
      throw new Error(`Failed to fetch options chain for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Mock implementation of IOptionsProvider for testing purposes
 * Returns static test data instead of making API calls
 */
export class MockOptionsProvider implements IOptionsProvider {
  private mockData: Record<string, OptionChain> = {};

  constructor() {
    // Initialize with some mock data for common symbols
    this.mockData['AAPL'] = {
      calls: [
        { strike: 220, lastPrice: 2.5, bid: 2.45, ask: 2.55, impliedVolatility: 0.25 },
        { strike: 225, lastPrice: 1.8, bid: 1.75, ask: 1.85, impliedVolatility: 0.23 },
        { strike: 230, lastPrice: 1.2, bid: 1.15, ask: 1.25, impliedVolatility: 0.21 },
      ],
      puts: [
        { strike: 200, lastPrice: 1.8, bid: 1.75, ask: 1.85, impliedVolatility: 0.22 },
        { strike: 195, lastPrice: 1.2, bid: 1.15, ask: 1.25, impliedVolatility: 0.2 },
        { strike: 190, lastPrice: 0.8, bid: 0.75, ask: 0.85, impliedVolatility: 0.18 },
      ],
    };
  }

  /**
   * Sets mock data for a specific symbol
   * @param symbol - The stock symbol
   * @param data - The mock options chain data
   */
  setMockData(symbol: string, data: OptionChain): void {
    this.mockData[symbol] = data;
  }

  async getLatestOptionChain(symbol: string): Promise<OptionChain> {
    console.log(`[MockOptionsProvider][${new Date().toISOString()}]: Returning mock options chain for ${symbol}`);

    if (!this.mockData[symbol]) {
      throw new Error(`No mock data available for symbol: ${symbol}`);
    }

    return this.mockData[symbol];
  }
}
