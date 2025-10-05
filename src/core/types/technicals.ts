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

export interface BandCheckResult {
  type: 'SELL_CALL' | 'SELL_PUT';
  symbol: string;
  resultTitle: string; // Passed Upper band | Passed Lower band
  resultValue: string; // Current x | Upper x | Lower x
  optionsTableTitle: string;
  optionsTable: string;
}

export interface RSIResult {
  symbol: string;
  rsi: number;
  isOverbought: boolean; // RSI > 70
  isOversold: boolean; // RSI < 30
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  status: string; // overbought, oversold, neutral
}
