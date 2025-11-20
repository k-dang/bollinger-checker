import { Bar } from '@/core/types/technicals';

interface AlpacaBarResponse {
  bars: Record<
    string,
    {
      c: number; // close price
      h: number; // high price
      l: number; // low price
      o: number; // open price
      t: string; // timestamp
      v: number; // volume
    }[]
  >;
  next_page_token: string;
}

type AlpacaSnapshotResponse = Record<
  string,
  {
    latestTrade: {
      c: string[]; // conditions
      p: number; // price
      s: number; // size
      t: string; // timestamp
      x: string; // exchange
    };
  }
>;

export class AlpacaClient {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseUrl = 'https://data.alpaca.markets';
  }

  private getAuthHeaders() {
    return {
      'APCA-API-KEY-ID': this.apiKey,
      'APCA-API-SECRET-KEY': this.apiSecret,
      'Content-Type': 'application/json',
    };
  }

  async getBars(symbols: string[], days = 60) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const symbolsQuery = symbols.join(',');
    const result = new Map<string, Bar[]>();
    
    // Initialize result for all requested symbols
    for (const symbol of symbols) {
      result.set(symbol, []);
    }

    let pageToken: string | null = null;

    do {
      let url = `${this.baseUrl}/v2/stocks/bars?symbols=${symbolsQuery}&timeframe=1Day&start=${startDate}`;
      if (pageToken) {
        url += `&page_token=${pageToken}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch bars: ${response.status} ${response.statusText}`);
      }

      const data: AlpacaBarResponse = await response.json();

      // The API might return bars for symbols we requested
      // Iterate over the response keys to be safe, or the requested symbols
      if (data.bars) {
        for (const symbol of Object.keys(data.bars)) {
          const bars = data.bars[symbol] || [];
          const mappedBars = bars.map((bar) => ({
            Timestamp: bar.t,
            ClosePrice: bar.c,
            Symbol: symbol,
          }));

          const existing = result.get(symbol) || [];
          result.set(symbol, existing.concat(mappedBars));
        }
      }

      pageToken = data.next_page_token;
    } while (pageToken);

    return result;
  }

  async getLatestPrices(symbols: string[]) {
    const symbolsQuery = symbols.join(',');
    const url = `${this.baseUrl}/v2/stocks/snapshots?symbols=${symbolsQuery}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch snapshots: ${response.status} ${response.statusText}`);
    }

    const data: AlpacaSnapshotResponse = await response.json();
    const result: Record<string, number> = {};

    for (const symbol of symbols) {
      const snapshot = data[symbol];
      if (snapshot && snapshot.latestTrade) {
        result[symbol] = snapshot.latestTrade.p;
      }
    }

    return result;
  }
}
