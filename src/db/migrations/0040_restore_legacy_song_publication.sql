-- 旧版详情页允许已完成作品公开访问；2026-09-04 新门禁遗漏了历史发布状态迁移。
-- 仅修复未进入新工作流、未排期且新门禁前未再修改的旧成品。
-- 保留 published_at：缺少历史发布事件时不能虚构发布日期。
-- 写入 updated_at 后，即使未来管理员下架，再次执行也不会重新公开。
UPDATE "scooprym"."song" AS s
SET "is_published" = true, "updated_at" = CURRENT_TIMESTAMP
WHERE s."is_published" IS NOT TRUE
  AND s."created_at" < TIMESTAMP '2026-09-04 00:00:00'
  AND s."updated_at" < TIMESTAMP '2026-09-04 00:00:00'
  AND s."scheduled_at" IS NULL
  AND s."audio_url" ~ '^https?://'
  AND EXISTS (SELECT 1 FROM "scooprym"."story" st WHERE st."id" = s."story_id")
  AND NOT EXISTS (SELECT 1 FROM "scooprym"."song_creation_run" r WHERE r."song_id" = s."id")
  AND EXISTS (
    SELECT 1 FROM (
      SELECT a."processing_status", a."created_at", a."updated_at"
      FROM "scooprym"."generation_attempt" a
      WHERE a."song_id" = s."id"
      ORDER BY a."created_at" DESC, a."id" DESC
      LIMIT 1
    ) latest
    WHERE latest."processing_status" IN ('completed', 'completed_without_cover')
      AND latest."created_at" < TIMESTAMP '2026-09-04 00:00:00'
      AND latest."updated_at" < TIMESTAMP '2026-09-04 00:00:00'
  );
