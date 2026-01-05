
import { NextResponse } from 'next/server';
import { pages } from '../../../../.source';

export async function GET() {
  try {
    console.log('Pages array length:', pages.length);
    console.log('First page item keys:', Object.keys(pages[0] || {}));
    console.log('First page item sample:', JSON.stringify(pages[0], null, 2)); // Careful with circular refs
    return NextResponse.json({
      length: pages.length,
      firstItemRaw: pages[0]?._raw,
      keys: Object.keys(pages[0] || {})
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
