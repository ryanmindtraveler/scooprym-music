ALTER TABLE "scooprym"."song" ALTER COLUMN "processing_status" SET DEFAULT 'queued';--> statement-breakpoint
ALTER TABLE "scooprym"."song" ADD COLUMN "generation_prompt" text;--> statement-breakpoint
ALTER TABLE "scooprym"."song" ADD COLUMN "cover_art_prompt" text;--> statement-breakpoint
ALTER TABLE "scooprym"."song" ADD COLUMN "output_format" text DEFAULT 'url' NOT NULL;--> statement-breakpoint
ALTER TABLE "scooprym"."song" ADD COLUMN "audio_format" text DEFAULT 'mp3' NOT NULL;--> statement-breakpoint
ALTER TABLE "scooprym"."song" ADD COLUMN "generation_request_hash" text;--> statement-breakpoint
ALTER TABLE "scooprym"."song" ADD COLUMN "generation_billing_mode" text DEFAULT 'internal_admin' NOT NULL;--> statement-breakpoint
ALTER TABLE "scooprym"."song" ADD COLUMN "processing_error" text;--> statement-breakpoint
CREATE INDEX "song_processing_updated_idx" ON "scooprym"."song" USING btree ("processing_status","updated_at");