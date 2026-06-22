CREATE SCHEMA IF NOT EXISTS "scooprym";
--> statement-breakpoint
REVOKE ALL ON SCHEMA "scooprym" FROM PUBLIC;
--> statement-breakpoint
ALTER TABLE IF EXISTS "public"."user" SET SCHEMA "scooprym";
--> statement-breakpoint
ALTER TABLE IF EXISTS "public"."session" SET SCHEMA "scooprym";
--> statement-breakpoint
ALTER TABLE IF EXISTS "public"."account" SET SCHEMA "scooprym";
--> statement-breakpoint
ALTER TABLE IF EXISTS "public"."verification" SET SCHEMA "scooprym";
--> statement-breakpoint
ALTER TABLE IF EXISTS "public"."payment" SET SCHEMA "scooprym";
--> statement-breakpoint
ALTER TABLE IF EXISTS "public"."user_credit" SET SCHEMA "scooprym";
--> statement-breakpoint
ALTER TABLE IF EXISTS "public"."credit_transaction" SET SCHEMA "scooprym";
--> statement-breakpoint
ALTER TABLE IF EXISTS "public"."song" SET SCHEMA "scooprym";
--> statement-breakpoint
ALTER TABLE IF EXISTS "public"."song_play" SET SCHEMA "scooprym";
--> statement-breakpoint
ALTER TABLE IF EXISTS "public"."song_favorite" SET SCHEMA "scooprym";
