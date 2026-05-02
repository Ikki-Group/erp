CREATE TYPE "account_type" AS ENUM('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');--> statement-breakpoint
CREATE TYPE "attendance_status" AS ENUM('present', 'absent', 'late', 'on_leave');--> statement-breakpoint
CREATE TYPE "audit_action" AS ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'OTHER');--> statement-breakpoint
CREATE TYPE "customer_tier" AS ENUM('bronze', 'silver', 'gold', 'platinum');--> statement-breakpoint
CREATE TYPE "expenditure_status" AS ENUM('PENDING', 'PAID', 'VOID', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "expenditure_type" AS ENUM('BILLS', 'ASSET', 'PURCHASES');--> statement-breakpoint
CREATE TYPE "goods_receipt_status" AS ENUM('open', 'completed', 'void');--> statement-breakpoint
CREATE TYPE "integration_provider" AS ENUM('moka');--> statement-breakpoint
CREATE TYPE "invoice_status" AS ENUM('draft', 'open', 'paid', 'void');--> statement-breakpoint
CREATE TYPE "leave_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "leave_type" AS ENUM('annual', 'sick', 'unpaid', 'other');--> statement-breakpoint
CREATE TYPE "location_type" AS ENUM('store', 'warehouse');--> statement-breakpoint
CREATE TYPE "loyalty_transaction_type" AS ENUM('earned', 'redeemed', 'adjusted', 'expired');--> statement-breakpoint
CREATE TYPE "material_type" AS ENUM('raw', 'semi', 'packaging');--> statement-breakpoint
CREATE TYPE "moka_scrap_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "moka_scrap_type" AS ENUM('sales', 'product', 'category');--> statement-breakpoint
CREATE TYPE "moka_sync_trigger_mode" AS ENUM('manual', 'cron', 'upload', 'machine_fetch');--> statement-breakpoint
CREATE TYPE "payment_method_category" AS ENUM('cash', 'cashless');--> statement-breakpoint
CREATE TYPE "payment_method" AS ENUM('cash', 'bank_transfer', 'credit_card', 'debit_card', 'e_wallet');--> statement-breakpoint
CREATE TYPE "payment_type" AS ENUM('payable', 'receivable');--> statement-breakpoint
CREATE TYPE "payroll_adjustment_type" AS ENUM('addition', 'deduction');--> statement-breakpoint
CREATE TYPE "payroll_status" AS ENUM('draft', 'approved', 'paid', 'cancelled');--> statement-breakpoint
CREATE TYPE "product_status" AS ENUM('active', 'inactive', 'archived');--> statement-breakpoint
CREATE TYPE "purchase_order_status" AS ENUM('pending_approval', 'approved', 'rejected', 'open', 'closed', 'void');--> statement-breakpoint
CREATE TYPE "purchase_request_status" AS ENUM('open', 'approved', 'rejected', 'void');--> statement-breakpoint
CREATE TYPE "sales_order_source" AS ENUM('web', 'moka', 'upload', 'machine_fetch');--> statement-breakpoint
CREATE TYPE "sales_order_status" AS ENUM('open', 'closed', 'void');--> statement-breakpoint
CREATE TYPE "stock_adjustment_type" AS ENUM('opname', 'found', 'waste', 'correction');--> statement-breakpoint
CREATE TYPE "transaction_type" AS ENUM('purchase', 'transfer_in', 'transfer_out', 'adjustment', 'sell', 'usage', 'production_in', 'production_out');--> statement-breakpoint
CREATE TYPE "work_order_status" AS ENUM('draft', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" serial PRIMARY KEY,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"type" "account_type" NOT NULL,
	"is_group" boolean DEFAULT false NOT NULL,
	"parent_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "attendances" (
	"id" serial PRIMARY KEY,
	"employee_id" integer NOT NULL,
	"location_id" integer NOT NULL,
	"shift_id" integer,
	"date" timestamp DEFAULT now() NOT NULL,
	"clock_in" timestamp,
	"clock_out" timestamp,
	"status" "attendance_status" DEFAULT 'present'::"attendance_status" NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY,
	"userId" integer NOT NULL,
	"action" "audit_action" NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"description" text NOT NULL,
	"old_value" jsonb,
	"new_value" jsonb,
	"ip_address" text,
	"user_agent" text,
	"action_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "category_external_mappings" (
	"id" serial PRIMARY KEY,
	"categoryId" integer NOT NULL,
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
CREATE TABLE "company_settings" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"address" text,
	"phone" text,
	"email" text,
	"tax_id" text,
	"taxRate" numeric(5,2) DEFAULT '0' NOT NULL,
	"logo_url" text,
	"invoice_footer" text,
	"receipt_footer" text,
	"currency_code" text DEFAULT 'IDR' NOT NULL,
	"currency_symbol" text DEFAULT 'Rp' NOT NULL,
	"settings" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "customer_loyalty_transactions" (
	"id" serial PRIMARY KEY,
	"customer_id" integer NOT NULL,
	"type" "loyalty_transaction_type" NOT NULL,
	"points" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"reference_type" text,
	"reference_id" integer,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"address" text,
	"tax_id" text,
	"date_of_birth" timestamp,
	"tier" "customer_tier" DEFAULT 'bronze'::"customer_tier",
	"points_balance" integer DEFAULT 0 NOT NULL,
	"total_points_earned" integer DEFAULT 0 NOT NULL,
	"registered_at" timestamp DEFAULT now(),
	"last_visit_at" timestamp,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" serial PRIMARY KEY,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"address" text,
	"nik" text,
	"npwp" text,
	"job_title" text,
	"department" text,
	"base_salary" numeric DEFAULT '0' NOT NULL,
	"bank_account" text,
	"hire_date" timestamp,
	"termination_date" timestamp,
	"emergency_contact" text,
	"user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "expenditures" (
	"id" serial PRIMARY KEY,
	"type" "expenditure_type" NOT NULL,
	"status" "expenditure_status" DEFAULT 'PAID'::"expenditure_status" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"amount" numeric(18,2) DEFAULT '0' NOT NULL,
	"source_account_id" integer NOT NULL,
	"target_account_id" integer NOT NULL,
	"liability_account_id" integer,
	"supplier_id" integer,
	"location_id" integer NOT NULL,
	"is_installment" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "goods_receipt_note_items" (
	"id" serial PRIMARY KEY,
	"grnId" integer NOT NULL,
	"purchaseOrderItemId" integer NOT NULL,
	"materialId" integer,
	"itemName" text NOT NULL,
	"quantityReceived" numeric(18,4) DEFAULT '0' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "goods_receipt_notes" (
	"id" serial PRIMARY KEY,
	"orderId" integer NOT NULL,
	"locationId" integer NOT NULL,
	"supplierId" integer NOT NULL,
	"receiveDate" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "goods_receipt_status" DEFAULT 'open'::"goods_receipt_status" NOT NULL,
	"referenceNumber" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" serial PRIMARY KEY,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"reference" text NOT NULL,
	"source_type" text NOT NULL,
	"source_id" integer NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "journal_items" (
	"id" serial PRIMARY KEY,
	"journal_entry_id" integer NOT NULL,
	"account_id" integer NOT NULL,
	"debit" numeric(18,2) DEFAULT '0' NOT NULL,
	"credit" numeric(18,2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "leave_requests" (
	"id" serial PRIMARY KEY,
	"employee_id" integer NOT NULL,
	"type" "leave_type" NOT NULL,
	"status" "leave_status" DEFAULT 'pending'::"leave_status" NOT NULL,
	"date_start" timestamp NOT NULL,
	"date_end" timestamp NOT NULL,
	"reason" text NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" serial PRIMARY KEY,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"type" "location_type" NOT NULL,
	"description" text,
	"address" text,
	"phone" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL
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
	"tax_id" integer,
	"purchase_account_id" integer,
	"sales_account_id" integer,
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
	"provider" "integration_provider" DEFAULT 'moka'::"integration_provider" NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"businessId" text,
	"outletId" text,
	"accessToken" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"salesCronEnabled" boolean DEFAULT false NOT NULL,
	"salesCronExpression" text,
	"lastSyncedAt" timestamp with time zone,
	"lastSalesSyncedAt" timestamp with time zone,
	"lastProductSyncedAt" timestamp with time zone,
	"lastCategorySyncedAt" timestamp with time zone,
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
	"provider" "integration_provider" DEFAULT 'moka'::"integration_provider" NOT NULL,
	"type" "moka_scrap_type" NOT NULL,
	"triggerMode" "moka_sync_trigger_mode" DEFAULT 'manual'::"moka_sync_trigger_mode" NOT NULL,
	"status" "moka_scrap_status" DEFAULT 'pending'::"moka_scrap_status" NOT NULL,
	"dateFrom" timestamp with time zone NOT NULL,
	"dateTo" timestamp with time zone NOT NULL,
	"startedAt" timestamp with time zone,
	"finishedAt" timestamp with time zone,
	"recordsCount" integer DEFAULT 0 NOT NULL,
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
CREATE TABLE "moka_sync_cursors" (
	"id" serial PRIMARY KEY,
	"mokaConfigurationId" integer NOT NULL,
	"type" "moka_scrap_type" NOT NULL,
	"provider" "integration_provider" DEFAULT 'moka'::"integration_provider" NOT NULL,
	"cursorDate" timestamp with time zone,
	"cursorToken" text,
	"lastHistoryId" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "payment_invoices" (
	"id" serial PRIMARY KEY,
	"paymentId" integer NOT NULL,
	"salesInvoiceId" integer,
	"purchaseInvoiceId" integer,
	"amount" numeric(18,2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "payment_method_configs" (
	"id" serial PRIMARY KEY,
	"type" "payment_method" NOT NULL,
	"category" "payment_method_category" NOT NULL,
	"name" text NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
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
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY,
	"type" "payment_type" NOT NULL,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"reference_no" text,
	"account_id" integer NOT NULL,
	"method" "payment_method" NOT NULL,
	"amount" numeric(18,2) DEFAULT '0' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "payroll_adjustments" (
	"id" serial PRIMARY KEY,
	"payroll_item_id" integer NOT NULL,
	"type" "payroll_adjustment_type" NOT NULL,
	"amount" numeric DEFAULT '0' NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "payroll_batches" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"period_month" integer NOT NULL,
	"period_year" integer NOT NULL,
	"status" "payroll_status" DEFAULT 'draft'::"payroll_status" NOT NULL,
	"total_amount" numeric DEFAULT '0' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "payroll_items" (
	"id" serial PRIMARY KEY,
	"batch_id" integer NOT NULL,
	"employee_id" integer NOT NULL,
	"base_salary" numeric DEFAULT '0' NOT NULL,
	"adjustments_amount" numeric DEFAULT '0' NOT NULL,
	"service_charge_amount" numeric DEFAULT '0' NOT NULL,
	"total_amount" numeric DEFAULT '0' NOT NULL,
	"note" text,
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
	"tax_id" integer,
	"sales_account_id" integer,
	"discount_account_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "purchase_invoice_items" (
	"id" serial PRIMARY KEY,
	"invoiceId" integer NOT NULL,
	"purchaseOrderItemId" integer,
	"materialId" integer,
	"itemName" text NOT NULL,
	"quantity" numeric(18,4) DEFAULT '0' NOT NULL,
	"unitPrice" numeric(18,2) DEFAULT '0' NOT NULL,
	"taxAmount" numeric(18,2) DEFAULT '0' NOT NULL,
	"discountAmount" numeric(18,2) DEFAULT '0' NOT NULL,
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
CREATE TABLE "purchase_invoices" (
	"id" serial PRIMARY KEY,
	"orderId" integer NOT NULL,
	"supplierId" integer NOT NULL,
	"locationId" integer NOT NULL,
	"status" "invoice_status" DEFAULT 'draft'::"invoice_status" NOT NULL,
	"invoiceDate" timestamp with time zone DEFAULT now() NOT NULL,
	"dueDate" timestamp with time zone,
	"external_invoice_number" text,
	"totalAmount" numeric(18,2) DEFAULT '0' NOT NULL,
	"taxAmount" numeric(18,2) DEFAULT '0' NOT NULL,
	"discountAmount" numeric(18,2) DEFAULT '0' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "purchase_order_items" (
	"id" serial PRIMARY KEY,
	"orderId" integer NOT NULL,
	"requestItemId" integer,
	"materialId" integer,
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
CREATE TABLE "purchase_orders" (
	"id" serial PRIMARY KEY,
	"requestId" integer,
	"locationId" integer NOT NULL,
	"supplierId" integer NOT NULL,
	"status" "purchase_order_status" DEFAULT 'open'::"purchase_order_status" NOT NULL,
	"transactionDate" timestamp with time zone DEFAULT now() NOT NULL,
	"expectedDeliveryDate" timestamp with time zone,
	"totalAmount" numeric(18,2) DEFAULT '0' NOT NULL,
	"discountAmount" numeric(18,2) DEFAULT '0' NOT NULL,
	"taxAmount" numeric(18,2) DEFAULT '0' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "purchase_request_items" (
	"id" serial PRIMARY KEY,
	"requestId" integer NOT NULL,
	"materialId" integer,
	"itemName" text NOT NULL,
	"quantity" numeric(18,4) DEFAULT '1' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "purchase_requests" (
	"id" serial PRIMARY KEY,
	"locationId" integer NOT NULL,
	"requestedBy" integer NOT NULL,
	"status" "purchase_request_status" DEFAULT 'open'::"purchase_request_status" NOT NULL,
	"requestDate" timestamp with time zone DEFAULT now() NOT NULL,
	"expectedDate" timestamp with time zone,
	"notes" text,
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
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL
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
CREATE TABLE "sales_invoice_items" (
	"id" serial PRIMARY KEY,
	"invoiceId" integer NOT NULL,
	"salesOrderItemId" integer,
	"productId" integer,
	"variantId" integer,
	"itemName" text NOT NULL,
	"quantity" numeric(18,4) DEFAULT '0' NOT NULL,
	"unitPrice" numeric(18,2) DEFAULT '0' NOT NULL,
	"taxAmount" numeric(18,2) DEFAULT '0' NOT NULL,
	"discountAmount" numeric(18,2) DEFAULT '0' NOT NULL,
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
CREATE TABLE "sales_invoices" (
	"id" serial PRIMARY KEY,
	"orderId" integer NOT NULL,
	"customerId" integer,
	"locationId" integer NOT NULL,
	"status" "invoice_status" DEFAULT 'draft'::"invoice_status" NOT NULL,
	"invoiceDate" timestamp with time zone DEFAULT now() NOT NULL,
	"dueDate" timestamp with time zone,
	"totalAmount" numeric(18,2) DEFAULT '0' NOT NULL,
	"taxAmount" numeric(18,2) DEFAULT '0' NOT NULL,
	"discountAmount" numeric(18,2) DEFAULT '0' NOT NULL,
	"notes" text,
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
	"source" "sales_order_source" DEFAULT 'web'::"sales_order_source" NOT NULL,
	"status" "sales_order_status" DEFAULT 'open'::"sales_order_status" NOT NULL,
	"transactionDate" timestamp with time zone DEFAULT now() NOT NULL,
	"totalAmount" numeric(18,2) DEFAULT '0' NOT NULL,
	"discountAmount" numeric(18,2) DEFAULT '0' NOT NULL,
	"taxAmount" numeric(18,2) DEFAULT '0' NOT NULL,
	"gratuityAmount" numeric(18,2) DEFAULT '0' NOT NULL,
	"refundAmount" numeric(18,2) DEFAULT '0' NOT NULL,
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
CREATE TABLE "sales_refunds" (
	"id" serial PRIMARY KEY,
	"orderId" integer NOT NULL,
	"itemId" integer,
	"amount" numeric(18,2) NOT NULL,
	"reason" text,
	"refundedBy" integer,
	"refundedAt" timestamp with time zone NOT NULL,
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
	"voidedBy" integer,
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
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expired_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "stock_adjustment_items" (
	"id" serial PRIMARY KEY,
	"adjustmentId" integer NOT NULL,
	"materialId" integer NOT NULL,
	"batchId" integer,
	"qtyDiff" numeric(18,4) NOT NULL,
	"unitCost" numeric(18,2) NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "stock_adjustments" (
	"id" serial PRIMARY KEY,
	"locationId" integer NOT NULL,
	"type" "stock_adjustment_type" NOT NULL,
	"adjustment_date" timestamp with time zone DEFAULT now() NOT NULL,
	"reason" text,
	"reference_no" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "stock_batches" (
	"id" serial PRIMARY KEY,
	"materialId" integer NOT NULL,
	"batch_no" text NOT NULL,
	"expiry_date" timestamp,
	"production_date" timestamp,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
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
	"usageQty" numeric(18,4) DEFAULT '0' NOT NULL,
	"usageValue" numeric(18,2) DEFAULT '0' NOT NULL,
	"productionInQty" numeric(18,4) DEFAULT '0' NOT NULL,
	"productionInValue" numeric(18,2) DEFAULT '0' NOT NULL,
	"productionOutQty" numeric(18,4) DEFAULT '0' NOT NULL,
	"productionOutValue" numeric(18,2) DEFAULT '0' NOT NULL,
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
	"batchId" integer,
	"qty" numeric(18,4) NOT NULL,
	"unitCost" numeric(18,2) NOT NULL,
	"totalCost" numeric(18,2) NOT NULL,
	"counterpartLocationId" integer,
	"transferId" integer,
	"adjustmentItemId" integer,
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
CREATE TABLE "stock_transfer_items" (
	"id" serial PRIMARY KEY,
	"transferId" integer NOT NULL,
	"materialId" integer NOT NULL,
	"itemName" text NOT NULL,
	"quantity" numeric(18,4) NOT NULL,
	"unitCost" numeric(18,2) NOT NULL,
	"totalCost" numeric(18,2) NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "stock_transfers" (
	"id" serial PRIMARY KEY,
	"sourceLocationId" integer NOT NULL,
	"destinationLocationId" integer NOT NULL,
	"status" text DEFAULT 'pending_approval' NOT NULL,
	"transfer_date" timestamp NOT NULL,
	"expected_date" timestamp,
	"received_date" timestamp,
	"reference_no" text NOT NULL,
	"notes" text,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" serial PRIMARY KEY,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"address" text,
	"tax_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "taxes" (
	"id" serial PRIMARY KEY,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"rate" numeric(5,2) DEFAULT '0' NOT NULL,
	"account_id" integer,
	"description" text,
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
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"added_by" integer
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
	"is_system" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"default_location_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL
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
CREATE TABLE "work_orders" (
	"id" serial PRIMARY KEY,
	"recipeId" integer NOT NULL,
	"locationId" integer NOT NULL,
	"status" "work_order_status" DEFAULT 'draft'::"work_order_status" NOT NULL,
	"expectedQty" numeric(18,4) NOT NULL,
	"actualQty" numeric(18,4) DEFAULT '0' NOT NULL,
	"note" text,
	"totalCost" numeric(18,4) DEFAULT '0' NOT NULL,
	"startedAt" timestamp,
	"completedAt" timestamp,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_code_idx" ON "accounts" ("code") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE UNIQUE INDEX "category_ext_map_provider_ext_id_idx" ON "category_external_mappings" ("provider","externalId");--> statement-breakpoint
CREATE UNIQUE INDEX "category_ext_map_provider_category_idx" ON "category_external_mappings" ("provider","categoryId");--> statement-breakpoint
CREATE INDEX "category_ext_map_category_idx" ON "category_external_mappings" ("categoryId");--> statement-breakpoint
CREATE INDEX "category_ext_map_provider_idx" ON "category_external_mappings" ("provider");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_code_idx" ON "customers" ("code") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE UNIQUE INDEX "customers_name_idx" ON "customers" ("name") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE UNIQUE INDEX "employees_code_idx" ON "employees" ("code") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE INDEX "expenditures_date_idx" ON "expenditures" ("date");--> statement-breakpoint
CREATE INDEX "expenditures_location_idx" ON "expenditures" ("location_id");--> statement-breakpoint
CREATE INDEX "expenditures_type_idx" ON "expenditures" ("type");--> statement-breakpoint
CREATE INDEX "goods_receipt_note_items_grn_idx" ON "goods_receipt_note_items" ("grnId");--> statement-breakpoint
CREATE INDEX "goods_receipt_note_items_po_item_idx" ON "goods_receipt_note_items" ("purchaseOrderItemId");--> statement-breakpoint
CREATE INDEX "goods_receipt_note_items_material_idx" ON "goods_receipt_note_items" ("materialId");--> statement-breakpoint
CREATE INDEX "goods_receipt_notes_order_idx" ON "goods_receipt_notes" ("orderId");--> statement-breakpoint
CREATE INDEX "goods_receipt_notes_location_idx" ON "goods_receipt_notes" ("locationId");--> statement-breakpoint
CREATE INDEX "goods_receipt_notes_supplier_idx" ON "goods_receipt_notes" ("supplierId");--> statement-breakpoint
CREATE INDEX "goods_receipt_notes_status_idx" ON "goods_receipt_notes" ("status");--> statement-breakpoint
CREATE INDEX "journal_entries_date_idx" ON "journal_entries" ("date");--> statement-breakpoint
CREATE INDEX "journal_entries_source_idx" ON "journal_entries" ("source_type","source_id");--> statement-breakpoint
CREATE INDEX "journal_items_entry_idx" ON "journal_items" ("journal_entry_id");--> statement-breakpoint
CREATE INDEX "journal_items_account_idx" ON "journal_items" ("account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "locations_code_idx" ON "locations" ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "locations_name_idx" ON "locations" ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "material_categories_name_idx" ON "material_categories" ("name") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE UNIQUE INDEX "material_conversions_material_uom_idx" ON "material_conversions" ("materialId","uomId") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE INDEX "material_conversions_uom_idx" ON "material_conversions" ("uomId");--> statement-breakpoint
CREATE UNIQUE INDEX "material_locations_material_location_idx" ON "material_locations" ("materialId","locationId") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE INDEX "material_locations_location_idx" ON "material_locations" ("locationId");--> statement-breakpoint
CREATE UNIQUE INDEX "materials_name_idx" ON "materials" ("name") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE UNIQUE INDEX "materials_sku_idx" ON "materials" ("sku") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE INDEX "materials_category_idx" ON "materials" ("categoryId");--> statement-breakpoint
CREATE INDEX "materials_base_uom_idx" ON "materials" ("baseUomId");--> statement-breakpoint
CREATE INDEX "materials_tax_idx" ON "materials" ("tax_id");--> statement-breakpoint
CREATE UNIQUE INDEX "moka_config_provider_location_idx" ON "moka_configurations" ("provider","locationId");--> statement-breakpoint
CREATE INDEX "moka_config_location_idx" ON "moka_configurations" ("locationId");--> statement-breakpoint
CREATE INDEX "moka_config_provider_idx" ON "moka_configurations" ("provider");--> statement-breakpoint
CREATE INDEX "moka_config_active_idx" ON "moka_configurations" ("isActive");--> statement-breakpoint
CREATE INDEX "moka_scrap_history_config_idx" ON "moka_scrap_histories" ("mokaConfigurationId");--> statement-breakpoint
CREATE INDEX "moka_scrap_history_provider_idx" ON "moka_scrap_histories" ("provider");--> statement-breakpoint
CREATE INDEX "moka_scrap_history_type_idx" ON "moka_scrap_histories" ("type");--> statement-breakpoint
CREATE INDEX "moka_scrap_history_status_idx" ON "moka_scrap_histories" ("status");--> statement-breakpoint
CREATE INDEX "moka_scrap_history_trigger_mode_idx" ON "moka_scrap_histories" ("triggerMode");--> statement-breakpoint
CREATE INDEX "moka_scrap_history_created_at_idx" ON "moka_scrap_histories" ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "moka_sync_cursor_config_type_idx" ON "moka_sync_cursors" ("mokaConfigurationId","type");--> statement-breakpoint
CREATE INDEX "moka_sync_cursor_history_idx" ON "moka_sync_cursors" ("lastHistoryId");--> statement-breakpoint
CREATE INDEX "payment_invoices_payment_idx" ON "payment_invoices" ("paymentId");--> statement-breakpoint
CREATE INDEX "payment_invoices_sales_inv_idx" ON "payment_invoices" ("salesInvoiceId");--> statement-breakpoint
CREATE INDEX "payment_invoices_purchase_inv_idx" ON "payment_invoices" ("purchaseInvoiceId");--> statement-breakpoint
CREATE INDEX "payment_method_configs_type_idx" ON "payment_method_configs" ("type");--> statement-breakpoint
CREATE INDEX "payment_method_configs_category_idx" ON "payment_method_configs" ("category");--> statement-breakpoint
CREATE INDEX "payment_method_configs_is_enabled_idx" ON "payment_method_configs" ("is_enabled");--> statement-breakpoint
CREATE INDEX "payments_date_idx" ON "payments" ("date");--> statement-breakpoint
CREATE INDEX "payments_account_idx" ON "payments" ("account_id");--> statement-breakpoint
CREATE INDEX "payments_type_idx" ON "payments" ("type");--> statement-breakpoint
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
CREATE INDEX "products_tax_idx" ON "products" ("tax_id");--> statement-breakpoint
CREATE INDEX "purchase_invoice_items_invoice_idx" ON "purchase_invoice_items" ("invoiceId");--> statement-breakpoint
CREATE INDEX "purchase_invoice_items_po_item_idx" ON "purchase_invoice_items" ("purchaseOrderItemId");--> statement-breakpoint
CREATE INDEX "purchase_invoices_order_idx" ON "purchase_invoices" ("orderId");--> statement-breakpoint
CREATE INDEX "purchase_invoices_supplier_idx" ON "purchase_invoices" ("supplierId");--> statement-breakpoint
CREATE INDEX "purchase_invoices_status_idx" ON "purchase_invoices" ("status");--> statement-breakpoint
CREATE INDEX "purchase_order_items_order_idx" ON "purchase_order_items" ("orderId");--> statement-breakpoint
CREATE INDEX "purchase_order_items_material_idx" ON "purchase_order_items" ("materialId");--> statement-breakpoint
CREATE INDEX "purchase_orders_location_idx" ON "purchase_orders" ("locationId");--> statement-breakpoint
CREATE INDEX "purchase_orders_supplier_idx" ON "purchase_orders" ("supplierId");--> statement-breakpoint
CREATE INDEX "purchase_orders_status_idx" ON "purchase_orders" ("status");--> statement-breakpoint
CREATE INDEX "purchase_orders_request_idx" ON "purchase_orders" ("requestId");--> statement-breakpoint
CREATE INDEX "purchase_request_items_request_idx" ON "purchase_request_items" ("requestId");--> statement-breakpoint
CREATE INDEX "purchase_request_items_material_idx" ON "purchase_request_items" ("materialId");--> statement-breakpoint
CREATE INDEX "purchase_requests_location_idx" ON "purchase_requests" ("locationId");--> statement-breakpoint
CREATE INDEX "purchase_requests_status_idx" ON "purchase_requests" ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "recipe_items_recipe_material_idx" ON "recipe_items" ("recipeId","materialId") WHERE "deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "recipe_items_material_idx" ON "recipe_items" ("materialId");--> statement-breakpoint
CREATE INDEX "recipe_items_uom_idx" ON "recipe_items" ("uomId");--> statement-breakpoint
CREATE UNIQUE INDEX "recipes_material_idx" ON "recipes" ("materialId") WHERE "materialId" IS NOT NULL AND "deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "recipes_product_idx" ON "recipes" ("productId") WHERE "productId" IS NOT NULL AND "deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "recipes_product_variant_idx" ON "recipes" ("productVariantId") WHERE "productVariantId" IS NOT NULL AND "deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "roles_code_idx" ON "roles" ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "roles_name_idx" ON "roles" ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "sales_external_refs_source_ext_id_idx" ON "sales_external_refs" ("externalSource","externalOrderId");--> statement-breakpoint
CREATE INDEX "sales_external_refs_order_idx" ON "sales_external_refs" ("orderId");--> statement-breakpoint
CREATE INDEX "sales_invoice_items_invoice_idx" ON "sales_invoice_items" ("invoiceId");--> statement-breakpoint
CREATE INDEX "sales_invoice_items_so_item_idx" ON "sales_invoice_items" ("salesOrderItemId");--> statement-breakpoint
CREATE INDEX "sales_invoices_order_idx" ON "sales_invoices" ("orderId");--> statement-breakpoint
CREATE INDEX "sales_invoices_customer_idx" ON "sales_invoices" ("customerId");--> statement-breakpoint
CREATE INDEX "sales_invoices_status_idx" ON "sales_invoices" ("status");--> statement-breakpoint
CREATE INDEX "sales_order_batches_order_idx" ON "sales_order_batches" ("orderId");--> statement-breakpoint
CREATE INDEX "sales_order_items_order_idx" ON "sales_order_items" ("orderId");--> statement-breakpoint
CREATE INDEX "sales_order_items_product_idx" ON "sales_order_items" ("productId");--> statement-breakpoint
CREATE INDEX "sales_order_items_variant_idx" ON "sales_order_items" ("variantId");--> statement-breakpoint
CREATE INDEX "sales_order_items_batch_idx" ON "sales_order_items" ("batchId");--> statement-breakpoint
CREATE INDEX "sales_orders_location_idx" ON "sales_orders" ("locationId");--> statement-breakpoint
CREATE INDEX "sales_orders_source_idx" ON "sales_orders" ("source");--> statement-breakpoint
CREATE INDEX "sales_orders_status_idx" ON "sales_orders" ("status");--> statement-breakpoint
CREATE INDEX "sales_orders_transaction_date_idx" ON "sales_orders" ("transactionDate");--> statement-breakpoint
CREATE INDEX "sales_orders_customer_idx" ON "sales_orders" ("customerId");--> statement-breakpoint
CREATE INDEX "sales_refunds_order_idx" ON "sales_refunds" ("orderId");--> statement-breakpoint
CREATE INDEX "sales_refunds_item_idx" ON "sales_refunds" ("itemId");--> statement-breakpoint
CREATE INDEX "sales_refunds_date_idx" ON "sales_refunds" ("refundedAt");--> statement-breakpoint
CREATE UNIQUE INDEX "sales_types_code_idx" ON "sales_types" ("code");--> statement-breakpoint
CREATE INDEX "sales_voids_order_idx" ON "sales_voids" ("orderId");--> statement-breakpoint
CREATE INDEX "sales_voids_item_idx" ON "sales_voids" ("itemId");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expired_at_idx" ON "sessions" ("expired_at");--> statement-breakpoint
CREATE INDEX "stock_adj_items_header_idx" ON "stock_adjustment_items" ("adjustmentId");--> statement-breakpoint
CREATE INDEX "stock_adj_items_material_idx" ON "stock_adjustment_items" ("materialId");--> statement-breakpoint
CREATE INDEX "stock_adjustments_location_idx" ON "stock_adjustments" ("locationId");--> statement-breakpoint
CREATE INDEX "stock_adjustments_date_idx" ON "stock_adjustments" ("adjustment_date");--> statement-breakpoint
CREATE INDEX "stock_batches_material_idx" ON "stock_batches" ("materialId");--> statement-breakpoint
CREATE INDEX "stock_batches_expiry_idx" ON "stock_batches" ("expiry_date");--> statement-breakpoint
CREATE UNIQUE INDEX "stock_batches_material_no_idx" ON "stock_batches" ("materialId","batch_no");--> statement-breakpoint
CREATE UNIQUE INDEX "stock_summaries_material_location_date_idx" ON "stock_summaries" ("materialId","locationId","date") WHERE "deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "stock_summaries_location_date_idx" ON "stock_summaries" ("locationId","date");--> statement-breakpoint
CREATE INDEX "stock_summaries_date_idx" ON "stock_summaries" ("date");--> statement-breakpoint
CREATE INDEX "stock_txn_material_location_date_idx" ON "stock_transactions" ("materialId","locationId","date");--> statement-breakpoint
CREATE INDEX "stock_txn_location_date_idx" ON "stock_transactions" ("locationId","date");--> statement-breakpoint
CREATE INDEX "stock_txn_type_date_idx" ON "stock_transactions" ("type","date");--> statement-breakpoint
CREATE INDEX "stock_txn_transfer_idx" ON "stock_transactions" ("transferId");--> statement-breakpoint
CREATE INDEX "stock_txn_reference_no_idx" ON "stock_transactions" ("referenceNo");--> statement-breakpoint
CREATE INDEX "stock_txn_batch_idx" ON "stock_transactions" ("batchId");--> statement-breakpoint
CREATE INDEX "stock_transfer_items_transfer_idx" ON "stock_transfer_items" ("transferId");--> statement-breakpoint
CREATE INDEX "stock_transfer_items_material_idx" ON "stock_transfer_items" ("materialId");--> statement-breakpoint
CREATE INDEX "stock_transfers_source_idx" ON "stock_transfers" ("sourceLocationId");--> statement-breakpoint
CREATE INDEX "stock_transfers_destination_idx" ON "stock_transfers" ("destinationLocationId");--> statement-breakpoint
CREATE INDEX "stock_transfers_status_idx" ON "stock_transfers" ("status");--> statement-breakpoint
CREATE INDEX "stock_transfers_date_idx" ON "stock_transfers" ("transfer_date");--> statement-breakpoint
CREATE UNIQUE INDEX "suppliers_code_idx" ON "suppliers" ("code") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE UNIQUE INDEX "suppliers_name_idx" ON "suppliers" ("name") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE UNIQUE INDEX "taxes_code_idx" ON "taxes" ("code") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE UNIQUE INDEX "uoms_code_idx" ON "uoms" ("code") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE INDEX "user_assignments_user_idx" ON "user_assignments" ("user_id");--> statement-breakpoint
CREATE INDEX "user_assignments_role_idx" ON "user_assignments" ("role_id");--> statement-breakpoint
CREATE INDEX "user_assignments_location_idx" ON "user_assignments" ("location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_assignments_user_location_idx" ON "user_assignments" ("user_id","location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_idx" ON "users" ("username");--> statement-breakpoint
CREATE INDEX "users_default_location_idx" ON "users" ("default_location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "variant_prices_variant_sales_type_idx" ON "variant_prices" ("variantId","salesTypeId");--> statement-breakpoint
CREATE INDEX "variant_prices_sales_type_idx" ON "variant_prices" ("salesTypeId");--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_parent_id_accounts_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "accounts"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_employee_id_employees_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id");--> statement-breakpoint
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id");--> statement-breakpoint
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_shift_id_shifts_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id");--> statement-breakpoint
ALTER TABLE "category_external_mappings" ADD CONSTRAINT "category_external_mappings_WP3yaHxOBCsT_fkey" FOREIGN KEY ("categoryId") REFERENCES "product_categories"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "customer_loyalty_transactions" ADD CONSTRAINT "customer_loyalty_transactions_customer_id_customers_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "expenditures" ADD CONSTRAINT "expenditures_source_account_id_accounts_id_fkey" FOREIGN KEY ("source_account_id") REFERENCES "accounts"("id");--> statement-breakpoint
ALTER TABLE "expenditures" ADD CONSTRAINT "expenditures_target_account_id_accounts_id_fkey" FOREIGN KEY ("target_account_id") REFERENCES "accounts"("id");--> statement-breakpoint
ALTER TABLE "expenditures" ADD CONSTRAINT "expenditures_liability_account_id_accounts_id_fkey" FOREIGN KEY ("liability_account_id") REFERENCES "accounts"("id");--> statement-breakpoint
ALTER TABLE "expenditures" ADD CONSTRAINT "expenditures_supplier_id_suppliers_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id");--> statement-breakpoint
ALTER TABLE "expenditures" ADD CONSTRAINT "expenditures_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id");--> statement-breakpoint
ALTER TABLE "goods_receipt_note_items" ADD CONSTRAINT "goods_receipt_note_items_grnId_goods_receipt_notes_id_fkey" FOREIGN KEY ("grnId") REFERENCES "goods_receipt_notes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "goods_receipt_note_items" ADD CONSTRAINT "goods_receipt_note_items_zPAVPiuWwf9Z_fkey" FOREIGN KEY ("purchaseOrderItemId") REFERENCES "purchase_order_items"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "goods_receipt_note_items" ADD CONSTRAINT "goods_receipt_note_items_materialId_materials_id_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "goods_receipt_notes" ADD CONSTRAINT "goods_receipt_notes_orderId_purchase_orders_id_fkey" FOREIGN KEY ("orderId") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "goods_receipt_notes" ADD CONSTRAINT "goods_receipt_notes_locationId_locations_id_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "goods_receipt_notes" ADD CONSTRAINT "goods_receipt_notes_supplierId_suppliers_id_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "journal_items" ADD CONSTRAINT "journal_items_journal_entry_id_journal_entries_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "journal_items" ADD CONSTRAINT "journal_items_account_id_accounts_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id");--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employee_id_employees_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "material_categories" ADD CONSTRAINT "material_categories_parentId_material_categories_id_fkey" FOREIGN KEY ("parentId") REFERENCES "material_categories"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "material_conversions" ADD CONSTRAINT "material_conversions_materialId_materials_id_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "material_conversions" ADD CONSTRAINT "material_conversions_uomId_uoms_id_fkey" FOREIGN KEY ("uomId") REFERENCES "uoms"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "material_locations" ADD CONSTRAINT "material_locations_materialId_materials_id_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "material_locations" ADD CONSTRAINT "material_locations_locationId_locations_id_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_categoryId_material_categories_id_fkey" FOREIGN KEY ("categoryId") REFERENCES "material_categories"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_baseUomId_uoms_id_fkey" FOREIGN KEY ("baseUomId") REFERENCES "uoms"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_tax_id_taxes_id_fkey" FOREIGN KEY ("tax_id") REFERENCES "taxes"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "moka_configurations" ADD CONSTRAINT "moka_configurations_locationId_locations_id_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "moka_scrap_histories" ADD CONSTRAINT "moka_scrap_histories_5ucxgJtxqdLC_fkey" FOREIGN KEY ("mokaConfigurationId") REFERENCES "moka_configurations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "moka_sync_cursors" ADD CONSTRAINT "moka_sync_cursors_sOj66NS3b5B5_fkey" FOREIGN KEY ("mokaConfigurationId") REFERENCES "moka_configurations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "moka_sync_cursors" ADD CONSTRAINT "moka_sync_cursors_lastHistoryId_moka_scrap_histories_id_fkey" FOREIGN KEY ("lastHistoryId") REFERENCES "moka_scrap_histories"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "payment_invoices" ADD CONSTRAINT "payment_invoices_paymentId_payments_id_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payment_invoices" ADD CONSTRAINT "payment_invoices_salesInvoiceId_sales_invoices_id_fkey" FOREIGN KEY ("salesInvoiceId") REFERENCES "sales_invoices"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payment_invoices" ADD CONSTRAINT "payment_invoices_purchaseInvoiceId_purchase_invoices_id_fkey" FOREIGN KEY ("purchaseInvoiceId") REFERENCES "purchase_invoices"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_account_id_accounts_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "payroll_adjustments" ADD CONSTRAINT "payroll_adjustments_payroll_item_id_payroll_items_id_fkey" FOREIGN KEY ("payroll_item_id") REFERENCES "payroll_items"("id");--> statement-breakpoint
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_batch_id_payroll_batches_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "payroll_batches"("id");--> statement-breakpoint
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_employee_id_employees_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id");--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_parentId_product_categories_id_fkey" FOREIGN KEY ("parentId") REFERENCES "product_categories"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "product_external_mappings" ADD CONSTRAINT "product_external_mappings_productId_products_id_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product_external_mappings" ADD CONSTRAINT "product_external_mappings_variantId_product_variants_id_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_productId_products_id_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_salesTypeId_sales_types_id_fkey" FOREIGN KEY ("salesTypeId") REFERENCES "sales_types"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_products_id_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_locationId_locations_id_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_product_categories_id_fkey" FOREIGN KEY ("categoryId") REFERENCES "product_categories"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_tax_id_taxes_id_fkey" FOREIGN KEY ("tax_id") REFERENCES "taxes"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "purchase_invoice_items" ADD CONSTRAINT "purchase_invoice_items_invoiceId_purchase_invoices_id_fkey" FOREIGN KEY ("invoiceId") REFERENCES "purchase_invoices"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "purchase_invoice_items" ADD CONSTRAINT "purchase_invoice_items_150OkKd1xoKC_fkey" FOREIGN KEY ("purchaseOrderItemId") REFERENCES "purchase_order_items"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "purchase_invoice_items" ADD CONSTRAINT "purchase_invoice_items_materialId_materials_id_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_orderId_purchase_orders_id_fkey" FOREIGN KEY ("orderId") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_supplierId_suppliers_id_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_locationId_locations_id_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_orderId_purchase_orders_id_fkey" FOREIGN KEY ("orderId") REFERENCES "purchase_orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_XwU4uWx0rrcY_fkey" FOREIGN KEY ("requestItemId") REFERENCES "purchase_request_items"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_materialId_materials_id_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_requestId_purchase_requests_id_fkey" FOREIGN KEY ("requestId") REFERENCES "purchase_requests"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_locationId_locations_id_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplierId_suppliers_id_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "purchase_request_items" ADD CONSTRAINT "purchase_request_items_requestId_purchase_requests_id_fkey" FOREIGN KEY ("requestId") REFERENCES "purchase_requests"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "purchase_request_items" ADD CONSTRAINT "purchase_request_items_materialId_materials_id_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_locationId_locations_id_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_recipeId_recipes_id_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_materialId_materials_id_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_uomId_uoms_id_fkey" FOREIGN KEY ("uomId") REFERENCES "uoms"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_materialId_materials_id_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_productId_products_id_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_productVariantId_product_variants_id_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sales_external_refs" ADD CONSTRAINT "sales_external_refs_orderId_sales_orders_id_fkey" FOREIGN KEY ("orderId") REFERENCES "sales_orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sales_invoice_items" ADD CONSTRAINT "sales_invoice_items_invoiceId_sales_invoices_id_fkey" FOREIGN KEY ("invoiceId") REFERENCES "sales_invoices"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sales_invoice_items" ADD CONSTRAINT "sales_invoice_items_salesOrderItemId_sales_order_items_id_fkey" FOREIGN KEY ("salesOrderItemId") REFERENCES "sales_order_items"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "sales_invoice_items" ADD CONSTRAINT "sales_invoice_items_productId_products_id_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "sales_invoice_items" ADD CONSTRAINT "sales_invoice_items_variantId_product_variants_id_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_orderId_sales_orders_id_fkey" FOREIGN KEY ("orderId") REFERENCES "sales_orders"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_customerId_customers_id_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_locationId_locations_id_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "sales_order_batches" ADD CONSTRAINT "sales_order_batches_orderId_sales_orders_id_fkey" FOREIGN KEY ("orderId") REFERENCES "sales_orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_orderId_sales_orders_id_fkey" FOREIGN KEY ("orderId") REFERENCES "sales_orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_batchId_sales_order_batches_id_fkey" FOREIGN KEY ("batchId") REFERENCES "sales_order_batches"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_productId_products_id_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_variantId_product_variants_id_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_locationId_locations_id_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_customerId_customers_id_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_salesTypeId_sales_types_id_fkey" FOREIGN KEY ("salesTypeId") REFERENCES "sales_types"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "sales_refunds" ADD CONSTRAINT "sales_refunds_orderId_sales_orders_id_fkey" FOREIGN KEY ("orderId") REFERENCES "sales_orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sales_refunds" ADD CONSTRAINT "sales_refunds_itemId_sales_order_items_id_fkey" FOREIGN KEY ("itemId") REFERENCES "sales_order_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sales_refunds" ADD CONSTRAINT "sales_refunds_refundedBy_users_id_fkey" FOREIGN KEY ("refundedBy") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "sales_voids" ADD CONSTRAINT "sales_voids_orderId_sales_orders_id_fkey" FOREIGN KEY ("orderId") REFERENCES "sales_orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sales_voids" ADD CONSTRAINT "sales_voids_itemId_sales_order_items_id_fkey" FOREIGN KEY ("itemId") REFERENCES "sales_order_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sales_voids" ADD CONSTRAINT "sales_voids_voidedBy_users_id_fkey" FOREIGN KEY ("voidedBy") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "stock_adjustment_items" ADD CONSTRAINT "stock_adjustment_items_adjustmentId_stock_adjustments_id_fkey" FOREIGN KEY ("adjustmentId") REFERENCES "stock_adjustments"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "stock_adjustment_items" ADD CONSTRAINT "stock_adjustment_items_materialId_materials_id_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "stock_adjustment_items" ADD CONSTRAINT "stock_adjustment_items_batchId_stock_batches_id_fkey" FOREIGN KEY ("batchId") REFERENCES "stock_batches"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_locationId_locations_id_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "stock_batches" ADD CONSTRAINT "stock_batches_materialId_materials_id_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "stock_summaries" ADD CONSTRAINT "stock_summaries_materialId_materials_id_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "stock_summaries" ADD CONSTRAINT "stock_summaries_locationId_locations_id_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_materialId_materials_id_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_locationId_locations_id_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_batchId_stock_batches_id_fkey" FOREIGN KEY ("batchId") REFERENCES "stock_batches"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_counterpartLocationId_locations_id_fkey" FOREIGN KEY ("counterpartLocationId") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_aDUmNPy8WiJw_fkey" FOREIGN KEY ("adjustmentItemId") REFERENCES "stock_adjustment_items"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "stock_transfer_items" ADD CONSTRAINT "stock_transfer_items_transferId_stock_transfers_id_fkey" FOREIGN KEY ("transferId") REFERENCES "stock_transfers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "stock_transfer_items" ADD CONSTRAINT "stock_transfer_items_materialId_materials_id_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_sourceLocationId_locations_id_fkey" FOREIGN KEY ("sourceLocationId") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_destinationLocationId_locations_id_fkey" FOREIGN KEY ("destinationLocationId") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "taxes" ADD CONSTRAINT "taxes_account_id_accounts_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "user_assignments" ADD CONSTRAINT "user_assignments_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_assignments" ADD CONSTRAINT "user_assignments_role_id_roles_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "user_assignments" ADD CONSTRAINT "user_assignments_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "user_assignments" ADD CONSTRAINT "user_assignments_added_by_users_id_fkey" FOREIGN KEY ("added_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_default_location_id_locations_id_fkey" FOREIGN KEY ("default_location_id") REFERENCES "locations"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "variant_prices" ADD CONSTRAINT "variant_prices_variantId_product_variants_id_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "variant_prices" ADD CONSTRAINT "variant_prices_salesTypeId_sales_types_id_fkey" FOREIGN KEY ("salesTypeId") REFERENCES "sales_types"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_recipeId_recipes_id_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id");--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_locationId_locations_id_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id");