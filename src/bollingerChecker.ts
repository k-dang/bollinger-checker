export const checkTicker = (ticker: string) => {
  console.log(`[BollingerChecker]: checking ${ticker}`);
};

/**
 * Returns true if the price is above the upper band, or within a given percentage threshold of the upper band.
 * @param price - The current price.
 * @param upperBandPrice - The upper Bollinger Band price.
 * @param thresholdPercent - The percentage threshold (default: 1 for 1%).
 */
export const isNearOrPastUpperBand = (price: number, upperBandPrice: number, thresholdPercent: number = 1): boolean => {
  const threshold = price * (1 + thresholdPercent / 100);
  return threshold >= upperBandPrice;
};

/**
 * Returns true if the price is below the lower band, or within a given percentage threshold of the lower band.
 * @param price - The current price.
 * @param lowerBandPrice - The lower Bollinger Band price.
 * @param thresholdPercent - The percentage threshold (default: 1 for 1%).
 */
export const isNearOrPastLowerBand = (price: number, lowerBandPrice: number, thresholdPercent: number = 1): boolean => {
  const threshold = price * (1 - thresholdPercent / 100);
  return threshold <= lowerBandPrice;
};
