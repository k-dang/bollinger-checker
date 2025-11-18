import { MACD, EMA } from 'trading-signals';
import { Bar, MACDSignal } from '@/core/types/technicals';

/**
 * Calculate MACD values for multiple tickers using historical price data
 * @param bars - Map of ticker symbols to their historical bar data
 * @param fastPeriod - Fast EMA period (default: 12)
 * @param slowPeriod - Slow EMA period (default: 26)
 * @param signalPeriod - Signal line EMA period (default: 9)
 * @returns Map of MACD results where key is symbol and value is MACD result
 */
export const evaluateMacdSignals = (
  bars: Map<string, Bar[]>,
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
) => {
  const results = new Map<string, MACDSignal>();
  const minRequiredBars = slowPeriod + signalPeriod; // Need enough data for slow EMA + signal line

  for (const [symbol, barData] of bars.entries()) {
    if (barData.length < minRequiredBars) {
      console.warn(
        `[MACD] Insufficient data for ${symbol}. Need at least ${minRequiredBars} data points, got ${barData.length}`,
      );
      continue;
    }

    const fastEMA = new EMA(fastPeriod);
    const slowEMA = new EMA(slowPeriod);
    const signalEMA = new EMA(signalPeriod);
    const macd = new MACD(fastEMA, slowEMA, signalEMA);

    // Track previous MACD and signal values to detect crossovers
    let previousMacd: number | null = null;
    let previousSignal: number | null = null;

    // Add all closing prices to the MACD calculator, tracking intermediate values
    for (let i = 0; i < barData.length; i++) {
      macd.add(barData[i].ClosePrice);

      // Try to get result after each addition (may return null until enough data)
      try {
        const intermediateResult = macd.getResult();
        if (intermediateResult !== null && i < barData.length - 1) {
          // Store second-to-last values for crossover detection
          previousMacd = intermediateResult.macd;
          previousSignal = intermediateResult.signal;
        }
      } catch {
        // Not enough data yet, continue
      }
    }

    const macdResult = macd.getResultOrThrow();

    if (macdResult === null) {
      console.warn(`[MACD] Could not calculate MACD for ${symbol}`);
      continue;
    }

    const { macd: macdValue, signal: signalValue, histogram } = macdResult;

    // Detect crossover: bullish when MACD crosses above signal, bearish when MACD crosses below signal
    let crossover: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    if (previousMacd !== null && previousSignal !== null) {
      const wasBelow = previousMacd < previousSignal;
      const isAbove = macdValue > signalValue;

      if (wasBelow && isAbove) {
        crossover = 'BULLISH'; // MACD crossed above signal line
      } else if (!wasBelow && !isAbove) {
        crossover = 'BEARISH'; // MACD crossed below signal line
      }
    } else {
      // Fallback: use current position relative to signal line
      if (macdValue > signalValue) {
        crossover = 'BULLISH';
      } else if (macdValue < signalValue) {
        crossover = 'BEARISH';
      }
    }

    results.set(symbol, {
      symbol,
      macd: macdValue,
      signal: signalValue,
      histogram,
      crossover,
    });
  }

  return results;
};

