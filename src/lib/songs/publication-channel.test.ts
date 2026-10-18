import { galleryPublicationCondition, lorePublicationCondition } from '@/db/song-query';
import { PgDialect } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';
import { songPublicationPlacementSchema } from './publication-channel';

describe('公开状态与展示栏目独立', () => {
  it('专题必须明确选择已支持的专题；拒绝缺失、伪造栏目和残留专题', () => {
    for (const placement of [
      { publicationChannel: 'internet_lore', loreTopicSlug: null },
      { publicationChannel: 'internet_lore', loreTopicSlug: 'unknown' },
      { publicationChannel: 'gallery', loreTopicSlug: 'meme-culture' },
      { publicationChannel: 'both', loreTopicSlug: null },
    ])
      expect(songPublicationPlacementSchema.safeParse(placement).success).toBe(false);
    expect(
      songPublicationPlacementSchema.safeParse({ publicationChannel: 'gallery', loreTopicSlug: null }).success
    ).toBe(true);
    expect(
      songPublicationPlacementSchema.safeParse({ publicationChannel: 'internet_lore', loreTopicSlug: 'meme-culture' })
        .success
    ).toBe(true);
  });

  it('Gallery 与榜单过滤在查询阶段隔离专题歌曲；不依赖客户端藏卡片', () => {
    const query = new PgDialect().sqlToQuery(galleryPublicationCondition()!);
    expect(query.sql).toContain('"is_published"');
    expect(query.sql).toContain('"publication_channel"');
    expect(query.params).toEqual([true, 'gallery']);
  });

  it('专题读取公开状态和明确专题，覆盖六个专题而不猜测标题关键词', () => {
    const query = new PgDialect().sqlToQuery(lorePublicationCondition('news-parody')!);
    expect(query.params).toEqual([true, 'internet_lore', 'news-parody']);
    const all = new PgDialect().sqlToQuery(lorePublicationCondition()!);
    expect(all.params).toHaveLength(8);
  });
});
