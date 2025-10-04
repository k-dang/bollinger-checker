import { YahooOptionsProvider } from '../src/core/providers/OptionsProvider';
import { buildOptionsTable } from '../src/checkers/bollingerChecker';

const yahooOptionsProvider = new YahooOptionsProvider();

const latestPrice = 258.0;
const optionsChain = await yahooOptionsProvider.getLatestOptionChain('AAPL');
const topOutOfTheMoneyCalls = optionsChain.calls
  .filter((call) => {
    return call.strike > latestPrice;
  })
  .slice(0, 10);


const optionsTable = buildOptionsTable(topOutOfTheMoneyCalls);
console.log(optionsTable);
