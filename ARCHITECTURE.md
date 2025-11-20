# Bollinger Checker Architecture Documentation

## Overview

The **bollinger-checker** is a Cloudflare Worker that monitors stock prices using Bollinger Bands, RSI (Relative Strength Index), and MACD (Moving Average Convergence Divergence) technical analysis. It runs on a scheduled basis to identify trading opportunities, sends notifications via Discord webhooks when stocks breach their Bollinger Band thresholds, and logs all execution runs and signals to a PostgreSQL database.

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

    subgraph "Data Storage"
        DB[(PostgreSQL Database)]
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

    CW -->|Send Notifications<br/>Non-blocking| DISCORD
    CW -->|Log Execution & Signals| DB

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
    participant DB as PostgreSQL Database

    Cron->>Worker: Scheduled execution (13:45 & 20:00 UTC)

    Worker->>Alpaca: Get historical bars (default: 60 days)
    Alpaca-->>Worker: Historical price data (page 1) + next_page_token
    loop Pagination
        Worker->>Alpaca: Get next page (page_token)
        Alpaca-->>Worker: Historical price data (page N) + next_page_token
    end
    Worker->>Worker: Consolidate all pages

    Worker->>Alpaca: Get latest prices
    Alpaca-->>Worker: Current market prices

    Worker->>Worker: Calculate Bollinger Bands
    Worker->>Worker: Calculate RSI signals
    Worker->>Worker: Calculate MACD signals
    Worker->>Worker: Check band breaches & combine with RSI & MACD

    alt Stock breaches upper band
        Worker->>Yahoo: Get options chain
        Yahoo-->>Worker: Call options data
        Worker->>Discord: Send SELL CALL notification (non-blocking, 500ms delay)
    else Stock breaches lower band
        Worker->>Yahoo: Get options chain
        Yahoo-->>Worker: Put options data
        Worker->>Discord: Send SELL PUT notification (non-blocking, 500ms delay)
    else No breaches
        Worker->>Discord: Send "Nothing Passed" notification (non-blocking)
    end

    Worker->>DB: Log run execution (status, duration, signals found)
    Worker->>DB: Log individual signals (Bollinger + RSI + MACD data)
```

## Technical Analysis Flow

```mermaid
graph TD
    START[Start Analysis] --> FETCH_BARS[Fetch Historical Bars<br/>Default: 60 days]
    FETCH_BARS --> CALC_BB[Calculate Bollinger Bands<br/>Period: 20 days]
    FETCH_BARS --> CALC_RSI[Calculate RSI<br/>Period: 14 days]
    FETCH_BARS --> CALC_MACD[Calculate MACD<br/>Fast: 12, Slow: 26, Signal: 9]
    CALC_BB --> GET_PRICE[Get Latest Stock Price]
    CALC_RSI --> COMBINE[Combine Bollinger, RSI & MACD Results]
    CALC_MACD --> COMBINE
    GET_PRICE --> CHECK_UPPER{Price near/above<br/>Upper Band?}

    CHECK_UPPER -->|Yes| FETCH_CALLS[Fetch Call Options]
    FETCH_CALLS --> FILTER_CALLS[Filter OTM Calls<br/>Strike > Current Price]
    FILTER_CALLS --> NOTIFY_CALLS[Send SELL CALL<br/>Discord Notification<br/>Non-blocking]

    CHECK_UPPER -->|No| CHECK_LOWER{Price near/below<br/>Lower Band?}
    CHECK_LOWER -->|Yes| FETCH_PUTS[Fetch Put Options]
    FETCH_PUTS --> FILTER_PUTS[Filter OTM Puts<br/>Strike < Current Price]
    FILTER_PUTS --> NOTIFY_PUTS[Send SELL PUT<br/>Discord Notification<br/>Non-blocking]

    CHECK_LOWER -->|No| NO_SIGNAL[No Trading Signal]
    NOTIFY_CALLS --> LOG_DB[Log to Database]
    NOTIFY_PUTS --> LOG_DB
    NO_SIGNAL --> LOG_DB
    LOG_DB --> END[End Analysis]
