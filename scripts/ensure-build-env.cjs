const fs = require('node:fs');
const path = require('node:path');

const envPath = path.join(__dirname, '../.env');

if (!fs.existsSync(envPath)) {
  console.log('[ensure-build-env] No .env found in build environment. Generating build-time fallback env...');
  const buildDefaults = [
    'NEXT_PUBLIC_BASE_URL=https://scooprym.app',
    'BETTER_AUTH_SECRET=build_placeholder_secret_32_characters_long_for_next_build_only',
    'QSTASH_CURRENT_SIGNING_KEY=sig_placeholder_build_key_000000000000000000000000',
    'QSTASH_NEXT_SIGNING_KEY=sig_placeholder_build_key_000000000000000000000000',
    'DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres',
    'GITHUB_CLIENT_ID=build_placeholder',
    'GITHUB_CLIENT_SECRET=build_placeholder',
    'GOOGLE_CLIENT_ID=build_placeholder',
    'GOOGLE_CLIENT_SECRET=build_placeholder',
    'RESEND_API_KEY=re_placeholder',
    'STORAGE_REGION=auto',
    'STORAGE_BUCKET_NAME=build_placeholder',
    'STORAGE_ACCESS_KEY_ID=build_placeholder',
    'STORAGE_SECRET_ACCESS_KEY=build_placeholder',
    'STORAGE_ENDPOINT=https://placeholder.r2.cloudflarestorage.com',
    'STORAGE_PUBLIC_URL=https://placeholder.r2.dev',
    'STRIPE_SECRET_KEY=sk_test_placeholder',
    'STRIPE_WEBHOOK_SECRET=whsec_placeholder',
    'UPSTASH_REDIS_REST_URL=https://placeholder.upstash.io',
    'UPSTASH_REDIS_REST_TOKEN=build_placeholder',
    'MINIMAX_API_KEY=build_placeholder',
    'DEEPSEEK_API_KEY=build_placeholder',
    'OPENROUTER_API_KEY=build_placeholder',
  ].join('\n');

  fs.writeFileSync(envPath, buildDefaults, 'utf8');
  console.log('[ensure-build-env] Build-time .env created successfully.');
} else {
  console.log('[ensure-build-env] Existing .env detected.');
}
