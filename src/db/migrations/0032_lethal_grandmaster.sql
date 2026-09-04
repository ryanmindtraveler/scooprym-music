CREATE TABLE "scooprym"."song_creation_run" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"song_id" text,
	"status" text DEFAULT 'running' NOT NULL,
	"current_stage" text DEFAULT 'source_ready' NOT NULL,
	"workflow_version" integer DEFAULT 1 NOT NULL,
	"source_mode" text,
	"source_url" text,
	"source_text" text,
	"direction_prompt" text,
	"production_variant_id" text,
	"title" text,
	"summary" text,
	"lyrics" text,
	"lyric_workshop" jsonb,
	"input_hash" text,
	"last_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "scooprym"."song_creation_step" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"stage" text NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"attempt" integer DEFAULT 1 NOT NULL,
	"provider" text,
	"model" text,
	"output_metadata" jsonb,
	"error" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "scooprym"."song_creation_run" ADD CONSTRAINT "song_creation_run_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "scooprym"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scooprym"."song_creation_run" ADD CONSTRAINT "song_creation_run_song_id_song_id_fk" FOREIGN KEY ("song_id") REFERENCES "scooprym"."song"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scooprym"."song_creation_step" ADD CONSTRAINT "song_creation_step_run_id_song_creation_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "scooprym"."song_creation_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "song_creation_run_user_updated_idx" ON "scooprym"."song_creation_run" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "song_creation_run_song_idx" ON "scooprym"."song_creation_run" USING btree ("song_id");--> statement-breakpoint
CREATE INDEX "song_creation_run_status_updated_idx" ON "scooprym"."song_creation_run" USING btree ("status","updated_at");--> statement-breakpoint
CREATE INDEX "song_creation_step_run_started_idx" ON "scooprym"."song_creation_step" USING btree ("run_id","started_at");--> statement-breakpoint
CREATE INDEX "song_creation_step_run_stage_idx" ON "scooprym"."song_creation_step" USING btree ("run_id","stage");