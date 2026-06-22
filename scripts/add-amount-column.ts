import dotenv from 'dotenv';
import { sql } from 'drizzle-orm';
import { getDb } from '../src/db';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function main() {
  console.log('Manually adding "amount" column to payment table...');
  const db = getDb();

  try {
    await db.execute(sql`
      ALTER TABLE scooprym.payment
      ADD COLUMN IF NOT EXISTS amount INTEGER NOT NULL DEFAULT 0;
    `);
    console.log('Successfully added "amount" column!');
  } catch (error) {
    console.error('Error executing SQL:', error);
  }
  process.exit(0);
}

main();
