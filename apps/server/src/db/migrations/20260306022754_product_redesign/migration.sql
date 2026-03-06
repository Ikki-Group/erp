CREATE TABLE "product_external_mappings" (
	"id" serial PRIMARY KEY,
	"productId" integer NOT NULL,
	"variantId" integer,
	"provider" text NOT NULL,
	"externalId" text NOT NULL,
	"externalData" jsonb,
	"lastSyncedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "product_prices" (
	"id" serial PRIMARY KEY,
	"productId" integer NOT NULL,
	"salesTypeId" integer NOT NULL,
	"price" numeric(18,4) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "sku" text;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "basePrice" numeric(18,4) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "hasVariants" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "hasSalesTypePricing" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "recipe_items" ADD COLUMN "uomId" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "recipe_items" DROP COLUMN "uom";--> statement-breakpoint
CREATE UNIQUE INDEX "product_ext_map_provider_ext_id_idx" ON "product_external_mappings" ("provider","externalId");--> statement-breakpoint
CREATE UNIQUE INDEX "product_ext_map_provider_product_variant_idx" ON "product_external_mappings" ("provider","productId","variantId");--> statement-breakpoint
CREATE INDEX "product_ext_map_product_idx" ON "product_external_mappings" ("productId");--> statement-breakpoint
CREATE INDEX "product_ext_map_provider_idx" ON "product_external_mappings" ("provider");--> statement-breakpoint
CREATE UNIQUE INDEX "product_prices_product_sales_type_idx" ON "product_prices" ("productId","salesTypeId");--> statement-breakpoint
CREATE INDEX "product_prices_sales_type_idx" ON "product_prices" ("salesTypeId");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variants_sku_idx" ON "product_variants" ("productId","sku") WHERE "sku" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "products_status_idx" ON "products" ("status");--> statement-breakpoint
ALTER TABLE "product_external_mappings" ADD CONSTRAINT "product_external_mappings_productId_products_id_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product_external_mappings" ADD CONSTRAINT "product_external_mappings_variantId_product_variants_id_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_productId_products_id_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_salesTypeId_sales_types_id_fkey" FOREIGN KEY ("salesTypeId") REFERENCES "sales_types"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_uomId_uoms_id_fkey" FOREIGN KEY ("uomId") REFERENCES "uoms"("id");