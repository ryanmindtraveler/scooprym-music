CREATE TABLE "scooprym"."cover_asset_checkpoint" (
  "id" text PRIMARY KEY NOT NULL,
  "song_id" text NOT NULL REFERENCES "scooprym"."song"("id") ON DELETE CASCADE,
  "image_source" text,
  "uploaded_asset" jsonb,
  "lease_token" text,
  "lease_until" timestamp with time zone,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
