import { integer, numeric, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';

export const runExecutions = pgTable('run_executions', {
  id: serial('id').primaryKey(),
  startedAt: timestamp('started_at').notNull(),
  completedAt: timestamp('completed_at').notNull(),
  status: varchar({ enum: ['success', 'failed'] }).notNull(),
  environment: varchar().notNull(),
  durationMs: integer('duration_ms').notNull(),
  tickersChecked: integer('tickers_checked').notNull(),
  cronTrigger: varchar('cron_trigger', { length: 100 }),
  bollingerSignalsFound: integer('bollinger_signals_found'),
  rsiSignalsFound: integer('rsi_signals_found'),
  macdSignalsFound: integer('macd_signals_found'),
});

export type RunExecutionInsert = typeof runExecutions.$inferInsert;

export const runSignals = pgTable('run_signals', {
  id: serial('id').primaryKey(),
  runExecutionId: integer('run_execution_id').notNull(),
  ticker: varchar().notNull(),
  detectedAt: timestamp('detected_at').notNull().defaultNow(),
  // Bollinger-specific fields
  bollingerSignal: varchar('bollinger_signal', { enum: ['SELL_CALL', 'SELL_PUT'] }).notNull(),
  currentPrice: numeric('current_price', { mode: 'number' }).notNull(),
  upperBand: numeric('upper_band', { mode: 'number' }).notNull(),
  lowerBand: numeric('lower_band', { mode: 'number' }).notNull(),
  // RSI-specific fields
  rsiValue: numeric('rsi_value', { mode: 'number' }).notNull(),
  rsiSignal: varchar('rsi_signal', { enum: ['BUY', 'SELL', 'NEUTRAL'] }).notNull(),
  // MACD-specific fields
  macdValue: numeric('macd_value', { mode: 'number' }),
  macdSignal: numeric('macd_signal', { mode: 'number' }),
  macdHistogram: numeric('macd_histogram', { mode: 'number' }),
  macdCrossover: varchar('macd_crossover', { enum: ['BULLISH', 'BEARISH', 'NEUTRAL'] }),
});

export type RunSignalInsert = typeof runSignals.$inferInsert;
