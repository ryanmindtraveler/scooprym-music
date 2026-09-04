ALTER TABLE "scooprym"."story_candidate" DROP CONSTRAINT "story_candidate_status_check";--> statement-breakpoint
ALTER TABLE "scooprym"."story_candidate" ADD COLUMN "story_id" text;--> statement-breakpoint
ALTER TABLE "scooprym"."story_candidate" ADD COLUMN "adopted_at" timestamp;--> statement-breakpoint
ALTER TABLE "scooprym"."story_candidate" ADD CONSTRAINT "story_candidate_story_id_story_id_fk" FOREIGN KEY ("story_id") REFERENCES "scooprym"."story"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "story_candidate_story_id_idx" ON "scooprym"."story_candidate" USING btree ("story_id");--> statement-breakpoint
ALTER TABLE "scooprym"."story_candidate" ADD CONSTRAINT "story_candidate_status_check" CHECK ("scooprym"."story_candidate"."status" in ('new', 'shortlisted', 'adopted', 'dismissed'));