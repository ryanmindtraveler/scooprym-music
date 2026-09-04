DROP INDEX "scooprym"."song_comment_user_id_idx";--> statement-breakpoint
CREATE INDEX "song_comment_user_created_idx" ON "scooprym"."song_comment" USING btree ("user_id","created_at");