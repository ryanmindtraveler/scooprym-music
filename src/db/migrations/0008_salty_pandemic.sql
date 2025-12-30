CREATE TABLE "song_favorite" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"song_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "song_play" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"song_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "song" ADD COLUMN "cover_image_url" text;--> statement-breakpoint
ALTER TABLE "song" ADD COLUMN "cover_image_key" text;--> statement-breakpoint
ALTER TABLE "song" ADD COLUMN "is_admin_generated" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "song_favorite" ADD CONSTRAINT "song_favorite_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_favorite" ADD CONSTRAINT "song_favorite_song_id_song_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."song"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_play" ADD CONSTRAINT "song_play_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_play" ADD CONSTRAINT "song_play_song_id_song_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."song"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "song_favorite_user_id_idx" ON "song_favorite" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "song_favorite_user_created_at_idx" ON "song_favorite" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "song_favorite_song_id_idx" ON "song_favorite" USING btree ("song_id");--> statement-breakpoint
CREATE INDEX "song_play_user_id_idx" ON "song_play" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "song_play_user_created_at_idx" ON "song_play" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "song_play_song_id_idx" ON "song_play" USING btree ("song_id");