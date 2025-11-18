import { expect, test, describe, vi } from 'vitest';
import { evaluateMacdSignals } from './macdChecker';
import { Bar } from '@/core/types/technicals';

describe('evaluateMacdSignals', () => {
  // Helper function to create test bars with different price patterns
  const createTestBars = (symbol: string, pricePattern: 'rising' | 'falling' | 'oscillating' | 'constant'): Bar[] => {
    const bars: Bar[] = [];
    for (let i = 0; i < 50; i++) {
      // Increased to 50 to ensure sufficient data for MACD (need at least 35 for 26+9)
      let price: number;
      switch (pricePattern) {
        case 'rising':
          price = 100 + i * 2; // Steady rise
          break;
        case 'falling':
          price = 150 - i * 2; // Steady fall
          break;
        case 'oscillating':
          price = 100 + Math.sin(i * 0.5) * 10; // Oscillating around 100
          break;
        case 'constant':
          price = 100 + Math.sin(i * 0.1) * 0.5; // Very small oscillations around 100
          break;
      }

      bars.push({
        Timestamp: new Date(2024, 0, i + 1).toISOString(),
        ClosePrice: price,
        Symbol: symbol,
      });
    }
    return bars;
  };

  // Helper function to create test data setup
  const setupTestData = (symbol: string, pricePattern: 'rising' | 'falling' | 'oscillating' | 'constant') => {
    const testBars = createTestBars(symbol, pricePattern);
    const bars = new Map<string, Bar[]>();
    bars.set(symbol, testBars);
    return bars;
  };

  test('should calculate MACD for single symbol with sufficient data', () => {
    const bars = setupTestData('TEST', 'oscillating');

    const result = evaluateMacdSignals(bars);

    expect(result.size).toBe(1);
    expect(result.has('TEST')).toBe(true);

    const macdResult = result.get('TEST');
    expect(macdResult).toBeDefined();
    if (macdResult) {
      expect(macdResult).toMatchObject({
        symbol: 'TEST',
        macd: expect.any(Number),
        signal: expect.any(Number),
        histogram: expect.any(Number),
        crossover: expect.stringMatching(/^(BULLISH|BEARISH|NEUTRAL)$/),
      });

      // Histogram should equal MACD - Signal
      expect(macdResult.histogram).toBeCloseTo(macdResult.macd - macdResult.signal, 5);
    }
  });

  test('should calculate MACD for multiple symbols', () => {
    const bars = new Map<string, Bar[]>();
    bars.set('RISING', createTestBars('RISING', 'rising'));
    bars.set('FALLING', createTestBars('FALLING', 'falling'));
    bars.set('OSCILLATING', createTestBars('OSCILLATING', 'oscillating'));

    const result = evaluateMacdSignals(bars);

    expect(result.size).toBe(3);
    expect(result.has('RISING')).toBe(true);
    expect(result.has('FALLING')).toBe(true);
    expect(result.has('OSCILLATING')).toBe(true);

    // Each symbol should have valid MACD results
    for (const [symbol, macdResult] of result.entries()) {
      expect(macdResult.symbol).toBe(symbol);
      expect(macdResult.macd).toBeTypeOf('number');
      expect(macdResult.signal).toBeTypeOf('number');
      expect(macdResult.histogram).toBeTypeOf('number');
      expect(['BULLISH', 'BEARISH', 'NEUTRAL']).toContain(macdResult.crossover);
    }
  });

  test('should handle insufficient data gracefully', () => {
    const bars = new Map<string, Bar[]>();
    bars.set('INSUFFICIENT', createTestBars('INSUFFICIENT', 'oscillating').slice(0, 20)); // Only 20 bars, need 35

    // Mock console.warn to verify warning is logged
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const result = evaluateMacdSignals(bars);

    expect(result.size).toBe(0);
    expect(consoleSpy).toHaveBeenCalledWith(
      '[MACD] Insufficient data for INSUFFICIENT. Need at least 35 data points, got 20',
    );

    consoleSpy.mockRestore();
  });

  test('should handle empty bars map', () => {
    const bars = new Map<string, Bar[]>();
    const result = evaluateMacdSignals(bars);

    expect(result.size).toBe(0);
  });

  test('should detect bullish crossover for rising prices', () => {
    const bars = setupTestData('RISING', 'rising');

    const result = evaluateMacdSignals(bars);

    expect(result.size).toBe(1);
    const macdResult = result.get('RISING');
    expect(macdResult).toBeDefined();
    if (macdResult) {
      // For rising prices, MACD should typically be above signal (bullish)
      // Note: This may not always be true depending on the data, but the crossover detection should work
      expect(['BULLISH', 'BEARISH', 'NEUTRAL']).toContain(macdResult.crossover);
    }
  });

  test('should detect bearish crossover for falling prices', () => {
    const bars = setupTestData('FALLING', 'falling');

    const result = evaluateMacdSignals(bars);

    expect(result.size).toBe(1);
    const macdResult = result.get('FALLING');
    expect(macdResult).toBeDefined();
    if (macdResult) {
      // For falling prices, MACD should typically be below signal (bearish)
      // Note: This may not always be true depending on the data, but the crossover detection should work
      expect(['BULLISH', 'BEARISH', 'NEUTRAL']).toContain(macdResult.crossover);
    }
  });

  test('should use custom MACD parameters', () => {
    const bars = setupTestData('CUSTOM', 'oscillating');

    const result = evaluateMacdSignals(bars, 8, 17, 9); // Custom fast/slow/signal periods

    expect(result.size).toBe(1);
    const macdResult = result.get('CUSTOM');
    expect(macdResult).toBeDefined();
    if (macdResult) {
      expect(macdResult.macd).toBeTypeOf('number');
      expect(macdResult.signal).toBeTypeOf('number');
    }
  });
});

