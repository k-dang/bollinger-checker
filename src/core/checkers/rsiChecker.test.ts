import { expect, test, describe, vi } from 'vitest';
import { calculateRSI } from './rsiChecker';
import { Bar } from '@/core/types/technicals';

describe('calculateRSI', () => {
  // Helper function to create test bars with different price patterns
  const createTestBars = (symbol: string, pricePattern: 'rising' | 'falling' | 'oscillating' | 'constant'): Bar[] => {
    const bars: Bar[] = [];
    for (let i = 0; i < 30; i++) { // Increased to 30 to ensure sufficient data
      let price: number;
      switch (pricePattern) {
        case 'rising':
          price = 100 + i * 2; // Steady rise
          break;
        case 'falling':
          price = 120 - i * 2; // Steady fall
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

  test('should calculate RSI for single symbol with sufficient data', () => {
    const bars = setupTestData('TEST', 'oscillating');
    
    const result = calculateRSI(bars);
    
    expect(result.size).toBe(1);
    expect(result.has('TEST')).toBe(true);
    
    const rsiResult = result.get('TEST');
    expect(rsiResult).toBeDefined();
    if (rsiResult) {
      expect(rsiResult).toMatchObject({
        symbol: 'TEST',
        rsi: expect.any(Number),
        isOverbought: expect.any(Boolean),
        isOversold: expect.any(Boolean),
        signal: expect.stringMatching(/^(BUY|SELL|NEUTRAL)$/),
        status: expect.stringMatching(/^(🔴 OVERBOUGHT|🟢 OVERSOLD|⚪ NEUTRAL)$/),
      });
      
      // RSI should be between 0 and 100
      expect(rsiResult.rsi).toBeGreaterThanOrEqual(0);
      expect(rsiResult.rsi).toBeLessThanOrEqual(100);
    }
  });

  test('should calculate RSI for multiple symbols', () => {
    const bars = new Map<string, Bar[]>();
    bars.set('RISING', createTestBars('RISING', 'rising'));
    bars.set('FALLING', createTestBars('FALLING', 'falling'));
    bars.set('OSCILLATING', createTestBars('OSCILLATING', 'oscillating'));
    
    const result = calculateRSI(bars);
    
    expect(result.size).toBe(3);
    expect(result.has('RISING')).toBe(true);
    expect(result.has('FALLING')).toBe(true);
    expect(result.has('OSCILLATING')).toBe(true);
    
    // Each symbol should have valid RSI results
    for (const [symbol, rsiResult] of result.entries()) {
      expect(rsiResult.symbol).toBe(symbol);
      expect(rsiResult.rsi).toBeGreaterThanOrEqual(0);
      expect(rsiResult.rsi).toBeLessThanOrEqual(100);
    }
  });

  test('should handle insufficient data gracefully', () => {
    const bars = new Map<string, Bar[]>();
    bars.set('INSUFFICIENT', createTestBars('INSUFFICIENT', 'oscillating').slice(0, 10)); // Only 10 bars, need 14
    
    // Mock console.warn to verify warning is logged
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    
    const result = calculateRSI(bars);
    
    expect(result.size).toBe(0);
    expect(consoleSpy).toHaveBeenCalledWith(
      '[RSI] Insufficient data for INSUFFICIENT. Need at least 14 data points, got 10'
    );
    
    consoleSpy.mockRestore();
  });

  test('should handle empty bars map', () => {
    const bars = new Map<string, Bar[]>();
    const result = calculateRSI(bars);
    
    expect(result.size).toBe(0);
  });

  test('should detect overbought condition', () => {
    const bars = setupTestData('OVERBOUGHT', 'rising');
    
    // Use a lower threshold to trigger overbought condition
    const result = calculateRSI(bars);
    
    expect(result.size).toBe(1);
    const rsiResult = result.get('OVERBOUGHT');
    expect(rsiResult).toBeDefined();
    if (rsiResult) {
      expect(rsiResult.isOverbought).toBe(true);
      expect(rsiResult.isOversold).toBe(false);
      expect(rsiResult.signal).toBe('SELL');
      expect(rsiResult.status).toBe('🔴 OVERBOUGHT');
    }
  });

  test('should detect oversold condition', () => {
    const bars = setupTestData('OVERSOLD', 'falling');
    
    // Use a higher threshold to trigger oversold condition
    const result = calculateRSI(bars);
    
    expect(result.size).toBe(1);
    const rsiResult = result.get('OVERSOLD');
    expect(rsiResult).toBeDefined();
    if (rsiResult) {
      expect(rsiResult.isOverbought).toBe(false);
      expect(rsiResult.isOversold).toBe(true);
      expect(rsiResult.signal).toBe('BUY');
      expect(rsiResult.status).toBe('🟢 OVERSOLD');
    }
  });

  test('should return neutral signal when RSI is in normal range', () => {
    const bars = setupTestData('NEUTRAL', 'constant');
    
    const result = calculateRSI(bars);
    
    expect(result.size).toBe(1);
    const rsiResult = result.get('NEUTRAL');
    expect(rsiResult).toBeDefined();
    if (rsiResult) {
      expect(rsiResult.isOverbought).toBe(false);
      expect(rsiResult.isOversold).toBe(false);
      expect(rsiResult.signal).toBe('NEUTRAL');
      expect(rsiResult.status).toBe('⚪ NEUTRAL');
    }
  });
});
