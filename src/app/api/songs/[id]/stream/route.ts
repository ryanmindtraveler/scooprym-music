import { getStreamResponse } from '@/lib/infrastructure/stream-cache';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Fix: params is a Promise in Next.js 15
) {
  const { id } = await params; // Fix: await params

  const response = getStreamResponse(id);

  if (!response) {
    return new Response('Stream not found or expired', { status: 404 });
  }

  return response;
}
