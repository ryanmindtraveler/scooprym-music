CREATE TABLE "scooprym"."song_reaction" (
	"id" text PRIMARY KEY NOT NULL,
	"song_id" text NOT NULL,
	"actor_key" text NOT NULL,
	"reaction_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "song_reaction_type_check" CHECK ("scooprym"."song_reaction"."reaction_type" in ('clown', 'dead', 'popcorn', 'eyes', 'receipts'))
);
--> statement-breakpoint
ALTER TABLE "scooprym"."song_reaction" ADD CONSTRAINT "song_reaction_song_id_song_id_fk" FOREIGN KEY ("song_id") REFERENCES "scooprym"."song"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "song_reaction_song_actor_unique" ON "scooprym"."song_reaction" USING btree ("song_id","actor_key");
--> statement-breakpoint
CREATE INDEX "song_reaction_song_type_idx" ON "scooprym"."song_reaction" USING btree ("song_id","reaction_type");
--> statement-breakpoint
ALTER TABLE "scooprym"."song_reaction" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON TABLE "scooprym"."song_reaction" FROM PUBLIC, anon, authenticated;
