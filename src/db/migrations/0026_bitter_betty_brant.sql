CREATE TABLE "scooprym"."song_comment_report" (
	"id" text PRIMARY KEY NOT NULL,
	"comment_id" text NOT NULL,
	"reporter_id" text NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"handled_by" text,
	"handled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "song_comment_report_reason_check" CHECK ("scooprym"."song_comment_report"."reason" in ('spam', 'harassment', 'misinformation', 'other')),
	CONSTRAINT "song_comment_report_status_check" CHECK ("scooprym"."song_comment_report"."status" in ('pending', 'actioned', 'dismissed'))
);
--> statement-breakpoint
CREATE TABLE "scooprym"."song_engagement_event" (
	"id" text PRIMARY KEY NOT NULL,
	"song_id" text NOT NULL,
	"user_id" text,
	"actor_key" text NOT NULL,
	"event_session_id" text NOT NULL,
	"event_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "song_engagement_event_type_check" CHECK ("scooprym"."song_engagement_event"."event_type" in ('detail_view', 'play_start', 'play_qualified', 'play_complete', 'share'))
);
--> statement-breakpoint
ALTER TABLE "scooprym"."song_comment_report" ADD CONSTRAINT "song_comment_report_comment_id_song_comment_id_fk" FOREIGN KEY ("comment_id") REFERENCES "scooprym"."song_comment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scooprym"."song_comment_report" ADD CONSTRAINT "song_comment_report_reporter_id_user_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "scooprym"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scooprym"."song_comment_report" ADD CONSTRAINT "song_comment_report_handled_by_user_id_fk" FOREIGN KEY ("handled_by") REFERENCES "scooprym"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scooprym"."song_engagement_event" ADD CONSTRAINT "song_engagement_event_song_id_song_id_fk" FOREIGN KEY ("song_id") REFERENCES "scooprym"."song"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scooprym"."song_engagement_event" ADD CONSTRAINT "song_engagement_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "scooprym"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "song_comment_report_reporter_unique" ON "scooprym"."song_comment_report" USING btree ("comment_id","reporter_id");--> statement-breakpoint
CREATE INDEX "song_comment_report_status_created_idx" ON "scooprym"."song_comment_report" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "song_engagement_event_unique" ON "scooprym"."song_engagement_event" USING btree ("song_id","actor_key","event_session_id","event_type");--> statement-breakpoint
CREATE INDEX "song_engagement_event_type_created_idx" ON "scooprym"."song_engagement_event" USING btree ("event_type","created_at");--> statement-breakpoint
CREATE INDEX "song_engagement_event_song_created_idx" ON "scooprym"."song_engagement_event" USING btree ("song_id","created_at");