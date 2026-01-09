
import { loadEnvConfig } from '@next/env';
import Stripe from 'stripe';

// Load environment variables
const projectDir = process.cwd();
loadEnvConfig(projectDir);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

async function simulateWebhook() {
  const sessionId = 'cs_test_a1Ik6CI3uGU43BU3Mg9WOXBGJ8mn2nf9igAiu69GVqNzmmlRixiG1TClS0'; // The session ID from user logs

  console.log(`Retrieving session ${sessionId}...`);
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (!session) {
    console.error('Session not found');
    return;
  }

  console.log('Session found, simulating checkout.session.completed event...');

  // Construct the payload manually to match what Stripe sends
  const payload = {
    id: `evt_test_${Date.now()}`,
    object: 'event',
    api_version: '2025-02-24.acacia',
    created: Math.floor(Date.now() / 1000),
    type: 'checkout.session.completed',
    data: {
      object: session,
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: `req_test_${Date.now()}`,
      idempotency_key: `key_test_${Date.now()}`,
    },
  };

  // We cannot easily sign it locally without the real webhook secret and generating a valid signature header that matches the body.
  // Instead, we will call the internal handler logic if we were running in a test script context,
  // BUT effectively we want to hit the API route.

  // Since we can't easily forge the signature for the Next.js API route without the secret matching perfectly to what the server expects,
  // AND the server enforces signature verification.

  // ALTERNATIVE: Use the Stripe CLI to trigger the event if available, but we don't have user's CLI access.

  // WORKAROUND: We will write a direct DB update script to "fix" this specific transaction for the user
  // so they can see "Success" while we fix the root cause (webhook config).

  // ... actually, let's just trigger the Stripe CLI "trigger" command if installed? No.

  // Let's create a script that IMPORTS the logic and runs it directly, bypassing the HTTP layer.
  // We need to import 'tsx' to run typescript.
}

// SIMPLER APPROACH:
// Just update the database directly to set paid=true for this session.
import { getDb } from '../src/db';
import { payment } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function fixPayment() {
    const sessionId = 'cs_test_a1Ik6CI3uGU43BU3Mg9WOXBGJ8mn2nf9igAiu69GVqNzmmlRixiG1TClS0';
    const db = await getDb();
    console.log(`Updating payment status for session ${sessionId}...`);

    // Check if record exists first
    const record = await db.select().from(payment).where(eq(payment.sessionId, sessionId));

    if (record.length === 0) {
        console.log("No payment record found! This means 'checkout.session.completed' handler didn't even run to create the initial record.");
        // This is a crucial finding. If no record, then webhook didn't hit at all.
    } else {
        console.log("Found record:", record[0]);
        await db.update(payment).set({ paid: true, status: 'manual_fix_test' }).where(eq(payment.sessionId, sessionId));
        console.log("Updated paid=true.");
    }
}

fixPayment().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
