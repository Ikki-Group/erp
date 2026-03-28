ALTER TABLE "locations" ADD COLUMN "classification" "location_classification" DEFAULT 'physical'::"location_classification" NOT NULL;--> statement-breakpoint
ALTER TABLE "product_categories" ADD COLUMN "parentId" uuid;--> statement-breakpoint
DROP INDEX "locations_code_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "locations_code_idx" ON "locations" ("code") WHERE ("deletedAt" is null);--> statement-breakpoint
DROP INDEX "locations_name_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "locations_name_idx" ON "locations" ("name") WHERE ("deletedAt" is null);--> statement-breakpoint
DROP INDEX "product_categories_name_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "product_categories_name_idx" ON "product_categories" ("name") WHERE ("deletedAt" is null);--> statement-breakpoint
DROP INDEX "products_sku_location_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "products_sku_location_idx" ON "products" ("sku","locationId") WHERE ("deletedAt" is null);--> statement-breakpoint
DROP INDEX "products_name_location_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "products_name_location_idx" ON "products" ("name","locationId") WHERE ("deletedAt" is null);--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_parentId_product_categories_id_fkey" FOREIGN KEY ("parentId") REFERENCES "product_categories"("id") ON DELETE SET NULL;