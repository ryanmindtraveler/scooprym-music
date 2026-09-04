import { StoryRadarPage } from '@/components/admin/story-radar-page';

export const dynamic = 'force-dynamic';

export default async function AdminStoryRadarPage({ searchParams }: { searchParams: Promise<{ edition?: string }> }) {
  const { edition } = await searchParams;
  const day = typeof edition === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(edition) ? edition : undefined;
  return <StoryRadarPage edition={day} />;
}
