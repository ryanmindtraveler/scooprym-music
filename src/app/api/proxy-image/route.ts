import { type NextRequest, NextResponse } from 'next/server';

const FETCH_TIMEOUT_MS = 8_000;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function getAllowedOrigins() {
  const candidates = [process.env.STORAGE_PUBLIC_URL, ...(process.env.IMAGE_PROXY_ALLOWED_ORIGINS?.split(',') ?? [])];

  return new Set(
    candidates.flatMap((candidate) => {
      try {
        return candidate?.trim() ? [new URL(candidate.trim()).origin] : [];
      } catch {
        return [];
      }
    })
  );
}

async function readBodyWithLimit(response: Response) {
  if (!response.body) {
    throw new Error('Image response has no body');
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_IMAGE_BYTES) {
      await reader.cancel('Image exceeds proxy size limit');
      throw new Error('Image exceeds proxy size limit');
    }
    chunks.push(value);
  }

  return Buffer.concat(
    chunks.map((chunk) => Buffer.from(chunk)),
    totalBytes
  );
}

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
    const target = new URL(imageUrl);
    const allowedOrigins = getAllowedOrigins();
    if (target.protocol !== 'https:' || !allowedOrigins.has(target.origin)) {
      return new NextResponse('Image origin is not allowed', { status: 403 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(new Error('Image proxy timed out')), FETCH_TIMEOUT_MS);
    const response = await fetch(target, {
      redirect: 'error',
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

    const contentType = response.headers.get('Content-Type');
    if (!contentType || !contentType.startsWith('image/')) {
      return new NextResponse('Invalid content type. Only images are allowed.', { status: 400 });
    }

    const declaredLength = Number(response.headers.get('Content-Length') || 0);
    if (declaredLength > MAX_IMAGE_BYTES) {
      return new NextResponse('Image exceeds proxy size limit', { status: 413 });
    }

    const imageBuffer = await readBodyWithLimit(response);

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'public, max-age=86400, immutable');
    headers.set('Content-Length', String(imageBuffer.byteLength));

    return new NextResponse(imageBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Proxy Image Error:', error);
    return new NextResponse('Failed to fetch image', { status: 500 });
  }
}
