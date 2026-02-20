ALTER TABLE "locations" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."location_type";--> statement-breakpoint
CREATE TYPE "public"."location_type" AS ENUM('store', 'warehouse');--> statement-breakpoint
ALTER TABLE "locations" ALTER COLUMN "type" SET DATA TYPE "public"."location_type" USING "type"::"public"."location_type";