ALTER TABLE "masterialCategories" RENAME TO "materialCategories";--> statement-breakpoint
ALTER TABLE "masterials" RENAME TO "materials";--> statement-breakpoint
ALTER TABLE "materials" DROP CONSTRAINT "masterials_name_unique";--> statement-breakpoint
ALTER TABLE "materials" DROP CONSTRAINT "masterials_sku_unique";--> statement-breakpoint
ALTER TABLE "materials" DROP CONSTRAINT "masterials_categoryId_masterialCategories_id_fk";
--> statement-breakpoint
ALTER TABLE "materials" DROP CONSTRAINT "masterials_baseUomCode_uoms_code_fk";
--> statement-breakpoint
ALTER TABLE "materialUomConversions" DROP CONSTRAINT "materialUomConversions_materialId_masterials_id_fk";
--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_categoryId_materialCategories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."materialCategories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_baseUomCode_uoms_code_fk" FOREIGN KEY ("baseUomCode") REFERENCES "public"."uoms"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materialUomConversions" ADD CONSTRAINT "materialUomConversions_materialId_materials_id_fk" FOREIGN KEY ("materialId") REFERENCES "public"."materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_sku_unique" UNIQUE("sku");