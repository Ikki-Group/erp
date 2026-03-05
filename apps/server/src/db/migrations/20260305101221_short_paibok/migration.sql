CREATE TABLE "recipe_items" (
	"id" serial PRIMARY KEY,
	"recipeId" integer NOT NULL,
	"materialId" integer NOT NULL,
	"qty" numeric(18,4) NOT NULL,
	"uom" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" serial PRIMARY KEY,
	"materialId" integer,
	"productVariantId" integer,
	"targetQty" numeric(18,4) DEFAULT '1' NOT NULL,
	"instructions" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	"syncAt" timestamp with time zone,
	CONSTRAINT "recipe_target_chk" CHECK (num_nonnulls("materialId", "productVariantId") = 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "recipe_items_recipe_material_idx" ON "recipe_items" ("recipeId","materialId");--> statement-breakpoint
CREATE UNIQUE INDEX "recipes_material_idx" ON "recipes" ("materialId") WHERE "materialId" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "recipes_product_variant_idx" ON "recipes" ("productVariantId") WHERE "productVariantId" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_recipeId_recipes_id_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_materialId_materials_id_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_materialId_materials_id_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_productVariantId_product_variants_id_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id") ON DELETE CASCADE;