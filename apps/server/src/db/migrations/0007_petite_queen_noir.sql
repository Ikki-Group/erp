ALTER TABLE "sessions" ADD COLUMN "user_agent" varchar(500);--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "ip_address" varchar(100);--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "last_seen_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "revoked_at" timestamp with time zone;