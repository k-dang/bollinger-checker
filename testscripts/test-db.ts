import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { runExecutions } from '../src/db/schema';

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

    console.log('Inserting test record...');
    const startTime = new Date();
    const insertResult = await db
      .insert(runExecutions)
      .values({
        startedAt: startTime,
        completedAt: new Date(),
        status: 'success',
        durationMs: 150,
        tickersChecked: 5,
        cronTrigger: '* * * * *',
      })
      .returning();

    console.log('Insert successful! Record:', insertResult[0]);

    console.log('\nQuerying records...');
    const records = await db.select().from(runExecutions);
    console.log(`Total records: ${records.length}`);
    console.log('Latest record:', records[records.length - 1]);

    await client.end();
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testDb();
