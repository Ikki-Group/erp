CREATE TYPE "location_type" AS ENUM('store', 'warehouse');--> statement-breakpoint
CREATE TYPE "material_type" AS ENUM('raw', 'semi', 'packaging');--> statement-breakpoint
CREATE TYPE "moka_scrap_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "moka_scrap_type" AS ENUM('sales', 'product', 'category');--> statement-breakpoint
CREATE TYPE "product_status" AS ENUM('active', 'inactive', 'archived');--> statement-breakpoint
CREATE TYPE "sales_order_status" AS ENUM('open', 'closed', 'void');--> statement-breakpoint
CREATE TYPE "transaction_type" AS ENUM('purchase', 'transfer_in', 'transfer_out', 'adjustment', 'sell', 'production_in', 'production_out');--> statement-breakpoint
CREATE TABLE "locations" (
	"id" serial PRIMARY KEY,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"type" "location_type" NOT NULL,
	"classification" "location_classification" DEFAULT 'physical'::"location_classification" NOT NULL,
	"address" text,
	"phone" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "material_categories" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"description" text,
	"parentId" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "material_conversions" (
	"id" serial PRIMARY KEY,
	"materialId" integer NOT NULL,
	"uomId" integer NOT NULL,
	"toBaseFactor" numeric(18,6) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "material_locations" (
	"id" serial PRIMARY KEY,
	"materialId" integer NOT NULL,
	"locationId" integer NOT NULL,
	"minStock" numeric(18,4) DEFAULT '0' NOT NULL,
	"maxStock" numeric(18,4),
	"reorderPoint" numeric(18,4) DEFAULT '0' NOT NULL,
	"currentQty" numeric(18,4) DEFAULT '0' NOT NULL,
	"currentAvgCost" numeric(18,4) DEFAULT '0' NOT NULL,
	"currentValue" numeric(18,4) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"description" text,
	"sku" text NOT NULL,
	"type" "material_type" NOT NULL,
	"categoryId" integer,
	"baseUomId" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "moka_configurations" (
	"id" serial PRIMARY KEY,
	"locationId" integer NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"businessId" text,
	"outletId" text,
	"accessToken" text,
	"lastSyncedAt" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "moka_scrap_histories" (
	"id" serial PRIMARY KEY,
	"mokaConfigurationId" integer NOT NULL,
	"type" "moka_scrap_type" NOT NULL,
	"status" "moka_scrap_status" DEFAULT 'pending'::"moka_scrap_status" NOT NULL,
	"dateFrom" timestamp with time zone NOT NULL,
	"dateTo" timestamp with time zone NOT NULL,
	"rawPath" text,
	"errorMessage" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"description" text,
	"parentId" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "product_external_mappings" (
	"id" serial PRIMARY KEY,
	"productId" integer NOT NULL,
	"variantId" integer,
	"provider" text NOT NULL,
	"externalId" text NOT NULL,
	"externalData" jsonb,
	"lastSyncedAt" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "product_prices" (
	"id" serial PRIMARY KEY,
	"productId" integer NOT NULL,
	"salesTypeId" integer NOT NULL,
	"price" numeric(18,4) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" serial PRIMARY KEY,
	"productId" integer NOT NULL,
	"name" text NOT NULL,
	"sku" text,
	"isDefault" boolean DEFAULT false NOT NULL,
	"basePrice" numeric(18,4) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"description" text,
	"sku" text NOT NULL,
	"locationId" integer NOT NULL,
	"categoryId" integer,
	"status" "product_status" DEFAULT 'active'::"product_status" NOT NULL,
	"hasVariants" boolean DEFAULT false NOT NULL,
	"hasSalesTypePricing" boolean DEFAULT false NOT NULL,
	"basePrice" numeric(18,4) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "recipe_items" (
	"id" serial PRIMARY KEY,
	"recipeId" integer NOT NULL,
	"materialId" integer NOT NULL,
	"qty" numeric(18,4) NOT NULL,
	"scrapPercentage" numeric(5,2) DEFAULT '0' NOT NULL,
	"uomId" integer NOT NULL,
	"notes" text,
	"sortOrder" numeric(5,0) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" serial PRIMARY KEY,
	"materialId" integer,
	"productId" integer,
	"productVariantId" integer,
	"targetQty" numeric(18,4) DEFAULT '1' NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"instructions" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone,
	CONSTRAINT "recipe_target_chk" CHECK (num_nonnulls("materialId", "productId", "productVariantId") = 1)
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"permissions" text[] DEFAULT '{}'::text[] NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sales_external_refs" (
	"id" serial PRIMARY KEY,
	"orderId" integer NOT NULL,
	"externalSource" text NOT NULL,
	"externalOrderId" text NOT NULL,
	"rawPayload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sales_order_batches" (
	"id" serial PRIMARY KEY,
	"orderId" integer NOT NULL,
	"batchNumber" numeric(5,0) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sales_order_items" (
	"id" serial PRIMARY KEY,
	"orderId" integer NOT NULL,
	"batchId" integer,
	"productId" integer,
	"variantId" integer,
	"itemName" text NOT NULL,
	"quantity" numeric(18,4) DEFAULT '1' NOT NULL,
	"unitPrice" numeric(18,2) DEFAULT '0' NOT NULL,
	"discountAmount" numeric(18,2) DEFAULT '0' NOT NULL,
	"taxAmount" numeric(18,2) DEFAULT '0' NOT NULL,
	"subtotal" numeric(18,2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sales_orders" (
	"id" serial PRIMARY KEY,
	"locationId" integer NOT NULL,
	"customerId" integer,
	"salesTypeId" integer NOT NULL,
	"status" "sales_order_status" DEFAULT 'open'::"sales_order_status" NOT NULL,
	"transactionDate" timestamp with time zone DEFAULT now() NOT NULL,
	"totalAmount" numeric(18,2) DEFAULT '0' NOT NULL,
	"discountAmount" numeric(18,2) DEFAULT '0' NOT NULL,
	"taxAmount" numeric(18,2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sales_types" (
	"id" serial PRIMARY KEY,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"isSystem" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sales_voids" (
	"id" serial PRIMARY KEY,
	"orderId" integer NOT NULL,
	"itemId" integer,
	"reason" text,
	"voidedBy" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expired_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_summaries" (
	"id" serial PRIMARY KEY,
	"materialId" integer NOT NULL,
	"locationId" integer NOT NULL,
	"date" date NOT NULL,
	"openingQty" numeric(18,4) DEFAULT '0' NOT NULL,
	"openingAvgCost" numeric(18,2) DEFAULT '0' NOT NULL,
	"openingValue" numeric(18,2) DEFAULT '0' NOT NULL,
	"purchaseQty" numeric(18,4) DEFAULT '0' NOT NULL,
	"purchaseValue" numeric(18,2) DEFAULT '0' NOT NULL,
	"transferInQty" numeric(18,4) DEFAULT '0' NOT NULL,
	"transferInValue" numeric(18,2) DEFAULT '0' NOT NULL,
	"transferOutQty" numeric(18,4) DEFAULT '0' NOT NULL,
	"transferOutValue" numeric(18,2) DEFAULT '0' NOT NULL,
	"adjustmentQty" numeric(18,4) DEFAULT '0' NOT NULL,
	"adjustmentValue" numeric(18,2) DEFAULT '0' NOT NULL,
	"sellQty" numeric(18,4) DEFAULT '0' NOT NULL,
	"sellValue" numeric(18,2) DEFAULT '0' NOT NULL,
	"closingQty" numeric(18,4) DEFAULT '0' NOT NULL,
	"closingAvgCost" numeric(18,2) DEFAULT '0' NOT NULL,
	"closingValue" numeric(18,2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "stock_transactions" (
	"id" serial PRIMARY KEY,
	"materialId" integer NOT NULL,
	"locationId" integer NOT NULL,
	"type" "transaction_type" NOT NULL,
	"date" date NOT NULL,
	"referenceNo" text NOT NULL,
	"notes" text,
	"qty" numeric(18,4) NOT NULL,
	"unitCost" numeric(18,2) NOT NULL,
	"totalCost" numeric(18,2) NOT NULL,
	"counterpartLocationId" integer,
	"transferId" integer,
	"runningQty" numeric(18,4) NOT NULL,
	"runningAvgCost" numeric(18,2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "uoms" (
	"id" serial PRIMARY KEY,
	"code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_assignments" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL,
	"role_id" integer NOT NULL,
	"location_id" integer NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY,
	"email" text NOT NULL,
	"username" text NOT NULL,
	"fullname" text NOT NULL,
	"password_hash" text NOT NULL,
	"pin_code" text,
	"is_root" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "variant_prices" (
	"id" serial PRIMARY KEY,
	"variantId" integer NOT NULL,
	"salesTypeId" integer NOT NULL,
	"price" numeric(18,4) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX "locations_code_idx" ON "locations" ("code") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE UNIQUE INDEX "locations_name_idx" ON "locations" ("name") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE UNIQUE INDEX "material_categories_name_idx" ON "material_categories" ("name") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE UNIQUE INDEX "material_conversions_material_uom_idx" ON "material_conversions" ("materialId","uomId") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE INDEX "material_conversions_uom_idx" ON "material_conversions" ("uomId");--> statement-breakpoint
CREATE UNIQUE INDEX "material_locations_material_location_idx" ON "material_locations" ("materialId","locationId") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE INDEX "material_locations_location_idx" ON "material_locations" ("locationId");--> statement-breakpoint
CREATE UNIQUE INDEX "materials_name_idx" ON "materials" ("name") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE UNIQUE INDEX "materials_sku_idx" ON "materials" ("sku") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE INDEX "materials_category_idx" ON "materials" ("categoryId");--> statement-breakpoint
CREATE INDEX "materials_base_uom_idx" ON "materials" ("baseUomId");--> statement-breakpoint
CREATE UNIQUE INDEX "product_categories_name_idx" ON "product_categories" ("name") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE UNIQUE INDEX "product_ext_map_provider_ext_id_idx" ON "product_external_mappings" ("provider","externalId");--> statement-breakpoint
CREATE UNIQUE INDEX "product_ext_map_provider_product_variant_idx" ON "product_external_mappings" ("provider","productId","variantId");--> statement-breakpoint
CREATE INDEX "product_ext_map_product_idx" ON "product_external_mappings" ("productId");--> statement-breakpoint
CREATE INDEX "product_ext_map_provider_idx" ON "product_external_mappings" ("provider");--> statement-breakpoint
CREATE UNIQUE INDEX "product_prices_product_sales_type_idx" ON "product_prices" ("productId","salesTypeId");--> statement-breakpoint
CREATE INDEX "product_prices_sales_type_idx" ON "product_prices" ("salesTypeId");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variants_product_name_idx" ON "product_variants" ("productId","name");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variants_sku_idx" ON "product_variants" ("productId","sku") WHERE "sku" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "products_sku_location_idx" ON "products" ("sku","locationId") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE UNIQUE INDEX "products_name_location_idx" ON "products" ("name","locationId") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE INDEX "products_location_idx" ON "products" ("locationId");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" ("categoryId");--> statement-breakpoint
CREATE INDEX "products_status_idx" ON "products" ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "recipe_items_recipe_material_idx" ON "recipe_items" ("recipeId","materialId") WHERE "deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "recipe_items_material_idx" ON "recipe_items" ("materialId");--> statement-breakpoint
CREATE INDEX "recipe_items_uom_idx" ON "recipe_items" ("uomId");--> statement-breakpoint
CREATE UNIQUE INDEX "recipes_material_idx" ON "recipes" ("materialId") WHERE "materialId" IS NOT NULL AND "deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "recipes_product_idx" ON "recipes" ("productId") WHERE "productId" IS NOT NULL AND "deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "recipes_product_variant_idx" ON "recipes" ("productVariantId") WHERE "productVariantId" IS NOT NULL AND "deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "roles_code_idx" ON "roles" ("code") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE UNIQUE INDEX "roles_name_idx" ON "roles" ("name") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE UNIQUE INDEX "sales_external_refs_source_ext_id_idx" ON "sales_external_refs" ("externalSource","externalOrderId");--> statement-breakpoint
CREATE INDEX "sales_external_refs_order_idx" ON "sales_external_refs" ("orderId");--> statement-breakpoint
CREATE INDEX "sales_order_batches_order_idx" ON "sales_order_batches" ("orderId");--> statement-breakpoint
CREATE INDEX "sales_order_items_order_idx" ON "sales_order_items" ("orderId");--> statement-breakpoint
CREATE INDEX "sales_order_items_product_idx" ON "sales_order_items" ("productId");--> statement-breakpoint
CREATE INDEX "sales_order_items_variant_idx" ON "sales_order_items" ("variantId");--> statement-breakpoint
CREATE INDEX "sales_order_items_batch_idx" ON "sales_order_items" ("batchId");--> statement-breakpoint
CREATE INDEX "sales_orders_location_idx" ON "sales_orders" ("locationId");--> statement-breakpoint
CREATE INDEX "sales_orders_status_idx" ON "sales_orders" ("status");--> statement-breakpoint
CREATE INDEX "sales_orders_transaction_date_idx" ON "sales_orders" ("transactionDate");--> statement-breakpoint
CREATE UNIQUE INDEX "sales_types_code_idx" ON "sales_types" ("code");--> statement-breakpoint
CREATE INDEX "sales_voids_order_idx" ON "sales_voids" ("orderId");--> statement-breakpoint
CREATE INDEX "sales_voids_item_idx" ON "sales_voids" ("itemId");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expired_at_idx" ON "sessions" ("expired_at");--> statement-breakpoint
CREATE UNIQUE INDEX "stock_summaries_material_location_date_idx" ON "stock_summaries" ("materialId","locationId","date") WHERE "deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "stock_summaries_location_date_idx" ON "stock_summaries" ("locationId","date");--> statement-breakpoint
CREATE INDEX "stock_summaries_date_idx" ON "stock_summaries" ("date");--> statement-breakpoint
CREATE INDEX "stock_txn_material_location_date_idx" ON "stock_transactions" ("materialId","locationId","date");--> statement-breakpoint
CREATE INDEX "stock_txn_location_date_idx" ON "stock_transactions" ("locationId","date");--> statement-breakpoint
CREATE INDEX "stock_txn_type_date_idx" ON "stock_transactions" ("type","date");--> statement-breakpoint
CREATE INDEX "stock_txn_transfer_idx" ON "stock_transactions" ("transferId");--> statement-breakpoint
CREATE INDEX "stock_txn_reference_no_idx" ON "stock_transactions" ("referenceNo");--> statement-breakpoint
CREATE UNIQUE INDEX "uoms_code_idx" ON "uoms" ("code") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE INDEX "user_assignments_user_idx" ON "user_assignments" ("user_id");--> statement-breakpoint
CREATE INDEX "user_assignments_role_idx" ON "user_assignments" ("role_id");--> statement-breakpoint
CREATE INDEX "user_assignments_location_idx" ON "user_assignments" ("location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_assignments_user_role_location_idx" ON "user_assignments" ("user_id","role_id","location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" ("email") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_idx" ON "users" ("username") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE UNIQUE INDEX "variant_prices_variant_sales_type_idx" ON "variant_prices" ("variantId","salesTypeId");--> statement-breakpoint
CREATE INDEX "variant_prices_sales_type_idx" ON "variant_prices" ("salesTypeId");--> statement-breakpoint
ALTER TABLE "material_categories" ADD CONSTRAINT "material_categories_parentId_material_categories_id_fkey" FOREIGN KEY ("parentId") REFERENCES "material_categories"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "material_conversions" ADD CONSTRAINT "material_conversions_materialId_materials_id_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "material_conversions" ADD CONSTRAINT "material_conversions_uomId_uoms_id_fkey" FOREIGN KEY ("uomId") REFERENCES "uoms"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "material_locations" ADD CONSTRAINT "material_locations_materialId_materials_id_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "material_locations" ADD CONSTRAINT "material_locations_locationId_locations_id_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_categoryId_material_categories_id_fkey" FOREIGN KEY ("categoryId") REFERENCES "material_categories"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_baseUomId_uoms_id_fkey" FOREIGN KEY ("baseUomId") REFERENCES "uoms"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_parentId_product_categories_id_fkey" FOREIGN KEY ("parentId") REFERENCES "product_categories"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "product_external_mappings" ADD CONSTRAINT "product_external_mappings_productId_products_id_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product_external_mappings" ADD CONSTRAINT "product_external_mappings_variantId_product_variants_id_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_productId_products_id_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_salesTypeId_sales_types_id_fkey" FOREIGN KEY ("salesTypeId") REFERENCES "sales_types"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_products_id_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_locationId_locations_id_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_product_categories_id_fkey" FOREIGN KEY ("categoryId") REFERENCES "product_categories"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_recipeId_recipes_id_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_materialId_materials_id_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_uomId_uoms_id_fkey" FOREIGN KEY ("uomId") REFERENCES "uoms"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_materialId_materials_id_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_productId_products_id_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_productVariantId_product_variants_id_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sales_external_refs" ADD CONSTRAINT "sales_external_refs_orderId_sales_orders_id_fkey" FOREIGN KEY ("orderId") REFERENCES "sales_orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sales_order_batches" ADD CONSTRAINT "sales_order_batches_orderId_sales_orders_id_fkey" FOREIGN KEY ("orderId") REFERENCES "sales_orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_orderId_sales_orders_id_fkey" FOREIGN KEY ("orderId") REFERENCES "sales_orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_batchId_sales_order_batches_id_fkey" FOREIGN KEY ("batchId") REFERENCES "sales_order_batches"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_productId_products_id_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_variantId_product_variants_id_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_locationId_locations_id_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_salesTypeId_sales_types_id_fkey" FOREIGN KEY ("salesTypeId") REFERENCES "sales_types"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "sales_voids" ADD CONSTRAINT "sales_voids_orderId_sales_orders_id_fkey" FOREIGN KEY ("orderId") REFERENCES "sales_orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sales_voids" ADD CONSTRAINT "sales_voids_itemId_sales_order_items_id_fkey" FOREIGN KEY ("itemId") REFERENCES "sales_order_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "stock_summaries" ADD CONSTRAINT "stock_summaries_materialId_materials_id_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "stock_summaries" ADD CONSTRAINT "stock_summaries_locationId_locations_id_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_materialId_materials_id_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_locationId_locations_id_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_counterpartLocationId_locations_id_fkey" FOREIGN KEY ("counterpartLocationId") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "user_assignments" ADD CONSTRAINT "user_assignments_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_assignments" ADD CONSTRAINT "user_assignments_role_id_roles_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "user_assignments" ADD CONSTRAINT "user_assignments_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "variant_prices" ADD CONSTRAINT "variant_prices_variantId_product_variants_id_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "variant_prices" ADD CONSTRAINT "variant_prices_salesTypeId_sales_types_id_fkey" FOREIGN KEY ("salesTypeId") REFERENCES "sales_types"("id") ON DELETE RESTRICT;