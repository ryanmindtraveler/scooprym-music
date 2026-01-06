import { getAdminStats, getDailyStats } from '../src/actions/admin';
import dotenv from 'dotenv';
// Load .env.local if present, or .env
dotenv.config({ path: '.env.local' });
dotenv.config();

async function main() {
  console.log('Fetching Admin Stats...');
  try {
      const stats = await getAdminStats();
      console.log('--- Admin Stats ---');
      console.log(JSON.stringify(stats, null, 2));

      const daily = await getDailyStats();
      console.log('--- Daily Stats ---');
      console.log(JSON.stringify(daily, null, 2));
      console.log('-------------------');
  } catch (error) {
    console.error('Error fetching stats:', error);
  }
  process.exit(0);
}

main();
