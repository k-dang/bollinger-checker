# Bollinger Checker Architecture Documentation

## Overview

The **bollinger-checker** is a Cloudflare Worker that monitors stock prices using Bollinger Bands technical analysis. It runs on a scheduled basis to identify trading opportunities and sends notifications via Discord webhooks when stocks breach their Bollinger Band thresholds.

## System Architecture

```mermaid
graph TB
    subgraph "Cloudflare Workers"
        CW[Cron Worker]
        CRON[Cron Triggers]
    end

    subgraph "External APIs"
        ALPACA[Alpaca API]
        YAHOO[Yahoo Finance API]
        DISCORD[Discord Webhook]
    end

    subgraph "Data Sources"
        BARS[Historical Stock Data]
        PRICES[Latest Stock Prices]
        OPTIONS[Options Chain Data]
    end

    CRON -->|Scheduled Execution| CW
    CW -->|Fetch Historical Data| ALPACA
    CW -->|Fetch Latest Prices| ALPACA
    CW -->|Fetch Options Data| YAHOO

    ALPACA -->|Returns| BARS
    ALPACA -->|Returns| PRICES
    YAHOO -->|Returns| OPTIONS

    CW -->|Send Notifications| DISCORD

    BARS --> CW
    PRICES --> CW
    OPTIONS --> CW
```

## Data Flow

```mermaid
sequenceDiagram
    participant Cron as Cron Trigger
    participant Worker as Cloudflare Worker
    participant Alpaca as Alpaca API
    participant Yahoo as Yahoo Finance
    participant Discord as Discord Webhook

    Cron->>Worker: Scheduled execution (13:45 & 20:00 UTC)

    Worker->>Alpaca: Get historical bars (35 days)
    Alpaca-->>Worker: Historical price data

    Worker->>Alpaca: Get latest prices
    Alpaca-->>Worker: Current market prices

    Worker->>Worker: Calculate Bollinger Bands
    Worker->>Worker: Check band breaches

    alt Stock breaches upper band
        Worker->>Yahoo: Get options chain
        Yahoo-->>Worker: Call options data
        Worker->>Discord: Send SELL CALL notification (with 500ms delay)
    else Stock breaches lower band
        Worker->>Yahoo: Get options chain
        Yahoo-->>Worker: Put options data
        Worker->>Discord: Send SELL PUT notification (with 500ms delay)
    else No breaches
        Worker->>Discord: Send "Nothing Passed" notification
    end
```

## Technical Analysis Flow

```mermaid
graph TD
    START[Start Analysis] --> FETCH_BARS[Fetch 35-day Historical Bars]
    FETCH_BARS --> CALC_BB[Calculate Bollinger Bands<br/>Period: 20 days]
    CALC_BB --> GET_PRICE[Get Latest Stock Price]
    GET_PRICE --> CHECK_UPPER{Price near/above<br/>Upper Band?}

    CHECK_UPPER -->|Yes| FETCH_CALLS[Fetch Call Options]
    FETCH_CALLS --> FILTER_CALLS[Filter OTM Calls<br/>Strike > Current Price]
    FILTER_CALLS --> NOTIFY_CALLS[Send SELL CALL<br/>Discord Notification]

    CHECK_UPPER -->|No| CHECK_LOWER{Price near/below<br/>Lower Band?}
    CHECK_LOWER -->|Yes| FETCH_PUTS[Fetch Put Options]
    FETCH_PUTS --> FILTER_PUTS[Filter OTM Puts<br/>Strike < Current Price]
    FILTER_PUTS --> NOTIFY_PUTS[Send SELL PUT<br/>Discord Notification]

    CHECK_LOWER -->|No| NO_SIGNAL[No Trading Signal]
    NOTIFY_CALLS --> DELAY[500ms Delay]
    NOTIFY_PUTS --> DELAY
    DELAY --> END[End Analysis]
    NO_SIGNAL --> END
```

## Key Features

### 🕐 Scheduled Execution

- Runs twice daily during market hours (13:45 UTC & 20:00 UTC on weekdays)
- Powered by Cloudflare Workers Cron Triggers

### 📈 Technical Analysis

- **Bollinger Bands**: 20-period moving average with 2 standard deviations (default)
- **Threshold Detection**: 1% proximity to band edges (default)
- **Signal Generation**: Upper band breach = Sell Calls, Lower band breach = Sell Puts

### 📊 Data Integration

- **Alpaca API**: Historical price data (35 days) and real-time quotes
- **Yahoo Finance**: Options chain data for trading opportunities
- **Multi-source reliability**: Combines different data providers

### 🔔 Smart Notifications

- **Discord Integration**: Rich embed notifications with options tables
- **Rate Limiting**: 500ms delay between webhook calls to prevent Discord API limits
- **Error Handling**: Robust error handling with success/failure tracking for each notification
- **Conditional Messaging**: Different messages for signals vs. no activity
- **Options Data**: Top 10 out-of-the-money options with strike, price, bid, ask, and IV (default limit)

## Logging and Observability

### Logger Abstraction

- The checker uses a simple logger abstraction (`ILogger`) to log progress and results.
- Default implementation (`consoleLogger`) prefixes messages with `[BollingerChecker][date(ISO8601)]` and writes to `console.log`.
- Logs during evaluation:
  - Per-symbol: `Finished checking {SYMBOL}`
  - Summary: `Total results: {N}`

### Pluggable Logging

- `evaluateBollingerSignals(bars, latestPrices, optionsProvider, logger?)` accepts an optional `logger` argument.
- Any object implementing `ILogger` (`{ log: (message: string) => void }`) can be injected (e.g., structured logger, no-op logger).
- If omitted, `consoleLogger` is used by default.

## Defaults and Tunables

- **Bollinger Period**: 20 (passed to the bands calculator; exposed via `getBollingerBands(bars, period = 20)`).
- **Threshold**: 1% proximity to upper/lower bands for signal detection (within `isNearOrPastUpperBand`/`isNearOrPastLowerBand`).
- **Options Limit**: 10 top out-of-the-money options (calls above price, puts below price).

These defaults are encoded in code for simplicity and can be adjusted in future via configuration if needed.

### 🎯 Monitored Stocks

Currently tracking **31 major stocks** including:

- Tech giants: META, GOOGL, NVDA, MSFT, AAPL, AVGO
- Growth stocks: SNOW, NET, CRWD, SHOP, COIN
- Market leaders: TSLA, NFLX, ADBE, CRM, INTU
- Consumer brands: DIS, NKE, LULU, PYPL
- International: JD, MELI, CPNG
- Semiconductors: AMD, LRCX
- Other notable: ABNB, ADSK, TTD, ZM, XYZ

## Technology Stack

- **Runtime**: Cloudflare Workers (V8 JavaScript)
- **Language**: TypeScript
- **Build Tool**: Wrangler
- **Package Manager**: pnpm
- **External APIs**: Alpaca Markets, Yahoo Finance
- **Notifications**: Discord Webhooks
