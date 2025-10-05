import { expect, test, describe } from 'vitest';
import { isNearOrPastUpperBand, isNearOrPastLowerBand, getBollingerBands } from './bollingerChecker';
import { Bar } from '@/core/types/technicals';

describe('isNearOrPastUpperBand', () => {
  describe('default threshold', () => {
    test.each([
      { price: 110, upperBand: 100, expected: true },
      { price: 100, upperBand: 100, expected: true },
      { price: 99, upperBand: 100, expected: true },
      { price: 98, upperBand: 100, expected: false },
      { price: 80, upperBand: 100, expected: false },
    ])('price=$price, upperBand=$upperBand => $expected', ({ price, upperBand, expected }) => {
      expect(isNearOrPastUpperBand(price, upperBand)).toBe(expected);
    });
  });

  describe('with custom threshold values', () => {
    test.each([
      // Test with 0% threshold - only exact match or above counts
      { price: 105, upperBand: 100, threshold: 0, expected: true },
      { price: 100, upperBand: 100, threshold: 0, expected: true },
      { price: 99.99, upperBand: 100, threshold: 0, expected: false },

      // Test with 5% threshold
      { price: 105, upperBand: 100, threshold: 5, expected: true },
      { price: 95, upperBand: 100, threshold: 5, expected: true },
      { price: 94.99, upperBand: 100, threshold: 5, expected: false },

      // Test with 0.5% threshold (decimal values)
      { price: 100, upperBand: 100, threshold: 0.5, expected: true },
      { price: 99.5, upperBand: 100, threshold: 0.5, expected: true },
      { price: 99.49, upperBand: 100, threshold: 0.5, expected: false },
    ])('price=$price, upperBand=$upperBand, threshold=$threshold => $expected', ({ price, upperBand, threshold, expected }) => {
      expect(isNearOrPastUpperBand(price, upperBand, threshold)).toBe(expected);
    });
  });
});

describe('isNearOrPastLowerBand', () => {
  describe('default threshold', () => {
    test.each([
      { price: 80, lowerBand: 100, expected: true },
      { price: 100, lowerBand: 100, expected: true },
      { price: 101, lowerBand: 100, expected: true },
      { price: 102, lowerBand: 100, expected: false },
      { price: 120, lowerBand: 100, expected: false },
    ])('price=$price, lowerBand=$lowerBand => $expected', ({ price, lowerBand, expected }) => {
      expect(isNearOrPastLowerBand(price, lowerBand)).toBe(expected);
    });
  });

  describe('with custom threshold values', () => {
    test.each([
      // Test with 0% threshold - only exact match or below counts
      { price: 95, lowerBand: 100, threshold: 0, expected: true },
      { price: 100, lowerBand: 100, threshold: 0, expected: true },
      { price: 100.01, lowerBand: 100, threshold: 0, expected: false },

      // Test with 5% threshold
      { price: 95, lowerBand: 100, threshold: 5, expected: true },
      { price: 105, lowerBand: 100, threshold: 5, expected: true },
      { price: 105.01, lowerBand: 100, threshold: 5, expected: false },

      // Test with 0.5% threshold (decimal values)
      { price: 100, lowerBand: 100, threshold: 0.5, expected: true },
      { price: 100.49, lowerBand: 100, threshold: 0.5, expected: true },
      { price: 100.51, lowerBand: 100, threshold: 0.5, expected: false },
    ])('price=$price, lowerBand=$lowerBand, threshold=$threshold => $expected', ({ price, lowerBand, threshold, expected }) => {
      expect(isNearOrPastLowerBand(price, lowerBand, threshold)).toBe(expected);
    });
  });
});

describe('getBollingerBands', () => {
  test('should calculate Bollinger Bands for multiple symbols', async () => {
    const bars = new Map<string, Bar[]>();
    
    // Create test data for two symbols
    const symbol1Bars: Bar[] = [];
    const symbol2Bars: Bar[] = [];
    
    for (let i = 0; i < 25; i++) {
      symbol1Bars.push({
        Timestamp: new Date(2024, 0, i + 1).toISOString(),
        ClosePrice: 50 + i * 0.5, // Rising trend
        Symbol: 'SYMBOL1',
      });
      
      symbol2Bars.push({
        Timestamp: new Date(2024, 0, i + 1).toISOString(),
        ClosePrice: 200 - i * 0.3, // Falling trend
        Symbol: 'SYMBOL2',
      });
    }
    
    bars.set('SYMBOL1', symbol1Bars);
    bars.set('SYMBOL2', symbol2Bars);

    const result = await getBollingerBands(bars);

    expect(Object.keys(result)).toHaveLength(2);
    expect(result).toHaveProperty('SYMBOL1');
    expect(result).toHaveProperty('SYMBOL2');
    
    // Both symbols should have valid Bollinger Band results
    expect(result.SYMBOL1.upper).toBeGreaterThan(result.SYMBOL1.middle);
    expect(result.SYMBOL1.middle).toBeGreaterThan(result.SYMBOL1.lower);
    expect(result.SYMBOL2.upper).toBeGreaterThan(result.SYMBOL2.middle);
    expect(result.SYMBOL2.middle).toBeGreaterThan(result.SYMBOL2.lower);
  });

  test('should handle empty bars map', async () => {
    const bars = new Map<string, Bar[]>();
    const result = await getBollingerBands(bars);
    
    expect(result).toEqual({});
  });

  test('should handle symbol with insufficient data (less than 20 bars)', async () => {
    const testBars: Bar[] = [];
    for (let i = 0; i < 10; i++) {
      testBars.push({
        Timestamp: new Date(2024, 0, i + 1).toISOString(),
        ClosePrice: 100 + i,
        Symbol: 'INSUFFICIENT',
      });
    }

    const bars = new Map<string, Bar[]>();
    bars.set('INSUFFICIENT', testBars);

    // This should throw an error since BollingerBands requires at least 20 data points
    await expect(getBollingerBands(bars)).rejects.toThrow();
  });
});
