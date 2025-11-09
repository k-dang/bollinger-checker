import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { runExecutions, runSignals } from '../src/db/schema';
import { logRunExecution } from '../src/db/runExecutions';

async function testDb() {
  const databaseUrl = process.env.DATABASE_URL;

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
      durationMs,
      tickersChecked: 10,
      cronTrigger: '* * * * *',
      bollingerSignalsFound: 3,
      rsiSignalsFound: 10,
    });
    console.log(`Insert successful! Run execution ID: ${runExecutionId}`);

    console.log('\n=== Testing runSignals table ===');
    console.log('Inserting Bollinger signal...');
    const bollingerSignal = await db
      .insert(runSignals)
      .values({
        runExecutionId: runExecutionId,
        ticker: 'AAPL',
        signalType: 'BOLLINGER',
        detectedAt: new Date(),
        bollingerType: 'SELL_CALL',
        currentPrice: '150.25',
        upperBand: '152.50',
        lowerBand: '147.50',
      })
      .returning();

    console.log('Bollinger signal inserted:', bollingerSignal[0]);

    console.log('Inserting RSI signals...');
    const rsiSignals = await db
      .insert(runSignals)
      .values([
        {
          runExecutionId: runExecutionId,
          ticker: 'AAPL',
          signalType: 'RSI',
          detectedAt: new Date(),
          rsiValue: '75.5',
          rsiSignal: 'SELL',
        },
        {
          runExecutionId: runExecutionId,
          ticker: 'MSFT',
          signalType: 'RSI',
          detectedAt: new Date(),
          rsiValue: '45.2',
          rsiSignal: 'NEUTRAL',
        },
        {
          runExecutionId: runExecutionId,
          ticker: 'GOOGL',
          signalType: 'RSI',
          detectedAt: new Date(),
          rsiValue: '25.8',
          rsiSignal: 'BUY',
        },
      ])
      .returning();

    console.log(`RSI signals inserted: ${rsiSignals.length} records`);

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
