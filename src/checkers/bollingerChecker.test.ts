import { expect, test, describe } from 'vitest';
import { isNearOrPastUpperBand, isNearOrPastLowerBand } from './bollingerChecker';


describe('isNearOrPastUpperBand', () => {
  test.each([
    { price: 110, upperBand: 100, expected: true },
    { price: 100, upperBand: 100, expected: true },
    { price: 99, upperBand: 100, expected: true },
    { price: 98, upperBand: 100, expected: false },
    { price: 80, upperBand: 100, expected: false },
  ])('$price >~ $upperBand $expected', ({ price, upperBand, expected }) => {
    expect(isNearOrPastUpperBand(price, upperBand)).toBe(expected);
  });
});


describe('isNearOrPastLowerBand', () => {
  test.each([
    { price: 80, lowerBand: 100, expected: true },
    { price: 100, lowerBand: 100, expected: true },
    { price: 101, lowerBand: 100, expected: true },
    { price: 102, lowerBand: 100, expected: false },
    { price: 120, lowerBand: 100, expected: false },
  ])('$price <~ $lowerBand $expected', ({ price, lowerBand, expected }) => {
    expect(isNearOrPastLowerBand(price, lowerBand)).toBe(expected);
  });
});
