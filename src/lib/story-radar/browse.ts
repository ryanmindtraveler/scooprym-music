import 'server-only';
import { getDb } from '@/db';
import { storyCandidate as candidate } from '@/db/schema';
import { and, count, desc, eq, gt, ilike, not, or, sql } from 'drizzle-orm';
import { RADAR_STATUSES, type RadarBrowseParams, type RadarStatus } from './browse-params';

// 与已生成歌曲查询使用相同的完成判定，不能把中间音频当作成品。
const generated = sql`exists (
  select 1 from scooprym.story s join scooprym.song song on song.story_id = s.id
  where (s.id = ${candidate.storyId} or s.source_url = ${candidate.sourceUrl})
  and song.audio_url ~ '^https?://'
  and coalesce((select ga.processing_status from scooprym.generation_attempt ga
    where ga.song_id = song.id order by ga.created_at desc, ga.id desc limit 1),
    case when song.is_published then 'completed' else '' end) = 'completed'
)`;
const producing = and(
  not(generated),
  or(
    eq(candidate.status, 'adopted'),
    sql`exists (
  select 1 from scooprym.radar_creation_job job left join scooprym.song_creation_run run on run.id = job.run_id
  where job.candidate_id = ${candidate.id} and coalesce(run.status, '') <> 'completed'
)`
  )
);

function statusCondition(status: RadarStatus) {
  return status === 'all'
    ? undefined
    : status === 'generated'
      ? generated
      : status === 'adopted'
        ? producing
        : eq(candidate.status, status);
}

export async function getRadarTotals() {
  const db = await getDb();
  const [totals] = await db
    .select({
      count: count(),
      shortlisted: sql<number>`cast(count(*) filter (where ${eq(candidate.status, 'shortlisted')}) as integer)`,
      generated: sql<number>`cast(count(*) filter (where ${generated}) as integer)`,
      producing: sql<number>`cast(count(*) filter (where ${producing}) as integer)`,
    })
    .from(candidate);
  return totals;
}

export async function getRadarCandidatePage(params: RadarBrowseParams) {
  const db = await getDb();
  const pattern = `%${params.q.replace(/[\\%_]/g, '\\$&')}%`;
  const base = and(
    params.category === 'all' ? undefined : eq(candidate.category, params.category),
    params.q
      ? or(
          ilike(candidate.sourceTitle, pattern),
          ilike(candidate.sourceDomain, pattern),
          ilike(candidate.matchedTerms, pattern)
        )
      : undefined,
    params.review ? and(eq(candidate.status, 'new'), sql`coalesce(${candidate.matchedTerms}, '[]') = '[]'`) : undefined,
    params.hideLow && params.status !== 'dismissed' ? gt(candidate.relevanceScore, 20) : undefined
  );
  const fields = Object.fromEntries(
    RADAR_STATUSES.map((status) => [
      status,
      status === 'all' ? count() : sql<number>`cast(count(*) filter (where ${statusCondition(status)}) as integer)`,
    ])
  );
  const [row] = await db.select(fields).from(candidate).where(base);
  const counts = Object.fromEntries(RADAR_STATUSES.map((status) => [status, Number(row[status])])) as Record<
    RadarStatus,
    number
  >;
  const total = counts[params.status];
  const page = Math.min(params.page, Math.max(1, Math.ceil(total / params.size)));
  const candidates = await db
    .select()
    .from(candidate)
    .where(and(base, statusCondition(params.status)))
    .orderBy(desc(candidate.relevanceScore), sql`${candidate.publishedAt} desc nulls last`, candidate.id)
    .limit(params.size)
    .offset((page - 1) * params.size);
  return { candidates, params: { ...params, page }, counts, total };
}
