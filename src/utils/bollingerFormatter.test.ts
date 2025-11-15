import { expect, test, describe } from 'vitest';
import { formatBollingerSignal } from './bollingerFormatter';
import { BollingerSignal } from '@/core/types/technicals';
import { OptionContract } from '@/core/types/options';

describe('formatBollingerSignal', () => {
  const createMockSignal = (
    type: 'SELL_CALL' | 'SELL_PUT',
    options: OptionContract[] = [],
  ): BollingerSignal => ({
    symbol: 'TEST',
    type,
    currentPrice: 150.25,
    upperBand: 152.5,
    lowerBand: 147.5,
    middleBand: 150.0,
    options,
  });

  test('should format SELL_CALL signal correctly', () => {
    const mockOptions: OptionContract[] = [
      { strike: 155, lastPrice: 1.5, bid: 1.4, ask: 1.6, impliedVolatility: 0.25 },
      { strike: 160, lastPrice: 1.0, bid: 0.9, ask: 1.1, impliedVolatility: 0.22 },
    ];

    const signal = createMockSignal('SELL_CALL', mockOptions);
    const formatted = formatBollingerSignal(signal);

    expect(formatted.resultTitle).toBe('Passed Upper band or within 1%');
    expect(formatted.resultValue).toContain('Current: 150.25');
    expect(formatted.resultValue).toContain('Upper: 152.50');
    expect(formatted.optionsTableTitle).toBe('strike | lastPrice | bid | ask | iv');
    expect(formatted.optionsTable).toBeDefined();
    expect(formatted.optionsTable).toContain('155.00');
    expect(formatted.optionsTable).toContain('160.00');
  });

  test('should format SELL_PUT signal correctly', () => {
    const mockOptions: OptionContract[] = [
      { strike: 145, lastPrice: 1.2, bid: 1.1, ask: 1.3, impliedVolatility: 0.28 },
      { strike: 140, lastPrice: 0.8, bid: 0.7, ask: 0.9, impliedVolatility: 0.30 },
    ];

    const signal = createMockSignal('SELL_PUT', mockOptions);
    const formatted = formatBollingerSignal(signal);

    expect(formatted.resultTitle).toBe('Passed Lower band or within 1%');
    expect(formatted.resultValue).toContain('Current: 150.25');
    expect(formatted.resultValue).toContain('Lower: 147.50');
    expect(formatted.optionsTableTitle).toBe('strike | lastPrice | bid | ask | iv');
    expect(formatted.optionsTable).toBeDefined();
    expect(formatted.optionsTable).toContain('145.00');
    expect(formatted.optionsTable).toContain('140.00');
  });

  test('should handle empty options array', () => {
    const signal = createMockSignal('SELL_CALL', []);
    const formatted = formatBollingerSignal(signal);

    expect(formatted.resultTitle).toBe('Passed Upper band or within 1%');
    expect(formatted.resultValue).toContain('Current: 150.25');
    expect(formatted.resultValue).toContain('Upper: 152.50');
    expect(formatted.optionsTableTitle).toBe('strike | lastPrice | bid | ask | iv');
    expect(formatted.optionsTable).toBe('');
  });

  test('should format options with missing optional fields', () => {
    const mockOptions: OptionContract[] = [
      { strike: 155, lastPrice: 1.5 },
      { strike: 160, lastPrice: 1.0, bid: 0.9 },
    ];

    const signal = createMockSignal('SELL_CALL', mockOptions);
    const formatted = formatBollingerSignal(signal);

    expect(formatted.optionsTable).toBeDefined();
    expect(formatted.optionsTable).toContain('155.00');
    expect(formatted.optionsTable).toContain('160.00');
  });
});

