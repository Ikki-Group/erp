ALTER TABLE "recipe_items" ADD COLUMN "scrapPercentage" numeric(5,2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "recipe_items" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "recipe_items" ADD COLUMN "sortOrder" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "productId" integer;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "isActive" boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "recipes_product_idx" ON "recipes" ("productId") WHERE "productId" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_productId_products_id_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "recipes" DROP CONSTRAINT "recipe_target_chk", ADD CONSTRAINT "recipe_target_chk" CHECK (num_nonnulls("materialId", "productId", "productVariantId") = 1);