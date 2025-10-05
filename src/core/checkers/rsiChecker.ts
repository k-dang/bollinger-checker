import { RSI, MovingAverageTypes, WSMA } from 'trading-signals';
import { Bar, RSIResult } from '@/core/types/technicals';

/**
 * Calculate RSI values for multiple tickers using historical price data
 * @param bars - Map of ticker symbols to their historical bar data
 * @param period - RSI calculation period (default: 14)
 * @param overboughtThreshold - RSI threshold for overbought condition (default: 70)
 * @param oversoldThreshold - RSI threshold for oversold condition (default: 30)
 * @param smoothingIndicator - Smoothing indicator to use for RSI calculation (default: WSMA)
 * @returns Map of RSI results where key is symbol and value is RSI result
 */
export const evaluateRsiSignals = (
  bars: Map<string, Bar[]>,
  period = 14,
  overboughtThreshold = 70,
  oversoldThreshold = 30,
  smoothingIndicator: MovingAverageTypes = WSMA,
) => {
  const results = new Map<string, RSIResult>();

  for (const [symbol, barData] of bars.entries()) {
    if (barData.length < period) {
      console.warn(`[RSI] Insufficient data for ${symbol}. Need at least ${period} data points, got ${barData.length}`);
      continue;
    }

    const rsi = new RSI(period, smoothingIndicator);

    // Add all closing prices to the RSI calculator
    for (const bar of barData) {
      rsi.add(bar.ClosePrice);
    }

    const rsiValue = rsi.getResultOrThrow();

    if (rsiValue === null) {
      console.warn(`[RSI] Could not calculate RSI for ${symbol}`);
      continue;
    }

    const rsiNumber = rsiValue.toNumber();
    const isOverbought = rsiNumber > overboughtThreshold;
    const isOversold = rsiNumber < oversoldThreshold;

    // Determine trading signal
    let signal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
    if (isOversold) {
      signal = 'BUY'; // Potential buy signal when oversold
    } else if (isOverbought) {
      signal = 'SELL'; // Potential sell signal when overbought
    }

    results.set(symbol, {
      symbol,
      rsi: rsiNumber,
      isOverbought,
      isOversold,
      signal,
      status: isOverbought ? '🔴 OVERBOUGHT' : isOversold ? '🟢 OVERSOLD' : '⚪ NEUTRAL',
    });
  }

  return results;
};
