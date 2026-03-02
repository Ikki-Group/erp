ALTER TABLE "materials" ADD COLUMN "type" "material_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "materials" DROP COLUMN "isActive";