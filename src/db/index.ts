import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { runExecutions, RunExecutionInsert, runSignals, RunSignalInsert } from './schema';

interface LogRunExecutionParams extends RunExecutionInsert {
  databaseUrl: string;
}

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
    macdSignalsFound,
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
        macdSignalsFound,
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

interface LogRunSignalParams extends RunSignalInsert {
  databaseUrl: string;
}

export async function logRunSignal(params: LogRunSignalParams): Promise<number> {
  const {
    databaseUrl,
    runExecutionId,
    ticker,
    detectedAt,
    bollingerSignal,
    currentPrice,
    upperBand,
    lowerBand,
    rsiValue,
    rsiSignal,
    macdValue,
    macdSignal,
    macdHistogram,
    macdCrossover,
  } = params;

  try {
    const client = postgres(databaseUrl);
    const db = drizzle(client);

    const result = await db
      .insert(runSignals)
      .values({
        runExecutionId,
        ticker,
        detectedAt,
        bollingerSignal,
        currentPrice,
        upperBand,
        lowerBand,
        rsiValue,
        rsiSignal,
        macdValue,
        macdSignal,
        macdHistogram,
        macdCrossover,
      })
      .returning({ id: runSignals.id });

    await client.end();
    console.log(`[RunSignal] Record inserted: ticker=${ticker}`);
    return result[0].id;
  } catch (dbErr) {
    console.error('[RunSignal] Failed to insert record:', dbErr);
    throw dbErr;
  }
}
