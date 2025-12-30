import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

const db = {};
const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  emailAndPassword: { enabled: true },
});

console.log('Auth Keys:', Object.keys(auth));
console.log('Auth.handler:', !!auth.handler);
console.log('Auth.options:', !!auth.options);
if (auth.internal) console.log('Internal Keys:', Object.keys(auth.internal));
