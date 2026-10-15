import { publicSongIndexCondition } from '@/db/song-query';
import { sql } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

describe('公开歌曲索引条件', () => {
  it('只接受公开且生成完成的状态，允许没有封面的音频成品', () => {
    const query = new PgDialect().sqlToQuery(publicSongIndexCondition(sql`latest.processing_status`)!);
    expect(query.sql).toContain('"is_published"');
    expect(query.sql).toContain('latest.processing_status in');
    expect(query.params).toEqual([true, 'completed', 'completed_without_cover']);
  });

  it('要求音频是 HTTP 地址，空值、空串和处理中占位值均不能进入索引', () => {
    const query = new PgDialect().sqlToQuery(publicSongIndexCondition(sql`latest.processing_status`)!);
    expect(query.sql).toContain('"audio_url" ~ \'^https?://\'');
    for (const value of ['', 'processing', 'pending-stream']) expect(/^https?:\/\//.test(value)).toBe(false);
  });
});
