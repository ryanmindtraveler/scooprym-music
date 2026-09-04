CREATE TABLE IF NOT EXISTS "scooprym"."radar_creation_job" (
  "candidate_id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "run_id" text NOT NULL,
  "song_id" text NOT NULL,
  "source_url" text NOT NULL,
  "source_title" text NOT NULL,
  "direction" text NOT NULL,
  "status" text DEFAULT 'queued' NOT NULL,
  "sequence" integer DEFAULT 0 NOT NULL,
  "lease_id" text,
  "lease_until" timestamp with time zone,
  "lyric_result" jsonb,
  "error" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "radar_creation_job_run_id_unique" UNIQUE("run_id"),
  CONSTRAINT "radar_creation_job_song_id_unique" UNIQUE("song_id")
);
