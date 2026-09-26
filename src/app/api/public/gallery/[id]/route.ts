import { getHomeGallerySong } from '@/lib/songs/home-gallery';
import { NextResponse } from 'next/server';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: 'Invalid song ID' }, { status: 400 });
  }

  try {
    const song = await getHomeGallerySong(id);
    if (!song) return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    return NextResponse.json({ song });
  } catch (error) {
    console.error('Failed to load public gallery song:', error);
    return NextResponse.json({ error: 'Song unavailable' }, { status: 500 });
  }
}
