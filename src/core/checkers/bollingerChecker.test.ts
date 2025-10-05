import { expect, test, describe } from 'vitest';
import { isNearOrPastUpperBand, isNearOrPastLowerBand } from './bollingerChecker';

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
