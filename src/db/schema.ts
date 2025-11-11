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
});

export type RunExecution = typeof runExecutions.$inferSelect;

export const runSignals = pgTable('run_signals', {
  id: serial('id').primaryKey(),
  runExecutionId: integer('run_execution_id').notNull(),
  ticker: varchar().notNull(),
  signalType: varchar('signal_type', { enum: ['BOLLINGER', 'RSI'] }).notNull(),
  detectedAt: timestamp('detected_at').notNull().defaultNow(),
  // Bollinger-specific fields
  bollingerType: varchar('bollinger_type', { enum: ['SELL_CALL', 'SELL_PUT'] }),
  currentPrice: numeric('current_price'),
  upperBand: numeric('upper_band'),
  lowerBand: numeric('lower_band'),
  // RSI-specific fields
  rsiValue: numeric('rsi_value'),
  rsiSignal: varchar('rsi_signal', { enum: ['BUY', 'SELL', 'NEUTRAL'] }),
});
