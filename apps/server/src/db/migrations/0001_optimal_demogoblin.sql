ALTER TABLE "ikki"."users" ADD COLUMN "isDeleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ikki"."users" ADD COLUMN "lastLoginAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "ikki"."users" ADD COLUMN "deletedAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "ikki"."locations" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "ikki"."locations" ADD COLUMN "city" varchar(100);--> statement-breakpoint
ALTER TABLE "ikki"."locations" ADD COLUMN "province" varchar(100);--> statement-breakpoint
ALTER TABLE "ikki"."locations" ADD COLUMN "postalCode" varchar(20);--> statement-breakpoint
ALTER TABLE "ikki"."locations" ADD COLUMN "phone" varchar(50);--> statement-breakpoint
ALTER TABLE "ikki"."locations" ADD COLUMN "email" varchar(255);--> statement-breakpoint
ALTER TABLE "ikki"."locations" ADD COLUMN "isActive" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "ikki"."locations" ADD COLUMN "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;