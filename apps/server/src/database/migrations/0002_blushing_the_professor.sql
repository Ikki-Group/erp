CREATE TYPE "ikki-dev"."location_type" AS ENUM('OFFICE', 'WAREHOUSE', 'STORE', 'FACTORY');--> statement-breakpoint
CREATE TYPE "ikki-dev"."material_type" AS ENUM('raw', 'semi');--> statement-breakpoint
ALTER TABLE "ikki-dev"."locations" ALTER COLUMN "type" SET DATA TYPE "ikki-dev"."location_type" USING "type"::"ikki-dev"."location_type";--> statement-breakpoint
ALTER TABLE "ikki-dev"."materials" ALTER COLUMN "type" SET DATA TYPE "ikki-dev"."material_type" USING "type"::"ikki-dev"."material_type";