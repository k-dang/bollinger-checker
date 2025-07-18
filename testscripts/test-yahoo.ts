import { formatCell } from '../src/bollingerChecker';
import { getLatestOptionChain } from '../src/yf';

const getOptionsTableTitle = () => {
  const columns = ['strike', 'lastPrice', 'bid', 'ask', 'iv'];
  return columns.map((col) => formatCell(col, 9)).join(' | ');
};

async function testYahoo() {
  const optionsChain = await getLatestOptionChain('AAPL');
  console.log('Expiration Date', optionsChain.expirationDate);

  const latestPrice = 210;
  const validChains = optionsChain.calls
    .filter((call) => {
      return call.strike > latestPrice;
    })
    .slice(0, 10);
  console.table(validChains);

  console.log(getOptionsTableTitle());

  const res = validChains.map((chain) => {
    const strike = chain.strike.toFixed(2);
    const lastPrice = chain.lastPrice.toFixed(2);
    const bid = chain.bid?.toFixed(2) ?? '0';
    const ask = chain.ask?.toFixed(2) ?? '0';
    const impliedVolatility = chain.impliedVolatility?.toFixed(4) ?? '0';
    const values = [strike, lastPrice, bid, ask, impliedVolatility];

    const row = values.map((col) => formatCell(col, 9)).join(' | ');
    return row;
  });

  console.log(res.join('\n'));
}

testYahoo();
