ALTER TABLE "products" DROP CONSTRAINT "products_outletId_locations_id_fkey";--> statement-breakpoint
DROP INDEX "products_sku_outlet_idx";--> statement-breakpoint
DROP INDEX "products_name_outlet_idx";--> statement-breakpoint
DROP INDEX "products_outlet_idx";--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "basePrice" numeric(18,4) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "locationId" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variants" DROP COLUMN "sku";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "outletId";--> statement-breakpoint
CREATE UNIQUE INDEX "products_sku_location_idx" ON "products" ("sku","locationId");--> statement-breakpoint
CREATE UNIQUE INDEX "products_name_location_idx" ON "products" ("name","locationId");--> statement-breakpoint
CREATE INDEX "products_location_idx" ON "products" ("locationId");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_locationId_locations_id_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT;