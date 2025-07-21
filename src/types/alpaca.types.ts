export interface AlpacaBarResponse {
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

export interface AlpacaOptionsChainResponse {
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

export type AlpacaSnapshotResponse = Record<
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

export interface Bar {
  Timestamp: string; // ISO 8601 format
  ClosePrice: number;
  Symbol: string;
}

export interface OptionChain {
  symbol: string;
  strike: number;
  bidPrice: number;
  askPrice: number;
  lastPrice: number;
  impliedVolatility: number;
}
