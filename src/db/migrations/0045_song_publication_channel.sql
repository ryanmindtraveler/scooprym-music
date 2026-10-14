-- 所有既有作品保持原公开状态，默认归入 Gallery；原歌发布另走定向、可核对的操作。
ALTER TABLE "scooprym"."song" ADD COLUMN IF NOT EXISTS "publication_channel" text NOT NULL DEFAULT 'gallery';
--> statement-breakpoint
ALTER TABLE "scooprym"."song" ADD COLUMN IF NOT EXISTS "lore_topic_slug" text;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'song_publication_placement_check' AND conrelid = 'scooprym.song'::regclass) THEN
    ALTER TABLE "scooprym"."song" ADD CONSTRAINT "song_publication_placement_check" CHECK (
      (publication_channel = 'gallery' AND lore_topic_slug IS NULL)
      OR (publication_channel = 'internet_lore' AND lore_topic_slug IS NOT NULL AND lore_topic_slug IN (
        'absurd-social-phenomena', 'entertainment-topics', 'gossip-roast', 'news-parody', 'meme-culture', 'comedy-drill'
      ))
    );
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "song_publication_placement_idx" ON "scooprym"."song" ("is_published", "publication_channel", "lore_topic_slug");
