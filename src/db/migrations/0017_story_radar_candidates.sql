CREATE TABLE "scooprym"."story_candidate" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text DEFAULT 'gdelt' NOT NULL,
	"source_url" text NOT NULL,
	"source_title" text NOT NULL,
	"source_domain" text NOT NULL,
	"source_image_url" text,
	"category" text NOT NULL,
	"matched_terms" text,
	"relevance_score" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "story_candidate_category_check" CHECK ("scooprym"."story_candidate"."category" in ('celebrity_drama', 'internet_chaos', 'absurd_headlines')),
	CONSTRAINT "story_candidate_status_check" CHECK ("scooprym"."story_candidate"."status" in ('new', 'shortlisted', 'dismissed'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "story_candidate_source_url_unique" ON "scooprym"."story_candidate" USING btree ("source_url");--> statement-breakpoint
CREATE INDEX "story_candidate_status_published_idx" ON "scooprym"."story_candidate" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "story_candidate_category_idx" ON "scooprym"."story_candidate" USING btree ("category");