import { BollingerSignal } from '@/core/types/technicals';
import { buildOptionsTable, optionsTableTitle } from './optionsTable';

/**
 * Formatted result for displaying a Bollinger signal
 */
export interface FormattedBollingerSignal {
  resultTitle: string;
  resultValue: string;
  optionsTableTitle: string;
  optionsTable: string;
}

/**
 * Formats a Bollinger signal for display purposes
 * @param signal - The Bollinger signal to format
 * @returns Formatted display strings for the signal
 */
export const formatBollingerSignal = (signal: BollingerSignal): FormattedBollingerSignal => {
  if (signal.type === 'SELL_CALL') {
    return {
      resultTitle: 'Passed Upper band or within 1%',
      resultValue: `Current: ${signal.currentPrice.toFixed(2)} \n Upper: ${signal.upperBand.toFixed(2)}`,
      optionsTableTitle,
      optionsTable: buildOptionsTable(signal.options),
    };
  } else {
    return {
      resultTitle: 'Passed Lower band or within 1%',
      resultValue: `Current: ${signal.currentPrice.toFixed(2)} \n Lower: ${signal.lowerBand.toFixed(2)}`,
      optionsTableTitle,
      optionsTable: buildOptionsTable(signal.options),
    };
  }
};

