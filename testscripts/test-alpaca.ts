import { AlpacaClient } from '../src/utils/alpaca';

async function testAlpaca() {
  // These should come from environment variables in a real implementation
  const apiKey = process.env.ALPACA_API_KEY;
  const apiSecret = process.env.ALPACA_API_SECRET;

  if (!apiKey || !apiSecret) {
    console.error('Please set ALPACA_API_KEY and ALPACA_API_SECRET environment variables');
    return;
  }

  const client = new AlpacaClient(apiKey, apiSecret);
  const symbols = ['AAPL', 'TSLA'];

  try {
    console.log('Testing getBars...');
    const bars = await client.getBars(symbols);
    console.log('Bars result:', bars);
    console.log('Number of bars for AAPL:', bars.get('AAPL')?.length || 0);
    console.log('Number of bars for TSLA:', bars.get('TSLA')?.length || 0);

    console.log('\nTesting getLatestPrices...');
    const prices = await client.getLatestPrices(symbols);
    console.log('Latest prices:', prices);

    console.log('\nTesting getOptionsChain...');
    const options = await client.getOptionsChain(symbols[0], 'call', 150, 200);
    console.log('Options chain result:', options);

    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAlpaca();
