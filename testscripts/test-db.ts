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
    console.log('Inserting Bollinger signal...');
    const bollingerSignalId = await logRunSignal({
      databaseUrl,
      runExecutionId: runExecutionId,
      ticker: 'AAPL',
      signalType: 'BOLLINGER',
      detectedAt: new Date(),
      bollingerType: 'SELL_CALL',
      currentPrice: 150.25,
      upperBand: 152.5,
      lowerBand: 147.5,
      rsiValue: 0,
      rsiSignal: 'NEUTRAL',
    });

    console.log(`Bollinger signal inserted! Signal ID: ${bollingerSignalId}`);

    console.log('Inserting RSI signals...');
    const rsiSignal1Id = await logRunSignal({
      databaseUrl,
      runExecutionId: runExecutionId,
      ticker: 'AAPL',
      signalType: 'RSI',
      detectedAt: new Date(),
      rsiValue: 75.5,
      rsiSignal: 'SELL',
      bollingerType: 'SELL_CALL',
      currentPrice: 0,
      upperBand: 0,
      lowerBand: 0,
    });

    const rsiSignal2Id = await logRunSignal({
      databaseUrl,
      runExecutionId: runExecutionId,
      ticker: 'MSFT',
      signalType: 'RSI',
      detectedAt: new Date(),
      rsiValue: 45.2,
      rsiSignal: 'NEUTRAL',
      bollingerType: 'SELL_CALL',
      currentPrice: 0,
      upperBand: 0,
      lowerBand: 0,
    });

    const rsiSignal3Id = await logRunSignal({
      databaseUrl,
      runExecutionId: runExecutionId,
      ticker: 'GOOGL',
      signalType: 'RSI',
      detectedAt: new Date(),
      rsiValue: 25.8,
      rsiSignal: 'BUY',
      bollingerType: 'SELL_CALL',
      currentPrice: 0,
      upperBand: 0,
      lowerBand: 0,
    });

    console.log(`RSI signals inserted: 3 records (IDs: ${rsiSignal1Id}, ${rsiSignal2Id}, ${rsiSignal3Id})`);

    console.log('\n=== Querying records ===');
    const executionRecords = await db.select().from(runExecutions);
    console.log(`Total execution records: ${executionRecords.length}`);
    console.log('Latest execution record:', executionRecords[executionRecords.length - 1]);

    const signalRecords = await db.select().from(runSignals);
    console.log(`\nTotal signal records: ${signalRecords.length}`);
    console.log('Signal records:');
    signalRecords.forEach((record, index) => {
      console.log(`  ${index + 1}. ${record.ticker} - ${record.signalType}`, {
        ...(record.signalType === 'BOLLINGER' && {
          type: record.bollingerType,
          price: record.currentPrice,
          upperBand: record.upperBand,
          lowerBand: record.lowerBand,
        }),
        ...(record.signalType === 'RSI' && {
          rsi: record.rsiValue,
          signal: record.rsiSignal,
        }),
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
