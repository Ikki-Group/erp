ALTER TABLE "location_materials" ADD COLUMN "totalValue" numeric(20, 6) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "material_uoms" ADD COLUMN "conversionFactor" numeric(20, 6) NOT NULL;