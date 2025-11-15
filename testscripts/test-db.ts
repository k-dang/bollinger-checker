import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { runExecutions, runSignals } from '../src/db/schema';
import { logRunExecution, logRunSignal } from '../src/db';

async function testDb() {
  const databaseUrl = process.env.DATABASE_URL;
  const environmentName = process.env.ENVIRONMENT_NAME ?? 'local';

  if (!databaseUrl) {
    console.error('Please set DATABASE_URL environment variable');
    return;
  }

  try {
    console.log('Connecting to database...');
    const client = postgres(databaseUrl);
    const db = drizzle(client);

    console.log('\n=== Testing runExecutions table ===');
    const startTime = new Date();
    const completedTime = new Date();
    const durationMs = completedTime.getTime() - startTime.getTime();

    console.log('Inserting test execution record with new fields...');
    const runExecutionId = await logRunExecution({
      databaseUrl,
      startedAt: startTime,
      completedAt: completedTime,
      status: 'success',
      environment: environmentName,
      durationMs,
      tickersChecked: 10,
      cronTrigger: '* * * * *',
      bollingerSignalsFound: 3,
      rsiSignalsFound: 10,
    });
    console.log(`Insert successful! Run execution ID: ${runExecutionId}`);

    console.log('\n=== Testing runSignals table ===');
    console.log('Inserting signals in parallel...');
    const [bollingerSignalId, rsiSignal1Id, rsiSignal2Id, rsiSignal3Id] = await Promise.all([
      logRunSignal({
        databaseUrl,
        runExecutionId: runExecutionId,
        ticker: 'AAPL',
        detectedAt: new Date(),
        bollingerSignal: 'SELL_CALL',
        currentPrice: 150.25,
        upperBand: 152.5,
        lowerBand: 147.5,
        rsiValue: 0,
        rsiSignal: 'NEUTRAL',
      }),
      logRunSignal({
        databaseUrl,
        runExecutionId: runExecutionId,
        ticker: 'AAPL',
        detectedAt: new Date(),
        rsiValue: 75.5,
        rsiSignal: 'SELL',
        bollingerSignal: 'SELL_CALL',
        currentPrice: 0,
        upperBand: 0,
        lowerBand: 0,
      }),
      logRunSignal({
        databaseUrl,
        runExecutionId: runExecutionId,
        ticker: 'MSFT',
        detectedAt: new Date(),
        rsiValue: 45.2,
        rsiSignal: 'NEUTRAL',
        bollingerSignal: 'SELL_CALL',
        currentPrice: 0,
        upperBand: 0,
        lowerBand: 0,
      }),
      logRunSignal({
        databaseUrl,
        runExecutionId: runExecutionId,
        ticker: 'GOOGL',
        detectedAt: new Date(),
        rsiValue: 25.8,
        rsiSignal: 'BUY',
        bollingerSignal: 'SELL_CALL',
        currentPrice: 0,
        upperBand: 0,
        lowerBand: 0,
      }),
    ]);

    console.log(
      `Signals inserted: Bollinger ID=${bollingerSignalId}, RSI IDs=${rsiSignal1Id}, ${rsiSignal2Id}, ${rsiSignal3Id}`,
    );

    console.log('\n=== Querying records ===');
    const executionRecords = await db.select().from(runExecutions);
    console.log(`Total execution records: ${executionRecords.length}`);
    console.log('Latest execution record:', executionRecords[executionRecords.length - 1]);

    const signalRecords = await db.select().from(runSignals);
    console.log(`\nTotal signal records: ${signalRecords.length}`);
    console.log('Signal records:');
    signalRecords.forEach((record, index) => {
      console.log(`  ${index + 1}. ${record.ticker} - ${record.bollingerSignal}`, {
        bollingerSignal: record.bollingerSignal,
        currentPrice: record.currentPrice,
        upperBand: record.upperBand,
        lowerBand: record.lowerBand,
        rsiValue: record.rsiValue,
        rsiSignal: record.rsiSignal,
      });
    });

    await client.end();
    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testDb();
