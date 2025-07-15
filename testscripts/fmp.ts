const apiKey = process.env.FINANCIAL_MODELING_PREP_API_KEY;
const baseUrl = 'https://financialmodelingprep.com/stable';

export async function fetchHistoricalPriceEOD(symbol: string, from: string) {
  const url = `${baseUrl}/historical-price-eod/full?symbol=${encodeURIComponent(symbol)}&from=${encodeURIComponent(from)}&apikey=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

(async () => {
  const from = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const data = await fetchHistoricalPriceEOD('AAPL', from);
  console.log(data);
})();
