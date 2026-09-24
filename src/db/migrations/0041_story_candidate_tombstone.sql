CREATE TABLE IF NOT EXISTS "scooprym"."story_candidate_tombstone" (
  "source_url" text PRIMARY KEY NOT NULL,
  "deleted_at" timestamp with time zone DEFAULT now() NOT NULL
);
