ALTER TABLE "scooprym"."song" ADD COLUMN "scheduled_at" timestamp;--> statement-breakpoint
ALTER TABLE "scooprym"."song" ADD COLUMN "published_at" timestamp;--> statement-breakpoint
CREATE INDEX "song_scheduled_at_idx" ON "scooprym"."song" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "song_published_at_idx" ON "scooprym"."song" USING btree ("published_at");