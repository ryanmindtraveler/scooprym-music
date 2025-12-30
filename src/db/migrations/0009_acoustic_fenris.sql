ALTER TABLE "song" ADD COLUMN "credits_deducted" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "song" ADD COLUMN "processing_status" text DEFAULT 'processing';--> statement-breakpoint
ALTER TABLE "song" ADD COLUMN "credit_error" text;