CREATE TABLE IF NOT EXISTS "scooprym"."story_radar_scan" (
  "id" text PRIMARY KEY NOT NULL,
  "status" text DEFAULT 'running' NOT NULL,
  "started_at" timestamp with time zone DEFAULT now() NOT NULL,
  "completed_at" timestamp with time zone,
  "discovered" integer DEFAULT 0 NOT NULL,
  "inserted" integer DEFAULT 0 NOT NULL,
  "updated" integer DEFAULT 0 NOT NULL,
  "sources" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "error" text
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "story_radar_scan_started_idx" ON "scooprym"."story_radar_scan" ("started_at");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "story_radar_scan_running_unique" ON "scooprym"."story_radar_scan" ("status") WHERE "status" = 'running';
