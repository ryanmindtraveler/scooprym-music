import 'dotenv/config';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error('Error: STRIPE_SECRET_KEY is missing in .env');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-12-18.acacia' as any, // Use latest or what's in package.json
});

async function main() {
  console.log('🔄 Fetching products and prices from Stripe...');

  const prices = await stripe.prices.list({
    active: true,
    expand: ['data.product'],
    limit: 100,
  });

  console.log(`✅ Found ${prices.data.length} active prices.\n`);

  console.log('👇 COPY AND PASTE THE BLOCK BELOW INTO YOUR .env FILE 👇');
  console.log('-------------------------------------------------------');

  const envLines: string[] = [];

  // Group by Product Name logic
  for (const price of prices.data) {
    const product = price.product as Stripe.Product;
    const productName = product.name.toLowerCase();
    const interval = price.recurring?.interval || 'onetime';
    const amount = (price.unit_amount! / 100).toFixed(2);

    let keyName = '';

    // Logic to guess the env key based on product name
    if (productName.includes('basic')) {
      if (interval === 'month') keyName = 'NEXT_PUBLIC_STRIPE_PRICE_BASIC_MONTHLY';
      if (interval === 'year') keyName = 'NEXT_PUBLIC_STRIPE_PRICE_BASIC_YEARLY';
    } else if (productName.includes('advanced') || productName.includes('pro')) {
      // Assuming 'Advanced' corresponds to the next tier, heavily used in this project
      if (interval === 'month') keyName = 'NEXT_PUBLIC_STRIPE_PRICE_ADVANCED_MONTHLY';
      if (interval === 'year') keyName = 'NEXT_PUBLIC_STRIPE_PRICE_ADVANCED_YEARLY';
    } else if (productName.includes('lifetime')) {
      keyName = 'NEXT_PUBLIC_STRIPE_PRICE_LIFETIME';
    } else if (productName.includes('credit') || productName.includes('pack')) {
      // Just print it as a comment or generic credit name
      keyName = `# CREDIT PACK: ${product.name} (${amount})`;
    }

    if (keyName && !keyName.startsWith('#')) {
      envLines.push(`${keyName}=${price.id} # ${product.name} - $${amount}/${interval}`);
    } else {
      // Fallback or just info
      envLines.push(`# UNMAPPED: ${price.id} | ${product.name} | $${amount} | ${interval}`);
    }
  }

  // Sort to make it look nice
  envLines.sort();

  console.log(envLines.join('\n'));
  console.log('-------------------------------------------------------');
}

main().catch(console.error);
