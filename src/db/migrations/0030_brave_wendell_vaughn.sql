ALTER TABLE "scooprym"."story_submission" ADD COLUMN "source_title" text;--> statement-breakpoint
ALTER TABLE "scooprym"."story_submission" ADD COLUMN "source_description" text;--> statement-breakpoint
ALTER TABLE "scooprym"."story_submission" ADD COLUMN "source_image_url" text;--> statement-breakpoint
ALTER TABLE "scooprym"."story_submission" ADD COLUMN "source_published_at" timestamp;--> statement-breakpoint
ALTER TABLE "scooprym"."story_submission" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "scooprym"."story_submission" ADD CONSTRAINT "story_submission_rejection_reason_check" CHECK ("scooprym"."story_submission"."rejection_reason" is null or char_length(btrim("scooprym"."story_submission"."rejection_reason")) between 4 and 280);