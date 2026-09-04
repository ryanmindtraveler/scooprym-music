CREATE TABLE "scooprym"."song_comment" (
	"id" text PRIMARY KEY NOT NULL,
	"song_id" text NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"status" text DEFAULT 'visible' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "song_comment_content_length_check" CHECK (char_length(btrim("scooprym"."song_comment"."content")) between 1 and 500),
	CONSTRAINT "song_comment_status_check" CHECK ("scooprym"."song_comment"."status" in ('visible', 'hidden'))
);
--> statement-breakpoint
ALTER TABLE "scooprym"."song_comment" ADD CONSTRAINT "song_comment_song_id_song_id_fk" FOREIGN KEY ("song_id") REFERENCES "scooprym"."song"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scooprym"."song_comment" ADD CONSTRAINT "song_comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "scooprym"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "song_comment_song_created_idx" ON "scooprym"."song_comment" USING btree ("song_id","created_at");--> statement-breakpoint
CREATE INDEX "song_comment_user_id_idx" ON "scooprym"."song_comment" USING btree ("user_id");