```

## Key Features

### 🕐 Scheduled Execution

- Runs twice daily during market hours (13:45 UTC & 20:00 UTC on weekdays)
- Powered by Cloudflare Workers Cron Triggers

### 📈 Technical Analysis

- **Bollinger Bands**: 20-period moving average with 2 standard deviations (default)
- **RSI (Relative Strength Index)**: 14-period RSI calculation with overbought (>70) and oversold (<30) thresholds
- **MACD (Moving Average Convergence Divergence)**: Calculates MACD line, signal line, and histogram
  - Fast EMA: 12 periods (default)
  - Slow EMA: 26 periods (default)
  - Signal EMA: 9 periods (default)
  - Crossover Detection: Identifies BULLISH (MACD crosses above signal), BEARISH (MACD crosses below signal), or NEUTRAL states
  - Requires minimum 35 bars of historical data (slowPeriod + signalPeriod)
- **Threshold Detection**: 1% proximity to band edges for Bollinger signals (default)
- **Signal Generation**: 
  - Upper band breach = Sell Calls
  - Lower band breach = Sell Puts
  - RSI signals: BUY (oversold), SELL (overbought), NEUTRAL
  - MACD signals: BULLISH (upward momentum), BEARISH (downward momentum), NEUTRAL
- **Combined Analysis**: Results combine Bollinger Band signals, RSI values, and MACD indicators for comprehensive trading insights

### 📊 Data Integration

- **Alpaca API**: Historical price data (60 days) and real-time quotes
- **Yahoo Finance**: Options chain data for trading opportunities
- **Multi-source reliability**: Combines different data providers

### 🔔 Smart Notifications

- **Discord Integration**: Rich embed notifications with options tables, RSI data, and MACD indicators
- **Non-blocking Execution**: Discord notifications use `ctx.waitUntil()` to run asynchronously without blocking main execution flow
- **Rate Limiting**: 500ms delay between webhook calls to prevent Discord API limits
- **Error Handling**: Robust error handling with success/failure tracking for each notification
- **Conditional Messaging**: Different messages for signals vs. no activity
- **Options Data**: Top 10 out-of-the-money options with strike, price, bid, ask, and IV (default limit)
- **RSI Display**: RSI values and signals (OVERBOUGHT/OVERSOLD/NEUTRAL) included in notifications
- **MACD Display**: MACD values, signal line, histogram, and crossover direction (BULLISH/BEARISH/NEUTRAL) included in notifications

### 💾 Database Persistence

- **Execution Logging**: All run executions are logged to PostgreSQL with:
  - Start/completion timestamps
  - Execution status (success/failed)
  - Duration metrics
  - Ticker count and signal counts (Bollinger, RSI, MACD)
  - Cron trigger information
  - Environment identifier

- **Signal Logging**: Individual trading signals are persisted with:
  - Bollinger Band data (signal type, current price, upper/lower bands)
  - RSI data (RSI value, signal type: BUY/SELL/NEUTRAL)
  - MACD data (MACD value, signal line value, histogram, crossover direction: BULLISH/BEARISH/NEUTRAL)
  - Ticker symbol and detection timestamp
  - Link to parent execution run

- **Database Schema**: Uses Drizzle ORM with PostgreSQL
  - `run_executions` table: High-level execution metadata
  - `run_signals` table: Individual signal details with foreign key to execution

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
- **Bollinger Threshold**: 1% proximity to upper/lower bands for signal detection (within `isNearOrPastUpperBand`/`isNearOrPastLowerBand`).
- **RSI Period**: 14 days (default in `evaluateRsiSignals`)
- **RSI Overbought Threshold**: 70 (default)
- **RSI Oversold Threshold**: 30 (default)
- **MACD Fast Period**: 12 (default in `evaluateMacdSignals`)
- **MACD Slow Period**: 26 (default in `evaluateMacdSignals`)
- **MACD Signal Period**: 9 (default in `evaluateMacdSignals`)
- **MACD Minimum Bars**: 35 (slowPeriod + signalPeriod) required for calculation
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
- **Database**: PostgreSQL with Drizzle ORM
- **External APIs**: Alpaca Markets, Yahoo Finance
- **Notifications**: Discord Webhooks
- **Technical Indicators**: trading-signals library (RSI, Bollinger Bands, MACD)
