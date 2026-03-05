ALTER TABLE "material_conversions" ADD COLUMN "uomId" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "baseUomId" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "material_conversions" DROP COLUMN "uom";--> statement-breakpoint
ALTER TABLE "materials" DROP COLUMN "baseUom";--> statement-breakpoint
DROP INDEX "material_conversions_material_uom_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "material_conversions_material_uom_idx" ON "material_conversions" ("materialId","uomId");--> statement-breakpoint
CREATE INDEX "materials_base_uom_idx" ON "materials" ("baseUomId");--> statement-breakpoint
ALTER TABLE "material_conversions" ADD CONSTRAINT "material_conversions_uomId_uoms_id_fkey" FOREIGN KEY ("uomId") REFERENCES "uoms"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_baseUomId_uoms_id_fkey" FOREIGN KEY ("baseUomId") REFERENCES "uoms"("id") ON DELETE RESTRICT;