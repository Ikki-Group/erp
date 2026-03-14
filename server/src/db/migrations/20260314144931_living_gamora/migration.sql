CREATE TYPE "sales_order_status" AS ENUM('open', 'closed', 'void');--> statement-breakpoint
CREATE TABLE "moka_configurations" (
	"id" serial PRIMARY KEY,
	"locationId" integer NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"businessId" integer,
	"outletId" integer,
	"accessToken" text,
	"lastSyncedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	"syncAt" timestamp with time zone
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
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sales_external_refs" (
	"id" serial PRIMARY KEY,
	"orderId" integer NOT NULL,
	"externalSource" text NOT NULL,
	"externalOrderId" text NOT NULL,
	"rawPayload" jsonb,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sales_order_batches" (
	"id" serial PRIMARY KEY,
	"orderId" integer NOT NULL,
	"batchNumber" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	"syncAt" timestamp with time zone
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
	"unitPrice" numeric(18,4) DEFAULT '0' NOT NULL,
	"discountAmount" numeric(18,4) DEFAULT '0' NOT NULL,
	"taxAmount" numeric(18,4) DEFAULT '0' NOT NULL,
	"subtotal" numeric(18,4) DEFAULT '0' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sales_orders" (
	"id" serial PRIMARY KEY,
	"locationId" integer NOT NULL,
	"customerId" integer,
	"salesTypeId" integer NOT NULL,
	"status" "sales_order_status" DEFAULT 'open'::"sales_order_status" NOT NULL,
	"transactionDate" timestamp with time zone DEFAULT now() NOT NULL,
	"totalAmount" numeric(18,4) DEFAULT '0' NOT NULL,
	"discountAmount" numeric(18,4) DEFAULT '0' NOT NULL,
	"taxAmount" numeric(18,4) DEFAULT '0' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sales_voids" (
	"id" serial PRIMARY KEY,
	"orderId" integer NOT NULL,
	"itemId" integer,
	"reason" text,
	"voidedBy" integer NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedBy" integer NOT NULL,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
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
CREATE INDEX "sales_voids_order_idx" ON "sales_voids" ("orderId");--> statement-breakpoint
CREATE INDEX "sales_voids_item_idx" ON "sales_voids" ("itemId");--> statement-breakpoint
ALTER TABLE "sales_external_refs" ADD CONSTRAINT "sales_external_refs_orderId_sales_orders_id_fkey" FOREIGN KEY ("orderId") REFERENCES "sales_orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sales_order_batches" ADD CONSTRAINT "sales_order_batches_orderId_sales_orders_id_fkey" FOREIGN KEY ("orderId") REFERENCES "sales_orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_orderId_sales_orders_id_fkey" FOREIGN KEY ("orderId") REFERENCES "sales_orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_batchId_sales_order_batches_id_fkey" FOREIGN KEY ("batchId") REFERENCES "sales_order_batches"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_productId_products_id_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_variantId_product_variants_id_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_locationId_locations_id_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_salesTypeId_sales_types_id_fkey" FOREIGN KEY ("salesTypeId") REFERENCES "sales_types"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "sales_voids" ADD CONSTRAINT "sales_voids_orderId_sales_orders_id_fkey" FOREIGN KEY ("orderId") REFERENCES "sales_orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sales_voids" ADD CONSTRAINT "sales_voids_itemId_sales_order_items_id_fkey" FOREIGN KEY ("itemId") REFERENCES "sales_order_items"("id") ON DELETE CASCADE;