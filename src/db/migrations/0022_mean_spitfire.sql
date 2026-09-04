DROP INDEX "scooprym"."story_candidate_vote_candidate_user_unique";--> statement-breakpoint
ALTER TABLE "scooprym"."story_candidate_vote" ADD COLUMN "vote_day" text;--> statement-breakpoint
UPDATE "scooprym"."story_candidate_vote" SET "vote_day" = to_char("created_at", 'YYYY-MM-DD');--> statement-breakpoint
ALTER TABLE "scooprym"."story_candidate_vote" ALTER COLUMN "vote_day" SET NOT NULL;--> statement-breakpoint
DELETE FROM "scooprym"."story_candidate_vote"
WHERE "id" IN (
	SELECT "id" FROM (
		SELECT "id", row_number() OVER (PARTITION BY "user_id", "vote_day" ORDER BY "updated_at" DESC, "id" DESC) AS "row_number"
		FROM "scooprym"."story_candidate_vote"
	) AS "ranked_votes"
	WHERE "row_number" > 1
);--> statement-breakpoint
CREATE UNIQUE INDEX "story_candidate_vote_user_day_unique" ON "scooprym"."story_candidate_vote" USING btree ("user_id","vote_day");
