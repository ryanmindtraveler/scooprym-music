
import 'dotenv/config';
import { generateCoverImageDataUrl } from '../src/ai/image/lib/cover-generation';

async function main() {
  console.log('--- DIAGNOSTIC: Testing Cover Image Safety Filters ---');

  const controversialSource = `
    Tory Lanez blasts multiple Megan Thee Stallion supporters...
    The rapper, who was convicted of shooting Megan...
    He claims unexpected evidence...
    Cell block / Jail content...
  `;

  console.log('Attempting to generate cover with controversial content...');
  const result = await generateCoverImageDataUrl({
    title: 'Cell Block Confidential',
    sourceText: controversialSource
  });

  if (result) {
    console.log('SUCCESS: Image generated despite content!');
    console.log('Image URL (truncated):', result.substring(0, 50) + '...');
  } else {
    console.error('FAILURE: Image generation returned null. Likely Safety Filter triggered.');
  }
}

main().catch(console.error);
