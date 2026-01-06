import { getDb } from '../src/db';
import { payment } from '../src/db/schema';
import { desc } from 'drizzle-orm';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

async function main() {
  const db = await getDb();
  const latestPayments = await db.select().from(payment).orderBy(desc(payment.createdAt)).limit(10);
  console.log('Latest 10 payments:', latestPayments.length);
  latestPayments.forEach((p, i) => {
    console.log(`[${i}] ID: ${p.id}, User: ${p.userId}, Session: ${p.sessionId}, Paid: ${p.paid}, Status: ${p.status}, Created: ${p.createdAt}`);
  });
}

main().catch(console.error);
