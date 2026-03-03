CREATE TYPE "location_type" AS ENUM('store', 'warehouse');--> statement-breakpoint
CREATE TYPE "material_type" AS ENUM('raw', 'semi');--> statement-breakpoint
CREATE TYPE "transaction_type" AS ENUM('purchase', 'transfer_in', 'transfer_out', 'adjustment', 'sell');--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" text NOT NULL,
	"name" text NOT NULL,
	"type" "location_type" NOT NULL,
	"description" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" uuid NOT NULL,
	"updatedBy" uuid NOT NULL,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "material_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"description" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" uuid NOT NULL,
	"updatedBy" uuid NOT NULL,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "material_conversions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"materialId" uuid NOT NULL,
	"uom" text NOT NULL,
	"factor" numeric(18,6) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "material_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"materialId" uuid NOT NULL,
	"locationId" uuid NOT NULL,
	"minStock" integer DEFAULT 0 NOT NULL,
	"maxStock" integer,
	"reorderPoint" integer DEFAULT 0 NOT NULL,
	"currentQty" numeric(18,4) DEFAULT '0' NOT NULL,
	"currentAvgCost" numeric(18,4) DEFAULT '0' NOT NULL,
	"currentValue" numeric(18,4) DEFAULT '0' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" uuid NOT NULL,
	"updatedBy" uuid NOT NULL,
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
	"baseUom" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" uuid NOT NULL,
	"updatedBy" uuid NOT NULL,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" text NOT NULL,
	"name" text NOT NULL,
	"isSystem" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" uuid NOT NULL,
	"updatedBy" uuid NOT NULL,
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
	"openingAvgCost" numeric(18,4) DEFAULT '0' NOT NULL,
	"openingValue" numeric(18,4) DEFAULT '0' NOT NULL,
	"purchaseQty" numeric(18,4) DEFAULT '0' NOT NULL,
	"purchaseValue" numeric(18,4) DEFAULT '0' NOT NULL,
	"transferInQty" numeric(18,4) DEFAULT '0' NOT NULL,
	"transferInValue" numeric(18,4) DEFAULT '0' NOT NULL,
	"transferOutQty" numeric(18,4) DEFAULT '0' NOT NULL,
	"transferOutValue" numeric(18,4) DEFAULT '0' NOT NULL,
	"adjustmentQty" numeric(18,4) DEFAULT '0' NOT NULL,
	"adjustmentValue" numeric(18,4) DEFAULT '0' NOT NULL,
	"sellQty" numeric(18,4) DEFAULT '0' NOT NULL,
	"sellValue" numeric(18,4) DEFAULT '0' NOT NULL,
	"closingQty" numeric(18,4) DEFAULT '0' NOT NULL,
	"closingAvgCost" numeric(18,4) DEFAULT '0' NOT NULL,
	"closingValue" numeric(18,4) DEFAULT '0' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" uuid NOT NULL,
	"updatedBy" uuid NOT NULL,
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
	"unitCost" numeric(18,4) NOT NULL,
	"totalCost" numeric(18,4) NOT NULL,
	"counterpartLocationId" uuid,
	"transferId" uuid,
	"runningQty" numeric(18,4) NOT NULL,
	"runningAvgCost" numeric(18,4) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" uuid NOT NULL,
	"updatedBy" uuid NOT NULL,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "uoms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" uuid NOT NULL,
	"updatedBy" uuid NOT NULL,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"userId" uuid NOT NULL,
	"roleId" uuid NOT NULL,
	"locationId" uuid NOT NULL,
	"isDefault" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"email" text NOT NULL,
	"username" text NOT NULL,
	"fullname" text NOT NULL,
	"passwordHash" text NOT NULL,
	"isRoot" boolean DEFAULT false NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" uuid NOT NULL,
	"updatedBy" uuid NOT NULL,
	"syncAt" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX "locations_code_idx" ON "locations" ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "locations_name_idx" ON "locations" ("name");--> statement-breakpoint
CREATE INDEX "locations_type_idx" ON "locations" ("type");--> statement-breakpoint
CREATE INDEX "locations_is_active_idx" ON "locations" ("isActive");--> statement-breakpoint
CREATE UNIQUE INDEX "material_categories_name_idx" ON "material_categories" ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "material_conversions_material_uom_idx" ON "material_conversions" ("materialId","uom");--> statement-breakpoint
CREATE INDEX "material_conversions_material_idx" ON "material_conversions" ("materialId");--> statement-breakpoint
CREATE UNIQUE INDEX "material_locations_material_location_idx" ON "material_locations" ("materialId","locationId");--> statement-breakpoint
CREATE INDEX "material_locations_location_idx" ON "material_locations" ("locationId");--> statement-breakpoint
CREATE INDEX "material_locations_material_idx" ON "material_locations" ("materialId");--> statement-breakpoint
CREATE UNIQUE INDEX "materials_name_idx" ON "materials" ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "materials_sku_idx" ON "materials" ("sku");--> statement-breakpoint
CREATE INDEX "materials_type_idx" ON "materials" ("type");--> statement-breakpoint
CREATE INDEX "materials_category_idx" ON "materials" ("categoryId");--> statement-breakpoint
CREATE UNIQUE INDEX "roles_code_idx" ON "roles" ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "roles_name_idx" ON "roles" ("name");--> statement-breakpoint
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
CREATE UNIQUE INDEX "user_assignments_user_role_location_idx" ON "user_assignments" ("userId","roleId","locationId");--> statement-breakpoint
CREATE INDEX "user_assignments_user_idx" ON "user_assignments" ("userId");--> statement-breakpoint
CREATE INDEX "user_assignments_role_idx" ON "user_assignments" ("roleId");--> statement-breakpoint
CREATE INDEX "user_assignments_location_idx" ON "user_assignments" ("locationId");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_idx" ON "users" ("username");