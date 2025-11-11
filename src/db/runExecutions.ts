import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { runExecutions, RunExecution } from './schema';

type LogRunExecutionParams = {
  databaseUrl: string;
} & Omit<RunExecution, 'id'>;

export async function logRunExecution(params: LogRunExecutionParams): Promise<number> {
  const {
    databaseUrl,
    startedAt,
    completedAt,
    status,
    environment,
    durationMs,
    tickersChecked,
    cronTrigger,
    bollingerSignalsFound,
    rsiSignalsFound,
  } = params;

  try {
    const client = postgres(databaseUrl);
    const db = drizzle(client);

    const result = await db
      .insert(runExecutions)
      .values({
        startedAt,
        completedAt,
        status,
        environment,
        durationMs,
        tickersChecked,
        cronTrigger,
        bollingerSignalsFound,
        rsiSignalsFound,
      })
      .returning({ id: runExecutions.id });

    await client.end();
    console.log(`[RunExecution] Record inserted: status=${status}, duration=${durationMs}ms`);
    return result[0].id;
  } catch (dbErr) {
    console.error('[RunExecution] Failed to insert record:', dbErr);
    throw dbErr;
  }
}
