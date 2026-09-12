-- 旧版短视频表只允许服务端访问，阻止 Data API 的匿名及普通用户直读直写。
ALTER TABLE IF EXISTS "public"."viral_short" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DO $$
BEGIN
  IF to_regclass('public.viral_short') IS NOT NULL THEN
    REVOKE ALL ON TABLE "public"."viral_short" FROM PUBLIC, anon, authenticated;
  END IF;
END $$;
