
import 'dotenv/config';
import { generateCoverImageDataUrl } from '../src/ai/image/lib/cover-generation';

async function main() {
  console.log('--- DIAGNOSTIC: Testing Cover Image Generation ---');

  if (!process.env.OPENROUTER_API_KEY) {
    console.error('ERROR: OPENROUTER_API_KEY is missing in environment variables.');
    return;
  }

  console.log('API Key present:', process.env.OPENROUTER_API_KEY.substring(0, 10) + '...');

  console.log('Attempting to generate cover...');
  const result = await generateCoverImageDataUrl({
    title: 'Test Song',
    lyrics: 'This is a test song for diagnostic purposes.'
  });

  if (result) {
    console.log('SUCCESS: Image generated!');
    console.log('Image URL:', result);
  } else {
    console.error('FAILURE: Image generation returned null.');
  }
}

main().catch(console.error);
