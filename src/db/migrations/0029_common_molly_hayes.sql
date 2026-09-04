ALTER TABLE "scooprym"."story_submission" DROP CONSTRAINT "story_submission_url_length_check";--> statement-breakpoint
ALTER TABLE "scooprym"."story_submission" DROP CONSTRAINT "story_submission_note_length_check";--> statement-breakpoint
ALTER TABLE "scooprym"."story_submission" ALTER COLUMN "source_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "scooprym"."story_submission" ALTER COLUMN "source_domain" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "scooprym"."story_submission" ALTER COLUMN "note" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "scooprym"."story_submission" ADD CONSTRAINT "story_submission_content_check" CHECK ("scooprym"."story_submission"."source_url" is not null or "scooprym"."story_submission"."note" is not null);--> statement-breakpoint
ALTER TABLE "scooprym"."story_submission" ADD CONSTRAINT "story_submission_url_length_check" CHECK ("scooprym"."story_submission"."source_url" is null or char_length("scooprym"."story_submission"."source_url") between 12 and 2048);--> statement-breakpoint
ALTER TABLE "scooprym"."story_submission" ADD CONSTRAINT "story_submission_note_length_check" CHECK ("scooprym"."story_submission"."note" is null or char_length(btrim("scooprym"."story_submission"."note")) between 10 and 280);