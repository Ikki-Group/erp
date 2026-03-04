CREATE TYPE "product_status" AS ENUM('active', 'inactive', 'archived');--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"description" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" serial PRIMARY KEY,
	"productId" integer NOT NULL,
	"name" text NOT NULL,
	"sku" text,
	"isDefault" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"description" text,
	"sku" text NOT NULL,
	"outletId" integer NOT NULL,
	"categoryId" integer,
	"status" "product_status" DEFAULT 'active'::"product_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sales_types" (
	"id" serial PRIMARY KEY,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "variant_prices" (
	"id" serial PRIMARY KEY,
	"variantId" integer NOT NULL,
	"salesTypeId" integer NOT NULL,
	"price" numeric(18,4) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX "product_categories_name_idx" ON "product_categories" ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variants_product_name_idx" ON "product_variants" ("productId","name");--> statement-breakpoint
CREATE UNIQUE INDEX "products_sku_outlet_idx" ON "products" ("sku","outletId");--> statement-breakpoint
CREATE UNIQUE INDEX "products_name_outlet_idx" ON "products" ("name","outletId");--> statement-breakpoint
CREATE INDEX "products_outlet_idx" ON "products" ("outletId");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" ("categoryId");--> statement-breakpoint
CREATE UNIQUE INDEX "sales_types_code_idx" ON "sales_types" ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "variant_prices_variant_sales_type_idx" ON "variant_prices" ("variantId","salesTypeId");--> statement-breakpoint
CREATE INDEX "variant_prices_sales_type_idx" ON "variant_prices" ("salesTypeId");--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_products_id_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_outletId_locations_id_fkey" FOREIGN KEY ("outletId") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_product_categories_id_fkey" FOREIGN KEY ("categoryId") REFERENCES "product_categories"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "variant_prices" ADD CONSTRAINT "variant_prices_variantId_product_variants_id_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "variant_prices" ADD CONSTRAINT "variant_prices_salesTypeId_sales_types_id_fkey" FOREIGN KEY ("salesTypeId") REFERENCES "sales_types"("id") ON DELETE RESTRICT;