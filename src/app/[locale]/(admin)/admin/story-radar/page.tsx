import { StoryRadarPage } from '@/components/admin/story-radar-page';
import { parseRadarBrowseParams } from '@/lib/story-radar/browse-params';

export const dynamic = 'force-dynamic';

export default async function AdminStoryRadarPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const input = await searchParams;
  const { edition } = input;
  const day = typeof edition === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(edition) ? edition : undefined;
  return <StoryRadarPage edition={day} browseParams={parseRadarBrowseParams(input)} />;
}
