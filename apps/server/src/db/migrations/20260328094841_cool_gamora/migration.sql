CREATE TYPE "location_type" AS ENUM('store', 'warehouse');--> statement-breakpoint
CREATE TYPE "material_type" AS ENUM('raw', 'semi', 'packaging');--> statement-breakpoint
CREATE TYPE "moka_scrap_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "moka_scrap_type" AS ENUM('sales', 'product', 'category');--> statement-breakpoint
CREATE TYPE "product_status" AS ENUM('active', 'inactive', 'archived');--> statement-breakpoint
CREATE TYPE "sales_order_status" AS ENUM('open', 'closed', 'void');--> statement-breakpoint
CREATE TYPE "transaction_type" AS ENUM('purchase', 'transfer_in', 'transfer_out', 'adjustment', 'sell', 'production_in', 'production_out');--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" text NOT NULL,
	"name" text NOT NULL,
	"type" "location_type" NOT NULL,
	"description" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" uuid NOT NULL,
	"updatedBy" uuid NOT NULL,
	"deletedBy" uuid,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "material_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"description" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" uuid NOT NULL,
	"updatedBy" uuid NOT NULL,
	"deletedBy" uuid,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "material_conversions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"materialId" uuid NOT NULL,
	"uomId" uuid NOT NULL,
	"toBaseFactor" numeric(18,6) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" uuid NOT NULL,
	"updatedBy" uuid NOT NULL,
	"deletedBy" uuid,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "material_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"materialId" uuid NOT NULL,
	"locationId" uuid NOT NULL,
	"minStock" numeric(18,4) DEFAULT '0' NOT NULL,
	"maxStock" numeric(18,4),
	"reorderPoint" numeric(18,4) DEFAULT '0' NOT NULL,
	"currentQty" numeric(18,4) DEFAULT '0' NOT NULL,
	"currentAvgCost" numeric(18,4) DEFAULT '0' NOT NULL,
	"currentValue" numeric(18,4) DEFAULT '0' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" uuid NOT NULL,
	"updatedBy" uuid NOT NULL,
	"deletedBy" uuid,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"description" text,
	"sku" text NOT NULL,
	"type" "material_type" NOT NULL,
	"categoryId" uuid,
	"baseUomId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" uuid NOT NULL,
	"updatedBy" uuid NOT NULL,
	"deletedBy" uuid,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "moka_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"locationId" uuid NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"businessId" text,
	"outletId" text,
	"accessToken" text,
	"lastSyncedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" uuid NOT NULL,
	"updatedBy" uuid NOT NULL,
	"deletedBy" uuid,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "moka_scrap_histories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"mokaConfigurationId" uuid NOT NULL,
	"type" "moka_scrap_type" NOT NULL,
	"status" "moka_scrap_status" DEFAULT 'pending'::"moka_scrap_status" NOT NULL,
	"dateFrom" timestamp with time zone NOT NULL,
	"dateTo" timestamp with time zone NOT NULL,
	"rawPath" text,
	"errorMessage" text,
	"metadata" jsonb,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" uuid NOT NULL,
	"updatedBy" uuid NOT NULL,
	"deletedBy" uuid,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"description" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" uuid NOT NULL,
	"updatedBy" uuid NOT NULL,
	"deletedBy" uuid,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "product_external_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"productId" uuid NOT NULL,
	"variantId" uuid,
	"provider" text NOT NULL,
	"externalId" text NOT NULL,
	"externalData" jsonb,
	"lastSyncedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" uuid NOT NULL,
	"updatedBy" uuid NOT NULL,
	"deletedBy" uuid,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "product_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"productId" uuid NOT NULL,
	"salesTypeId" uuid NOT NULL,
	"price" numeric(18,4) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" uuid NOT NULL,
	"updatedBy" uuid NOT NULL,
	"deletedBy" uuid,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"productId" uuid NOT NULL,
	"name" text NOT NULL,
	"sku" text,
	"isDefault" boolean DEFAULT false NOT NULL,
	"basePrice" numeric(18,4) DEFAULT '0' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" uuid NOT NULL,
	"updatedBy" uuid NOT NULL,
	"deletedBy" uuid,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"description" text,
	"sku" text NOT NULL,
	"locationId" uuid NOT NULL,
	"categoryId" uuid,
	"status" "product_status" DEFAULT 'active'::"product_status" NOT NULL,
	"hasVariants" boolean DEFAULT false NOT NULL,
	"hasSalesTypePricing" boolean DEFAULT false NOT NULL,
	"basePrice" numeric(18,4) DEFAULT '0' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" uuid NOT NULL,
	"updatedBy" uuid NOT NULL,
	"deletedBy" uuid,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "recipe_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"recipeId" uuid NOT NULL,
	"materialId" uuid NOT NULL,
	"qty" numeric(18,4) NOT NULL,
	"scrapPercentage" numeric(5,2) DEFAULT '0' NOT NULL,
	"uomId" uuid NOT NULL,
	"notes" text,
	"sortOrder" numeric(5,0) DEFAULT '0' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" uuid NOT NULL,
	"updatedBy" uuid NOT NULL,
	"deletedBy" uuid,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"materialId" uuid,
	"productId" uuid,
	"productVariantId" uuid,
	"targetQty" numeric(18,4) DEFAULT '1' NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"instructions" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" uuid NOT NULL,
	"updatedBy" uuid NOT NULL,
	"deletedBy" uuid,
	"syncAt" timestamp with time zone,
	CONSTRAINT "recipe_target_chk" CHECK (num_nonnulls("materialId", "productId", "productVariantId") = 1)
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"isSystem" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" uuid NOT NULL,
	"updatedBy" uuid NOT NULL,
	"deletedBy" uuid,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sales_external_refs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"orderId" uuid NOT NULL,
	"externalSource" text NOT NULL,
	"externalOrderId" text NOT NULL,
	"rawPayload" jsonb,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" uuid NOT NULL,
	"updatedBy" uuid NOT NULL,
	"deletedBy" uuid,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sales_order_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"orderId" uuid NOT NULL,
	"batchNumber" numeric(5,0) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" uuid NOT NULL,
	"updatedBy" uuid NOT NULL,
	"deletedBy" uuid,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sales_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"orderId" uuid NOT NULL,
	"batchId" uuid,
	"productId" uuid,
	"variantId" uuid,
	"itemName" text NOT NULL,
	"quantity" numeric(18,4) DEFAULT '1' NOT NULL,
	"unitPrice" numeric(18,2) DEFAULT '0' NOT NULL,
	"discountAmount" numeric(18,2) DEFAULT '0' NOT NULL,
	"taxAmount" numeric(18,2) DEFAULT '0' NOT NULL,
	"subtotal" numeric(18,2) DEFAULT '0' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" uuid NOT NULL,
	"updatedBy" uuid NOT NULL,
	"deletedBy" uuid,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sales_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"locationId" uuid NOT NULL,
	"customerId" uuid,
	"salesTypeId" uuid NOT NULL,
	"status" "sales_order_status" DEFAULT 'open'::"sales_order_status" NOT NULL,
	"transactionDate" timestamp with time zone DEFAULT now() NOT NULL,
	"totalAmount" numeric(18,2) DEFAULT '0' NOT NULL,
	"discountAmount" numeric(18,2) DEFAULT '0' NOT NULL,
	"taxAmount" numeric(18,2) DEFAULT '0' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" uuid NOT NULL,
	"updatedBy" uuid NOT NULL,
	"deletedBy" uuid,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sales_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" text NOT NULL,
	"name" text NOT NULL,
	"isSystem" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" uuid NOT NULL,
	"updatedBy" uuid NOT NULL,
	"deletedBy" uuid,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sales_voids" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"orderId" uuid NOT NULL,
	"itemId" uuid,
	"reason" text,
	"voidedBy" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" uuid NOT NULL,
	"updatedBy" uuid NOT NULL,
	"deletedBy" uuid,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"userId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"expiredAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"materialId" uuid NOT NULL,
	"locationId" uuid NOT NULL,
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
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" uuid NOT NULL,
	"updatedBy" uuid NOT NULL,
	"deletedBy" uuid,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "stock_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"materialId" uuid NOT NULL,
	"locationId" uuid NOT NULL,
	"type" "transaction_type" NOT NULL,
	"date" date NOT NULL,
	"referenceNo" text NOT NULL,
	"notes" text,
	"qty" numeric(18,4) NOT NULL,
	"unitCost" numeric(18,2) NOT NULL,
	"totalCost" numeric(18,2) NOT NULL,
	"counterpartLocationId" uuid,
	"transferId" uuid,
	"runningQty" numeric(18,4) NOT NULL,
	"runningAvgCost" numeric(18,2) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" uuid NOT NULL,
	"updatedBy" uuid NOT NULL,
	"deletedBy" uuid,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "uoms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" uuid NOT NULL,
	"updatedBy" uuid NOT NULL,
	"deletedBy" uuid,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"userId" uuid NOT NULL,
	"roleId" uuid NOT NULL,
	"locationId" uuid NOT NULL,
	"isDefault" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" uuid NOT NULL,
	"updatedBy" uuid NOT NULL,
	"deletedBy" uuid,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"email" text NOT NULL,
	"username" text NOT NULL,
	"fullname" text NOT NULL,
	"passwordHash" text NOT NULL,
	"pinCode" text,
	"isRoot" boolean DEFAULT false NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" uuid NOT NULL,
	"updatedBy" uuid NOT NULL,
	"deletedBy" uuid,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "variant_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"variantId" uuid NOT NULL,
	"salesTypeId" uuid NOT NULL,
	"price" numeric(18,4) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdBy" uuid NOT NULL,
	"updatedBy" uuid NOT NULL,
	"deletedBy" uuid,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX "locations_code_idx" ON "locations" ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "locations_name_idx" ON "locations" ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "material_categories_name_idx" ON "material_categories" ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "material_conversions_material_uom_idx" ON "material_conversions" ("materialId","uomId");--> statement-breakpoint
