-- 固定创作时的简短事件主题，避免后续摘要编辑改变 title tag。
ALTER TABLE "scooprym"."song" ADD COLUMN IF NOT EXISTS "seo_topic" text;
