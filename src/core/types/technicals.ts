import { OptionContract } from './options';

export interface Bar {
  Timestamp: string; // ISO 8601 format
  ClosePrice: number;
  Symbol: string;
}

export interface BollingerBandResult {
  upper: number;
  middle: number;
  lower: number;
}

export interface BollingerSignal {
  symbol: string;
  type: 'SELL_CALL' | 'SELL_PUT';
  currentPrice: number;
  upperBand: number;
  lowerBand: number;
  middleBand: number;
  options: OptionContract[];
}

export interface RSISignal {
  symbol: string;
  rsi: number;
  isOverbought: boolean; // RSI > 70
  isOversold: boolean; // RSI < 30
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  status: string; // overbought, oversold, neutral
}

export interface MACDSignal {
  symbol: string;
  macd: number; // MACD line value
  signal: number; // Signal line value
  histogram: number; // MACD histogram (MACD - Signal)
  crossover: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; // Crossover direction
}
