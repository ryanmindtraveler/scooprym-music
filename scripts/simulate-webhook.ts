import crypto from 'crypto';
import dotenv from 'dotenv';
import { desc } from 'drizzle-orm';
import { getDb } from '../src/db';
import { user } from '../src/db/schema';

// Load env vars
dotenv.config({ path: '.env.local' });
dotenv.config();

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

async function main() {
  if (!WEBHOOK_SECRET) {
    console.error('❌ Error: STRIPE_WEBHOOK_SECRET is not set in .env.local');
    console.error('Run "stripe listen --forward-to localhost:3000/api/webhooks/stripe" to get it.');
    process.exit(1);
  }

  console.log('🔍 Fetching a valid user from DB...');
  const db = getDb();
  // Get the most recent user
  const targetUser = await db
    .select()
    .from(user)
    .orderBy(desc(user.createdAt))
    .limit(1)
    .then((r) => r[0]);

  if (!targetUser) {
    console.error('❌ No users found in DB. Please sign up a user first.');
    process.exit(1);
  }

  console.log(`👤 Using User: ${targetUser.email} (${targetUser.id})`);

  // Construct payload
  // We simulate a 'checkout.session.completed' event
  // Metadata is CRITICAL for our webhook handler to identify the user and plan
  const timestamp = Math.floor(Date.now() / 1000);
  const payloadObj = {
    id: `evt_sim_${timestamp}`,
    object: 'event',
    api_version: '2023-10-16',
    created: timestamp,
    type: 'checkout.session.completed',
    data: {
      object: {
        id: `cs_sim_${timestamp}`,
        object: 'checkout.session',
        amount_total: 900,
        currency: 'usd',
        status: 'complete',
        payment_status: 'paid',
        customer: targetUser.customerId || 'cus_sim_new',
        customer_email: targetUser.email,
        metadata: {
          userId: targetUser.id,
          // Use a dummy or env price ID
          planId: 'basic',
          priceId: 'price_sim_basic',
          type: 'subscription',
        },
        mode: 'subscription',
        subscription: `sub_sim_${timestamp}`,
      },
    },
  };

  // 1. Send checkout.session.completed
  console.log('🚀 Sending checkout.session.completed event...');
  await sendWebhook(payloadObj, WEBHOOK_SECRET);

  // 2. Send invoice.paid (to trigger revenue update)
  console.log('🚀 Sending invoice.paid event...');
  const invoicePayload = {
    id: `evt_sim_inv_${timestamp}`,
    object: 'event',
    api_version: '2023-10-16',
    created: timestamp + 1,
    type: 'invoice.paid',
    data: {
      object: {
        id: `inv_sim_${timestamp}`,
        object: 'invoice',
        account_country: 'US',
        account_name: 'MkSaaS Demo',
        amount_paid: 900,
        amount_remaining: 0,
        currency: 'usd',
        customer: targetUser.customerId || 'cus_sim_new',
        customer_email: targetUser.email,
        status: 'paid',
        subscription: `sub_sim_${timestamp}`,
        lines: {
          data: [
            {
              id: `il_sim_${timestamp}`,
              object: 'line_item',
              amount: 900,
              price: { id: 'price_sim_basic' },
              plan: { id: 'price_sim_basic', interval: 'month' },
              description: 'Basic Plan',
            },
          ],
        },
      },
    },
  };
  await sendWebhook(invoicePayload, WEBHOOK_SECRET);

  console.log('✅ All events sent! Check your Admin Dashboard now.');
  process.exit(0);
}

async function sendWebhook(payloadObj: any, secret: string) {
  const payloadString = JSON.stringify(payloadObj, null, 2);
  const timestamp = Math.floor(Date.now() / 1000);

  // Generate Signature
  const signedPayload = `${timestamp}.${payloadString}`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(signedPayload);
  const signature = hmac.digest('hex');
  const stripeSignature = `t=${timestamp},v1=${signature}`;

  try {
    const res = await fetch('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': stripeSignature,
      },
      body: payloadString,
    });

    if (res.ok) {
      console.log('   ✅ Webhook success:', await res.json());
    } else {
      console.error(`   ❌ Failed: ${res.status} ${res.statusText}`);
      console.error('   Response:', await res.text());
    }
  } catch (err) {
    console.error('   ❌ Network Error:', err);
  }
}

// main(); // Removed explicit call, handled at bottom
main().catch(console.error);
