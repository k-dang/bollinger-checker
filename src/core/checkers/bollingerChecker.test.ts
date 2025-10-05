import { expect, test, describe, vi } from 'vitest';
import {
  isNearOrPastUpperBand,
  isNearOrPastLowerBand,
  getBollingerBands,
  evaluateBollingerSignals,
  filterOutOfTheMoneyCallOptions,
  filterOutOfTheMoneyPutOptions,
} from './bollingerChecker';
import { Bar } from '@/core/types/technicals';
import { IOptionsProvider } from '@/core/providers/OptionsProvider';
import { OptionContract } from '@/core/types/options';

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

describe('filterOutOfTheMoneyCallOptions', () => {
  const mockCalls: OptionContract[] = [
    { strike: 95, lastPrice: 2.0, bid: 1.9, ask: 2.1 },
    { strike: 100, lastPrice: 1.5, bid: 1.4, ask: 1.6 },
    { strike: 105, lastPrice: 1.0, bid: 0.9, ask: 1.1 },
    { strike: 110, lastPrice: 0.5, bid: 0.4, ask: 0.6 },
  ];

  test('should filter calls with strike above current price', () => {
    const result = filterOutOfTheMoneyCallOptions(mockCalls, 100, 10);
    expect(result).toHaveLength(2);
    expect(result[0].strike).toBe(105);
    expect(result[1].strike).toBe(110);
  });

  test('should limit results to specified number', () => {
    const result = filterOutOfTheMoneyCallOptions(mockCalls, 100, 1);
    expect(result).toHaveLength(1);
    expect(result[0].strike).toBe(105);
  });

  test('should return empty array if no calls above price', () => {
    const result = filterOutOfTheMoneyCallOptions(mockCalls, 120, 10);
    expect(result).toHaveLength(0);
  });
});

describe('filterOutOfTheMoneyPutOptions', () => {
  const mockPuts: OptionContract[] = [
    { strike: 110, lastPrice: 0.5, bid: 0.4, ask: 0.6 },
    { strike: 105, lastPrice: 1.0, bid: 0.9, ask: 1.1 },
    { strike: 100, lastPrice: 1.5, bid: 1.4, ask: 1.6 },
    { strike: 95, lastPrice: 2.0, bid: 1.9, ask: 2.1 },
  ];

  test('should filter puts with strike below current price', () => {
    const result = filterOutOfTheMoneyPutOptions(mockPuts, 105, 10);
    expect(result).toHaveLength(2);
    expect(result[0].strike).toBe(100);
    expect(result[1].strike).toBe(95);
  });

  test('should limit results to specified number', () => {
    const result = filterOutOfTheMoneyPutOptions(mockPuts, 105, 1);
    expect(result).toHaveLength(1);
    expect(result[0].strike).toBe(100);
  });

  test('should return empty array if no puts below price', () => {
    const result = filterOutOfTheMoneyPutOptions(mockPuts, 90, 10);
    expect(result).toHaveLength(0);
  });
});

describe('evaluateBollingerSignals', () => {
  // Helper function to create test bars
  const createTestBars = (symbol: string, priceVariation = 5): Bar[] => {
    const bars: Bar[] = [];
    for (let i = 0; i < 25; i++) {
      bars.push({
        Timestamp: new Date(2024, 0, i + 1).toISOString(),
        ClosePrice: 100 + Math.sin(i * 0.1) * priceVariation,
        Symbol: symbol,
      });
    }
    return bars;
  };

  // Helper function to create mock options provider
  const createMockOptionsProvider = (calls: OptionContract[] = [], puts: OptionContract[] = []): IOptionsProvider => ({
    getLatestOptionChain: vi.fn().mockResolvedValue({ calls, puts }),
  });

  // Helper function to create test data setup
  const setupTestData = (symbol: string, latestPrice: number, priceVariation = 5) => {
    const testBars = createTestBars(symbol, priceVariation);
    const bars = new Map<string, Bar[]>();
    bars.set(symbol, testBars);
    const latestPrices = { [symbol]: latestPrice };
    return { bars, latestPrices };
  };

  test('should return SELL_CALL result when price is near upper band', async () => {
    const { bars, latestPrices } = setupTestData('TEST', 110);

    const mockOptionsProvider = createMockOptionsProvider(
      [
        { strike: 115, lastPrice: 1.5, bid: 1.4, ask: 1.6 },
        { strike: 120, lastPrice: 1.0, bid: 0.9, ask: 1.1 },
        { strike: 125, lastPrice: 0.8, bid: 0.7, ask: 0.9 },
      ],
      [
        { strike: 90, lastPrice: 0.5, bid: 0.4, ask: 0.6 },
        { strike: 85, lastPrice: 0.3, bid: 0.2, ask: 0.4 },
      ],
    );

    const result = await evaluateBollingerSignals(bars, latestPrices, mockOptionsProvider);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      type: 'SELL_CALL',
      symbol: 'TEST',
      resultTitle: 'Passed Upper band or within 1%',
    });
    expect(result[0].resultValue).toContain('Current: 110.00');
    expect(result[0].resultValue).toContain('Upper:');
    expect(result[0].optionsTable).toBeDefined();
    expect(result[0].optionsTableTitle).toBeDefined();
  });

  test('should return SELL_PUT result when price is near lower band', async () => {
    const { bars, latestPrices } = setupTestData('TEST', 90);

    const mockOptionsProvider = createMockOptionsProvider(
      [
        { strike: 115, lastPrice: 1.5, bid: 1.4, ask: 1.6 },
        { strike: 120, lastPrice: 1.0, bid: 0.9, ask: 1.1 },
      ],
      [
        { strike: 85, lastPrice: 0.5, bid: 0.4, ask: 0.6 },
        { strike: 80, lastPrice: 0.3, bid: 0.2, ask: 0.4 },
        { strike: 75, lastPrice: 0.2, bid: 0.1, ask: 0.3 },
      ],
    );

    const result = await evaluateBollingerSignals(bars, latestPrices, mockOptionsProvider);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      type: 'SELL_PUT',
      symbol: 'TEST',
      resultTitle: 'Passed Lower band or within 1%',
    });
    expect(result[0].resultValue).toContain('Current: 90');
    expect(result[0].resultValue).toContain('Lower:');
    expect(result[0].optionsTable).toBeDefined();
    expect(result[0].optionsTableTitle).toBeDefined();
  });

  test('should return empty array when price is in middle range', async () => {
    // Create bars with moderate oscillation
    const testBars: Bar[] = [];
    for (let i = 0; i < 25; i++) {
      testBars.push({
        Timestamp: new Date(2024, 0, i + 1).toISOString(),
        ClosePrice: 100 + Math.sin(i * 0.3) * 2, // Oscillates with less variation
        Symbol: 'TEST',
      });
    }

    const bars = new Map<string, Bar[]>();
    bars.set('TEST', testBars);

    // Set current price at exactly 100, which should be in the middle range
    const latestPrices = { TEST: 100 };

    const mockOptionsProvider = createMockOptionsProvider();

    const result = await evaluateBollingerSignals(bars, latestPrices, mockOptionsProvider);

    expect(result).toHaveLength(0);
  });
});