CREATE INDEX "material_conversions_uom_idx" ON "material_conversions" ("uomId");--> statement-breakpoint
CREATE UNIQUE INDEX "material_locations_material_location_idx" ON "material_locations" ("materialId","locationId");--> statement-breakpoint
CREATE INDEX "material_locations_location_idx" ON "material_locations" ("locationId");--> statement-breakpoint
CREATE UNIQUE INDEX "materials_name_idx" ON "materials" ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "materials_sku_idx" ON "materials" ("sku");--> statement-breakpoint
CREATE INDEX "materials_category_idx" ON "materials" ("categoryId");--> statement-breakpoint
CREATE INDEX "materials_base_uom_idx" ON "materials" ("baseUomId");--> statement-breakpoint
CREATE UNIQUE INDEX "product_categories_name_idx" ON "product_categories" ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "product_ext_map_provider_ext_id_idx" ON "product_external_mappings" ("provider","externalId");--> statement-breakpoint
CREATE UNIQUE INDEX "product_ext_map_provider_product_variant_idx" ON "product_external_mappings" ("provider","productId","variantId");--> statement-breakpoint
CREATE INDEX "product_ext_map_product_idx" ON "product_external_mappings" ("productId");--> statement-breakpoint
CREATE INDEX "product_ext_map_provider_idx" ON "product_external_mappings" ("provider");--> statement-breakpoint
CREATE UNIQUE INDEX "product_prices_product_sales_type_idx" ON "product_prices" ("productId","salesTypeId");--> statement-breakpoint
CREATE INDEX "product_prices_sales_type_idx" ON "product_prices" ("salesTypeId");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variants_product_name_idx" ON "product_variants" ("productId","name");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variants_sku_idx" ON "product_variants" ("productId","sku") WHERE "sku" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "products_sku_location_idx" ON "products" ("sku","locationId");--> statement-breakpoint
CREATE UNIQUE INDEX "products_name_location_idx" ON "products" ("name","locationId");--> statement-breakpoint
CREATE INDEX "products_location_idx" ON "products" ("locationId");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" ("categoryId");--> statement-breakpoint
CREATE INDEX "products_status_idx" ON "products" ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "recipe_items_recipe_material_idx" ON "recipe_items" ("recipeId","materialId");--> statement-breakpoint
CREATE INDEX "recipe_items_material_idx" ON "recipe_items" ("materialId");--> statement-breakpoint
CREATE INDEX "recipe_items_uom_idx" ON "recipe_items" ("uomId");--> statement-breakpoint
CREATE UNIQUE INDEX "recipes_material_idx" ON "recipes" ("materialId") WHERE "materialId" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "recipes_product_idx" ON "recipes" ("productId") WHERE "productId" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "recipes_product_variant_idx" ON "recipes" ("productVariantId") WHERE "productVariantId" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "roles_code_idx" ON "roles" ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "roles_name_idx" ON "roles" ("name");--> statement-breakpoint
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
CREATE INDEX "sessions_user_idx" ON "sessions" ("userId");--> statement-breakpoint
CREATE INDEX "sessions_expired_at_idx" ON "sessions" ("expiredAt");--> statement-breakpoint
CREATE UNIQUE INDEX "stock_summaries_material_location_date_idx" ON "stock_summaries" ("materialId","locationId","date");--> statement-breakpoint
CREATE INDEX "stock_summaries_location_date_idx" ON "stock_summaries" ("locationId","date");--> statement-breakpoint
CREATE INDEX "stock_summaries_date_idx" ON "stock_summaries" ("date");--> statement-breakpoint
CREATE INDEX "stock_txn_material_location_date_idx" ON "stock_transactions" ("materialId","locationId","date");--> statement-breakpoint
CREATE INDEX "stock_txn_location_date_idx" ON "stock_transactions" ("locationId","date");--> statement-breakpoint
CREATE INDEX "stock_txn_type_date_idx" ON "stock_transactions" ("type","date");--> statement-breakpoint
CREATE INDEX "stock_txn_transfer_idx" ON "stock_transactions" ("transferId");--> statement-breakpoint
CREATE INDEX "stock_txn_reference_no_idx" ON "stock_transactions" ("referenceNo");--> statement-breakpoint
CREATE UNIQUE INDEX "uoms_code_idx" ON "uoms" ("code");--> statement-breakpoint
CREATE INDEX "user_assignments_user_idx" ON "user_assignments" ("userId");--> statement-breakpoint
CREATE INDEX "user_assignments_role_idx" ON "user_assignments" ("roleId");--> statement-breakpoint
CREATE INDEX "user_assignments_location_idx" ON "user_assignments" ("locationId");--> statement-breakpoint
CREATE UNIQUE INDEX "user_assignments_user_role_location_idx" ON "user_assignments" ("userId","roleId","locationId");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_idx" ON "users" ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "variant_prices_variant_sales_type_idx" ON "variant_prices" ("variantId","salesTypeId");--> statement-breakpoint
CREATE INDEX "variant_prices_sales_type_idx" ON "variant_prices" ("salesTypeId");--> statement-breakpoint
ALTER TABLE "material_conversions" ADD CONSTRAINT "material_conversions_materialId_materials_id_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "material_conversions" ADD CONSTRAINT "material_conversions_uomId_uoms_id_fkey" FOREIGN KEY ("uomId") REFERENCES "uoms"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "material_locations" ADD CONSTRAINT "material_locations_materialId_materials_id_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "material_locations" ADD CONSTRAINT "material_locations_locationId_locations_id_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_categoryId_material_categories_id_fkey" FOREIGN KEY ("categoryId") REFERENCES "material_categories"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_baseUomId_uoms_id_fkey" FOREIGN KEY ("baseUomId") REFERENCES "uoms"("id") ON DELETE RESTRICT;--> statement-breakpoint
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
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "stock_summaries" ADD CONSTRAINT "stock_summaries_materialId_materials_id_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "stock_summaries" ADD CONSTRAINT "stock_summaries_locationId_locations_id_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_materialId_materials_id_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_locationId_locations_id_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_counterpartLocationId_locations_id_fkey" FOREIGN KEY ("counterpartLocationId") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "user_assignments" ADD CONSTRAINT "user_assignments_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_assignments" ADD CONSTRAINT "user_assignments_roleId_roles_id_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "user_assignments" ADD CONSTRAINT "user_assignments_locationId_locations_id_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "variant_prices" ADD CONSTRAINT "variant_prices_variantId_product_variants_id_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "variant_prices" ADD CONSTRAINT "variant_prices_salesTypeId_sales_types_id_fkey" FOREIGN KEY ("salesTypeId") REFERENCES "sales_types"("id") ON DELETE RESTRICT;