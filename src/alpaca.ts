export interface Bar {
  Timestamp: string; // ISO 8601 format
  ClosePrice: number;
  Symbol: string;
}

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

export interface OptionChain {
  symbol: string;
  strike: number;
  bidPrice: number;
  askPrice: number;
  lastPrice: number;
  impliedVolatility: number;
}

interface AlpacaOptionsChainResponse {
  snapshots: Record<
    string,
    {
      dailyBar: {
        c: number; // close price
        h: number; // high price
        l: number; // low price
        n: number; // number of trades
        o: number; // open price
        t: string; // timestamp
        v: number; // volume
        vw: number; // volume weighted average price
      };
      latestQuote: {
        ap: number; // ask price
        as: number; // ask size
        ax: string; // ask exchange
        bp: number; // bid price
        bs: number; // bid size
        bx: string; // bid exchange
        c: string; // condition
        t: string; // timestamp
      };
      latestTrade: {
        c: string; // condition
        p: number; // price
        s: number; // size
        t: string; // timestamp
        x: string; // exchange
      };
    }
  >;
}

export class AlpacaClient {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseUrl = 'https://data.alpaca.markets';
  }

  private getAuthHeaders(): Record<string, string> {
    return {
      'APCA-API-KEY-ID': this.apiKey,
      'APCA-API-SECRET-KEY': this.apiSecret,
      'Content-Type': 'application/json',
    };
  }

  async getBars(symbols: string[]): Promise<Map<string, Bar[]>> {
    const startDate = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const symbolsQuery = symbols.join(',');
    const url = `${this.baseUrl}/v2/stocks/bars?symbols=${symbolsQuery}&timeframe=1Day&start=${startDate}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch bars: ${response.status} ${response.statusText}`);
    }

    const data: AlpacaBarResponse = await response.json();
    const result = new Map<string, Bar[]>();

    for (const symbol of symbols) {
      const bars = data.bars[symbol] || [];
      result.set(
        symbol,
        bars.map((bar) => ({
          Timestamp: bar.t,
          ClosePrice: bar.c,
          Symbol: symbol,
        }))
      );
    }

    return result;
  }

  async getLatestPrices(symbols: string[]): Promise<Record<string, number>> {
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

  async getOptionsChain(
    underlyingSymbol: string,
    optionType?: 'call' | 'put',
    minStrike?: number,
    maxStrike?: number,
    expirationDate?: string
  ): Promise<OptionChain[]> {
    const params = new URLSearchParams();
    params.append('feed', 'indicative');
    params.append('limit', '10');

    if (optionType) {
      params.append('type', optionType);
    }

    if (minStrike !== undefined) {
      params.append('strike_price_gte', minStrike.toString());
    }

    if (maxStrike !== undefined) {
      params.append('strike_price_lte', maxStrike.toString());
    }

    if (expirationDate) {
      params.append('expiration_date', expirationDate);
    }

    const url = `${this.baseUrl}/v1beta1/options/snapshots/${underlyingSymbol}?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch options chain: ${response.status} ${response.statusText}`);
    }

    const data: AlpacaOptionsChainResponse = await response.json();
    const snapshots = data.snapshots;

    const result: OptionChain[] = [];

    for (const [symbol, snap] of Object.entries(snapshots)) {
      result.push({
        symbol,
        strike: 0, // placeholder, need to parse the strike from the key ex. ADBE250718C00230000
        bidPrice: snap.latestQuote ? snap.latestQuote.bp : 0,
        askPrice: snap.latestQuote ? snap.latestQuote.ap : 0,
        lastPrice: snap.latestTrade ? snap.latestTrade.p : 0,
        impliedVolatility: 0, // Not available in current structure
      });
    }

    return result;
  }
}
