-- 已发布及历史歌曲分配固定的可读网址；新歌曲由创作流程分配。
ALTER TABLE "scooprym"."song" ADD COLUMN IF NOT EXISTS "seo_slug" text;
--> statement-breakpoint
WITH topics AS (
  SELECT
    s."id",
    s."created_at",
    COALESCE(NULLIF(st."news_summary", ''), s."title") AS headline
  FROM "scooprym"."song" s
  JOIN "scooprym"."story" st ON st."id" = s."story_id"
  WHERE s."seo_slug" IS NULL
), slug_bases AS (
  SELECT
    id,
    created_at,
    COALESCE(
      NULLIF(
        trim(both '-' from lower(regexp_replace(
          CASE
            WHEN length(split_part(headline, ',', 1)) > 90
              THEN regexp_replace(left(split_part(headline, ',', 1), 91), '[[:space:]]+[^[:space:]]*$', '')
            ELSE split_part(headline, ',', 1)
          END,
          '[^a-zA-Z0-9]+', '-', 'g'
        ))),
        ''
      ),
      'story'
    ) || '-funny-song' AS base_slug
  FROM topics
), numbered AS (
  SELECT id, base_slug,
    row_number() OVER (PARTITION BY base_slug ORDER BY created_at, id) AS slug_number
  FROM slug_bases
)
UPDATE "scooprym"."song" s
SET "seo_slug" = CASE
  WHEN numbered.slug_number = 1 THEN numbered.base_slug
  ELSE numbered.base_slug || '-' || numbered.slug_number::text
END
FROM numbered
WHERE s."id" = numbered.id;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "song_seo_slug_unique_idx" ON "scooprym"."song" ("seo_slug");
