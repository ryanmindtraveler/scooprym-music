CREATE TABLE "scooprym"."generation_attempt" (
	"id" text PRIMARY KEY NOT NULL,
	"song_id" text NOT NULL,
	"prompt" text,
	"generation_prompt" text,
	"cover_art_prompt" text,
	"output_format" text DEFAULT 'url' NOT NULL,
	"audio_format" text DEFAULT 'mp3' NOT NULL,
	"generation_request_hash" text,
	"generation_billing_mode" text DEFAULT 'internal_admin' NOT NULL,
	"processing_status" text DEFAULT 'queued',
	"processing_error" text,
	"credits_deducted" boolean DEFAULT false,
	"credit_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scooprym"."story" (
	"id" text PRIMARY KEY NOT NULL,
	"source_url" text,
	"source_text" text,
	"news_summary" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scooprym"."song" ADD COLUMN "story_id" text;
--> statement-breakpoint
INSERT INTO "scooprym"."story" ("id", "source_url", "source_text", "news_summary", "created_at", "updated_at")
SELECT DISTINCT ON (COALESCE(NULLIF(BTRIM("source_url"), ''), '__song__:' || "id"))
	"id", NULLIF(BTRIM("source_url"), ''), "source_text", "news_summary", "created_at", "updated_at"
FROM "scooprym"."song"
ORDER BY COALESCE(NULLIF(BTRIM("source_url"), ''), '__song__:' || "id"),
	("processing_status" = 'completed') DESC, "created_at" DESC, "id";
--> statement-breakpoint
UPDATE "scooprym"."song" AS "current_song"
SET "story_id" = "matched_story"."id"
FROM "scooprym"."story" AS "matched_story"
WHERE (
	NULLIF(BTRIM("current_song"."source_url"), '') IS NOT NULL
	AND "matched_story"."source_url" = NULLIF(BTRIM("current_song"."source_url"), '')
) OR (
	NULLIF(BTRIM("current_song"."source_url"), '') IS NULL
	AND "matched_story"."id" = "current_song"."id"
);
--> statement-breakpoint
INSERT INTO "scooprym"."generation_attempt" (
	"id", "song_id", "prompt", "generation_prompt", "cover_art_prompt", "output_format", "audio_format",
	"generation_request_hash", "generation_billing_mode", "processing_status", "processing_error",
	"credits_deducted", "credit_error", "created_at", "updated_at"
)
SELECT "id", "id", "prompt", "generation_prompt", "cover_art_prompt", "output_format", "audio_format",
	"generation_request_hash", "generation_billing_mode", "processing_status", "processing_error",
	"credits_deducted", "credit_error", "created_at", "updated_at"
FROM "scooprym"."song";
--> statement-breakpoint
ALTER TABLE "scooprym"."song" ALTER COLUMN "story_id" SET NOT NULL;
--> statement-breakpoint
DROP INDEX "scooprym"."song_processing_updated_idx";
--> statement-breakpoint
ALTER TABLE "scooprym"."generation_attempt" ADD CONSTRAINT "generation_attempt_song_id_song_id_fk" FOREIGN KEY ("song_id") REFERENCES "scooprym"."song"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "scooprym"."song" ADD CONSTRAINT "song_story_id_story_id_fk" FOREIGN KEY ("story_id") REFERENCES "scooprym"."story"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "generation_attempt_song_id_idx" ON "scooprym"."generation_attempt" USING btree ("song_id");
--> statement-breakpoint
CREATE INDEX "generation_attempt_status_updated_idx" ON "scooprym"."generation_attempt" USING btree ("processing_status", "updated_at");
--> statement-breakpoint
CREATE INDEX "generation_attempt_song_created_idx" ON "scooprym"."generation_attempt" USING btree ("song_id", "created_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "story_source_url_unique" ON "scooprym"."story" USING btree ("source_url");
--> statement-breakpoint
CREATE INDEX "story_created_at_idx" ON "scooprym"."story" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX "song_story_id_idx" ON "scooprym"."song" USING btree ("story_id");
--> statement-breakpoint
ALTER TABLE "scooprym"."song" DROP COLUMN "prompt";
--> statement-breakpoint
ALTER TABLE "scooprym"."song" DROP COLUMN "generation_prompt";
--> statement-breakpoint
ALTER TABLE "scooprym"."song" DROP COLUMN "cover_art_prompt";
--> statement-breakpoint
ALTER TABLE "scooprym"."song" DROP COLUMN "output_format";
--> statement-breakpoint
ALTER TABLE "scooprym"."song" DROP COLUMN "audio_format";
--> statement-breakpoint
ALTER TABLE "scooprym"."song" DROP COLUMN "generation_request_hash";
--> statement-breakpoint
ALTER TABLE "scooprym"."song" DROP COLUMN "generation_billing_mode";
--> statement-breakpoint
ALTER TABLE "scooprym"."song" DROP COLUMN "processing_error";
--> statement-breakpoint
ALTER TABLE "scooprym"."song" DROP COLUMN "source_url";
--> statement-breakpoint
ALTER TABLE "scooprym"."song" DROP COLUMN "source_text";
--> statement-breakpoint
ALTER TABLE "scooprym"."song" DROP COLUMN "credits_deducted";
--> statement-breakpoint
ALTER TABLE "scooprym"."song" DROP COLUMN "processing_status";
--> statement-breakpoint
ALTER TABLE "scooprym"."song" DROP COLUMN "credit_error";
--> statement-breakpoint
ALTER TABLE "scooprym"."song" DROP COLUMN "news_summary";
