/**
 * Represents a single option contract with pricing and volatility data
 */
export interface OptionContract {
  strike: number;
  lastPrice: number;
  bid?: number;
  ask?: number;
  impliedVolatility?: number;
}

/**
 * Represents a complete options chain containing calls and puts
 */
export interface OptionChain {
  calls: OptionContract[];
  puts: OptionContract[];
}
