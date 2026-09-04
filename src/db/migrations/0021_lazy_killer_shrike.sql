CREATE TABLE "scooprym"."story_candidate_vote" (
	"id" text PRIMARY KEY NOT NULL,
	"candidate_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scooprym"."story_candidate_vote" ADD CONSTRAINT "story_candidate_vote_candidate_id_story_candidate_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "scooprym"."story_candidate"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scooprym"."story_candidate_vote" ADD CONSTRAINT "story_candidate_vote_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "scooprym"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "story_candidate_vote_candidate_created_idx" ON "scooprym"."story_candidate_vote" USING btree ("candidate_id","created_at");--> statement-breakpoint
CREATE INDEX "story_candidate_vote_user_created_idx" ON "scooprym"."story_candidate_vote" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "story_candidate_vote_candidate_user_unique" ON "scooprym"."story_candidate_vote" USING btree ("candidate_id","user_id");