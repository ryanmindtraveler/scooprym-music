CREATE TABLE "scooprym"."story_submission" (
	"id" text PRIMARY KEY NOT NULL,
	"source_url" text NOT NULL,
	"source_domain" text NOT NULL,
	"note" text NOT NULL,
	"submitted_by" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"submission_count" integer DEFAULT 1 NOT NULL,
	"candidate_id" text,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"last_submitted_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "story_submission_status_check" CHECK ("scooprym"."story_submission"."status" in ('pending', 'adopted', 'rejected')),
	CONSTRAINT "story_submission_url_length_check" CHECK (char_length("scooprym"."story_submission"."source_url") between 12 and 2048),
	CONSTRAINT "story_submission_note_length_check" CHECK (char_length(btrim("scooprym"."story_submission"."note")) between 10 and 280),
	CONSTRAINT "story_submission_count_check" CHECK ("scooprym"."story_submission"."submission_count" >= 1)
);
--> statement-breakpoint
ALTER TABLE "scooprym"."story_submission" ADD CONSTRAINT "story_submission_submitted_by_user_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "scooprym"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scooprym"."story_submission" ADD CONSTRAINT "story_submission_candidate_id_story_candidate_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "scooprym"."story_candidate"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scooprym"."story_submission" ADD CONSTRAINT "story_submission_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "scooprym"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "story_submission_source_url_unique" ON "scooprym"."story_submission" USING btree ("source_url");--> statement-breakpoint
CREATE INDEX "story_submission_status_submitted_idx" ON "scooprym"."story_submission" USING btree ("status","last_submitted_at");--> statement-breakpoint
CREATE INDEX "story_submission_submitter_idx" ON "scooprym"."story_submission" USING btree ("submitted_by");--> statement-breakpoint
CREATE INDEX "story_submission_candidate_idx" ON "scooprym"."story_submission" USING btree ("candidate_id");