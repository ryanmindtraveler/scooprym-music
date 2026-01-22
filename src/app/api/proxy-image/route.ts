import { type NextRequest, NextResponse } from 'next/server';

/**
 * Proxy Image API
 * Bypasses CORS restrictions for client-side image processing (color extraction).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new NextResponse('Missing URL parameter', { status: 400 });
  }

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

    const contentType = response.headers.get('Content-Type');
    if (!contentType || !contentType.startsWith('image/')) {
      return new NextResponse('Invalid content type. Only images are allowed.', { status: 400 });
    }

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Cache-Control', 'public, max-age=86400, mutable');

    // Stream the response directly for better performance
    return new NextResponse(response.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Proxy Image Error:', error);
    return new NextResponse('Failed to fetch image', { status: 500 });
  }
}
