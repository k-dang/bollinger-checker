import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { runExecutions } from './schema';

interface LogRunExecutionParams {
  databaseUrl: string;
  startedAt: Date;
  completedAt: Date;
  status: 'success' | 'failed';
  durationMs: number;
  tickersChecked: number;
  cronTrigger?: string;
}

export async function logRunExecution(params: LogRunExecutionParams): Promise<void> {
  const { databaseUrl, startedAt, completedAt, status, durationMs, tickersChecked, cronTrigger } = params;

  try {
    const client = postgres(databaseUrl);
    const db = drizzle(client);

    await db.insert(runExecutions).values({
      startedAt,
      completedAt,
      status,
      durationMs,
      tickersChecked,
      cronTrigger,
    });

    await client.end();
    console.log(`[RunExecution] Record inserted: status=${status}, duration=${durationMs}ms`);
  } catch (dbErr) {
    console.error('[RunExecution] Failed to insert record:', dbErr);
    throw dbErr;
  }
}
