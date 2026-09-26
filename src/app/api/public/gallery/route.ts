import { HOME_GALLERY_PAGE_SIZE, getHomeGalleryPage } from '@/lib/songs/home-gallery';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const rawPage = request.nextUrl.searchParams.get('page') ?? '1';
  if (!/^[1-9]\d*$/.test(rawPage)) {
    return NextResponse.json({ error: 'Invalid page' }, { status: 400 });
  }

  const page = Number(rawPage);
  if (!Number.isSafeInteger(page) || page > 100_000) {
    return NextResponse.json({ error: 'Invalid page' }, { status: 400 });
  }

  try {
    const result = await getHomeGalleryPage(page);
    if (page > Math.max(1, Math.ceil(result.total / HOME_GALLERY_PAGE_SIZE))) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to load public gallery page:', error);
    return NextResponse.json({ error: 'Gallery unavailable' }, { status: 500 });
  }
}
