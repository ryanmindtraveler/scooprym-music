CREATE TABLE IF NOT EXISTS "scooprym"."hot_sheet_edition" (
	"day" text PRIMARY KEY NOT NULL,
	"status" text NOT NULL,
	"attempt_id" text NOT NULL,
	"stories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"discovered" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"error" text
);
