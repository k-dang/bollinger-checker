import { integer, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';

export const runExecutions = pgTable('run_executions', {
  id: serial('id').primaryKey(),
  startedAt: timestamp('started_at').notNull(),
  completedAt: timestamp('completed_at'),
  status: varchar({ enum: ["success", "failed"] }).notNull(),
  durationMs: integer('duration_ms'),
  tickersChecked: integer('tickers_checked').notNull(),
  cronTrigger: varchar('cron_trigger', { length: 100 }),
});
