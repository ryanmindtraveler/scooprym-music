import { getDb } from '../src/db';
import { payment, song } from '../src/db/schema';
import { sql, desc } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function main() {
  const db = getDb();

  console.log('=== INSPECTING PAYMENT DATA ===');
  const payments = await db.select().from(payment).limit(5);
  console.log(JSON.stringify(payments, null, 2));

  console.log('=== INSPECTING DATE FORMATS ===');
  // Check what Postgres returns for 'Mon DD'
  const dateCheck = await db.execute(sql`SELECT to_char(NOW(), 'Mon DD') as formatted, NOW() as raw`);
  console.log('DB Format Check:', dateCheck);

  // Check what JS returns
  const jsDate = new Date();
  const jsFormatted = jsDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
  console.log('JS Format Check:', jsFormatted);

  // Check for Mismatch risk
  console.log(`Match? '${dateCheck[0].formatted}' === '${jsFormatted}' :`, dateCheck[0].formatted === jsFormatted);

  console.log('=== INSPECTING SONG DATES ===');
  const songDates = await db.select({
    createdAt: song.createdAt,
    formatted: sql<string>`to_char(${song.createdAt}, 'Mon DD')`
  }).from(song).orderBy(desc(song.createdAt)).limit(5);
  console.log(JSON.stringify(songDates, null, 2));

  process.exit(0);
}

main();
