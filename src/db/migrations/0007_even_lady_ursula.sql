CREATE TABLE "song" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"lyrics" text,
	"prompt" text,
	"source_url" text,
	"source_text" text,
	"audio_url" text NOT NULL,
	"audio_key" text,
	"duration_sec" integer,
	"plays" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "song" ADD CONSTRAINT "song_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "song_user_id_idx" ON "song" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "song_created_at_idx" ON "song" USING btree ("created_at");