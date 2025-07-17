import { getYahooFinanceOptions } from '../src/yf';

async function testYahoo() {
  const optionsChain = await getYahooFinanceOptions('AAPL');
  //   console.log('Options chain for AAPL:', optionsChain);
  const latestChain = optionsChain[0];
  console.log('Expiration Date', latestChain.expirationDate);

  const latestPrice = 210;
  const validChains = latestChain.calls.filter((call) => {
    return call.strike > latestPrice;
  }).slice(0, 10);
  console.table(validChains);
}

testYahoo();
