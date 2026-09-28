import { z } from 'zod';

/** 仅用于模型传输；持久化与音乐供应商继续使用既有歌词字符串。 */
export const lyricSectionsSchema = z
  .array(
    z.object({
      section: z.enum(['Intro', 'Verse 1', 'Pre Chorus', 'Chorus', 'Hook', 'Verse 2', 'Break', 'Bridge', 'Outro']),
      lines: z
        .array(z.string().trim().min(1).max(180))
        .min(1)
        .max(12)
        .describe(
          'One sung phrase per item, ending at an intentional breath or rhythmic boundary. No embedded newlines, section tags, stage directions or production notes.'
        ),
    })
  )
  .min(2)
  .max(9)
  .describe('The complete song in performance order. Repeated sections must include their actual sung lines.');

/** 不用标点、大小写或词数推断换行，精确保留作者逐行输出。 */
export function renderLyricSections(sections: z.infer<typeof lyricSectionsSchema>) {
  for (const { lines } of sections) {
    if (lines.some((line) => /[\r\n\[\]{}]/.test(line))) {
      throw new Error(
        'Invalid lyric finalization: each sung line must be one phrase without embedded tags or metadata.'
      );
    }
  }
  return sections.map(({ section, lines }) => `[${section}]\n${lines.join('\n')}`).join('\n\n');
}

/** 将模型专用的逐行输出恢复为既有检查点与消费方契约。 */
export function materializeLyrics<T extends { sections: z.infer<typeof lyricSectionsSchema> }>(value: T) {
  const { sections, ...rest } = value;
  return { ...rest, lyrics: renderLyricSections(sections) };
}

/** 组装后的长度等错误沿用现有供应商恢复分类，不泄漏整份响应。 */
export function parseLyricPerformance<T extends z.ZodType>(
  schema: T,
  value: { sections: z.infer<typeof lyricSectionsSchema> }
) {
  const result = schema.safeParse(materializeLyrics(value));
  if (!result.success) {
    throw new Error(
      `Invalid lyric finalization: ${result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')}`
    );
  }
  return result.data;
}
