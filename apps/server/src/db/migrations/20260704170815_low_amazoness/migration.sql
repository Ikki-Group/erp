CREATE TYPE "account_type" AS ENUM('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');--> statement-breakpoint
CREATE TYPE "attendance_status" AS ENUM('present', 'absent', 'late', 'on_leave');--> statement-breakpoint
CREATE TYPE "audit_action" AS ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'OTHER');--> statement-breakpoint
CREATE TYPE "batch_status" AS ENUM('pending', 'prepared', 'delivered', 'cancelled');--> statement-breakpoint
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
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" integer
);
--> statement-breakpoint
CREATE TABLE "attendances" (
	"id" serial PRIMARY KEY,
	"employee_id" integer NOT NULL,
	"location_id" integer NOT NULL,
	"shift_id" integer,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"clock_in" timestamp with time zone,
	"clock_out" timestamp with time zone,
	"status" "attendance_status" DEFAULT 'present'::"attendance_status" NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" integer
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL,
	"action" "audit_action" NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"description" text NOT NULL,
	"old_value" jsonb,
	"new_value" jsonb,
	"ip_address" text,
	"user_agent" text,
	"action_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_settings" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"address" text,
	"phone" text,
	"email" text,
	"tax_id" text,
	"tax_rate" numeric(5,2) DEFAULT '0' NOT NULL,
	"logo_url" text,
	"invoice_footer" text,
	"receipt_footer" text,
	"currency_code" text DEFAULT 'IDR' NOT NULL,
	"currency_symbol" text DEFAULT 'Rp' NOT NULL,
	"settings" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	CONSTRAINT "company_settings_tax_rate_range_chk" CHECK ("tax_rate" between 0 and 100)
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
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	CONSTRAINT "customer_loyalty_txn_balance_nonneg_chk" CHECK ("balance_after" >= 0)
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
	"date_of_birth" timestamp with time zone,
	"tier" "customer_tier" DEFAULT 'bronze'::"customer_tier",
	"points_balance" integer DEFAULT 0 NOT NULL,
	"total_points_earned" integer DEFAULT 0 NOT NULL,
	"registered_at" timestamp with time zone DEFAULT now(),
	"last_visit_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	CONSTRAINT "customers_points_balance_nonneg_chk" CHECK ("points_balance" >= 0),
	CONSTRAINT "customers_total_points_earned_nonneg_chk" CHECK ("total_points_earned" >= 0)
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
	"base_salary" numeric(18,2) DEFAULT '0' NOT NULL,
	"bank_account" text,
	"hire_date" timestamp with time zone,
	"termination_date" timestamp with time zone,
	"emergency_contact" text,
	"user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" integer,
	CONSTRAINT "employees_base_salary_nonneg_chk" CHECK ("base_salary" >= 0)
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
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" integer,
	CONSTRAINT "expenditures_amount_pos_chk" CHECK ("amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "goods_receipt_note_items" (
	"id" serial PRIMARY KEY,
	"grn_id" integer NOT NULL,
	"purchase_order_item_id" integer NOT NULL,
	"material_id" integer,
	"item_name" text NOT NULL,
	"quantity_received" numeric(18,6) DEFAULT '0' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" integer,
	CONSTRAINT "goods_receipt_note_items_qty_pos_chk" CHECK ("quantity_received" > 0)
);
--> statement-breakpoint
CREATE TABLE "goods_receipt_notes" (
	"id" serial PRIMARY KEY,
	"order_id" integer NOT NULL,
	"location_id" integer NOT NULL,
	"supplier_id" integer NOT NULL,
	"receive_date" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "goods_receipt_status" DEFAULT 'open'::"goods_receipt_status" NOT NULL,
	"reference_number" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" integer
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
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" integer
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
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" integer,
	CONSTRAINT "journal_items_debit_nonneg_chk" CHECK ("debit" >= 0),
	CONSTRAINT "journal_items_credit_nonneg_chk" CHECK ("credit" >= 0)
);
--> statement-breakpoint
CREATE TABLE "leave_requests" (
	"id" serial PRIMARY KEY,
	"employee_id" integer NOT NULL,
	"type" "leave_type" NOT NULL,
	"status" "leave_status" DEFAULT 'pending'::"leave_status" NOT NULL,
	"date_start" timestamp with time zone NOT NULL,
	"date_end" timestamp with time zone NOT NULL,
	"reason" text NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" integer,
	CONSTRAINT "leave_requests_date_range_chk" CHECK ("date_end" >= "date_start")
);
--> statement-breakpoint
CREATE TABLE "location_payment_methods" (
	"id" serial PRIMARY KEY,
	"location_id" integer NOT NULL,
	"payment_method_id" integer NOT NULL,
	"payment_provider_id" integer,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"credentials" jsonb,
	"config" jsonb,
	"enabled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL
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
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "material_conversions" (
	"id" serial PRIMARY KEY,
	"material_id" integer NOT NULL,
	"uom_id" integer NOT NULL,
	"to_base_factor" numeric(18,6) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	CONSTRAINT "material_conversions_factor_chk" CHECK ("to_base_factor" > 0)
);
--> statement-breakpoint
CREATE TABLE "material_locations" (
	"id" serial PRIMARY KEY,
	"material_id" integer NOT NULL,
	"location_id" integer NOT NULL,
	"min_stock" numeric(18,6) DEFAULT '0' NOT NULL,
	"max_stock" numeric(18,6),
	"reorder_point" numeric(18,6) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	CONSTRAINT "material_locations_stock_range_chk" CHECK (((("max_stock" is null)) or ((("max_stock" >= "min_stock") and ("max_stock" >= "reorder_point")))))
);
--> statement-breakpoint
CREATE TABLE "material_stock_snapshots" (
	"id" serial PRIMARY KEY,
	"material_id" integer NOT NULL,
	"location_id" integer NOT NULL,
	"current_qty" numeric(18,6) DEFAULT '0' NOT NULL,
	"current_avg_cost" numeric(18,6) DEFAULT '0' NOT NULL,
	"current_value" numeric(18,6) DEFAULT '0' NOT NULL,
	"snapshot_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "material_stock_snapshots_qty_chk" CHECK ("current_qty" >= 0),
	CONSTRAINT "material_stock_snapshots_cost_chk" CHECK ((("current_avg_cost" >= 0) and ("current_value" >= 0)))
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" serial PRIMARY KEY,
	"sku" text NOT NULL,
	"name" text NOT NULL,
	"type" "material_type" NOT NULL,
	"description" text,
	"category_id" integer NOT NULL,
	"base_uom_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moka_configurations" (
	"id" serial PRIMARY KEY,
	"location_id" integer NOT NULL,
	"provider" "integration_provider" DEFAULT 'moka'::"integration_provider" NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"business_id" text,
	"outlet_id" text,
	"access_token" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sales_cron_enabled" boolean DEFAULT false NOT NULL,
	"sales_cron_expression" text,
	"last_synced_at" timestamp with time zone,
	"last_sales_synced_at" timestamp with time zone,
	"last_product_synced_at" timestamp with time zone,
	"last_category_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moka_scrap_histories" (
	"id" serial PRIMARY KEY,
	"moka_configuration_id" integer NOT NULL,
	"provider" "integration_provider" DEFAULT 'moka'::"integration_provider" NOT NULL,
	"type" "moka_scrap_type" NOT NULL,
	"trigger_mode" "moka_sync_trigger_mode" DEFAULT 'manual'::"moka_sync_trigger_mode" NOT NULL,
	"status" "moka_scrap_status" DEFAULT 'pending'::"moka_scrap_status" NOT NULL,
	"date_from" timestamp with time zone NOT NULL,
	"date_to" timestamp with time zone NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"records_count" integer DEFAULT 0 NOT NULL,
	"raw_path" text,
	"error_message" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moka_sync_cursors" (
	"id" serial PRIMARY KEY,
	"moka_configuration_id" integer NOT NULL,
	"type" "moka_scrap_type" NOT NULL,
	"provider" "integration_provider" DEFAULT 'moka'::"integration_provider" NOT NULL,
	"cursor_date" timestamp with time zone,
	"cursor_token" text,
	"last_history_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_invoices" (
	"id" serial PRIMARY KEY,
	"payment_id" integer NOT NULL,
	"sales_invoice_id" integer,
	"purchase_invoice_id" integer,
	"amount" numeric(18,2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	CONSTRAINT "payment_invoices_amount_pos_chk" CHECK ("amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" serial PRIMARY KEY,
	"type" "payment_method" NOT NULL,
	"category" "payment_method_category" NOT NULL,
	"name" text NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_global" boolean DEFAULT false NOT NULL,
	"payment_provider_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_providers" (
	"id" serial PRIMARY KEY,
	"code" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"description" text,
	"website_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL
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
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	CONSTRAINT "payments_amount_pos_chk" CHECK ("amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "payroll_adjustments" (
	"id" serial PRIMARY KEY,
	"payroll_item_id" integer NOT NULL,
	"type" "payroll_adjustment_type" NOT NULL,
	"amount" numeric(18,2) DEFAULT '0' NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" integer
);
--> statement-breakpoint
CREATE TABLE "payroll_batches" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"period_month" integer NOT NULL,
	"period_year" integer NOT NULL,
	"status" "payroll_status" DEFAULT 'draft'::"payroll_status" NOT NULL,
	"total_amount" numeric(18,2) DEFAULT '0' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" integer,
	CONSTRAINT "payroll_batches_total_nonneg_chk" CHECK ("total_amount" >= 0),
	CONSTRAINT "payroll_batches_month_range_chk" CHECK ("period_month" between 1 and 12)
);
--> statement-breakpoint
CREATE TABLE "payroll_items" (
	"id" serial PRIMARY KEY,
	"batch_id" integer NOT NULL,
	"employee_id" integer NOT NULL,
	"base_salary" numeric(18,2) DEFAULT '0' NOT NULL,
	"adjustments_amount" numeric(18,2) DEFAULT '0' NOT NULL,
	"service_charge_amount" numeric(18,2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(18,2) DEFAULT '0' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" integer,
	CONSTRAINT "payroll_items_base_salary_nonneg_chk" CHECK ("base_salary" >= 0),
	CONSTRAINT "payroll_items_total_nonneg_chk" CHECK ("total_amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" serial PRIMARY KEY,
	"location_id" integer NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_prices" (
	"id" serial PRIMARY KEY,
	"product_id" integer NOT NULL,
	"sales_type_id" integer NOT NULL,
	"price" numeric(18,6) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	CONSTRAINT "product_prices_price_chk" CHECK ("price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "product_variant_prices" (
	"id" serial PRIMARY KEY,
	"variant_id" integer NOT NULL,
	"sales_type_id" integer NOT NULL,
	"price" numeric(18,6) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	CONSTRAINT "variant_prices_price_chk" CHECK ("price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" serial PRIMARY KEY,
	"product_id" integer NOT NULL,
	"name" text NOT NULL,
	"sku" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"base_price" numeric(18,6) DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	CONSTRAINT "product_variants_base_price_chk" CHECK ("base_price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY,
	"location_id" integer NOT NULL,
	"category_id" integer,
	"name" text NOT NULL,
	"description" text,
	"sku" text NOT NULL,
	"status" "product_status" DEFAULT 'active'::"product_status" NOT NULL,
	"has_variants" boolean DEFAULT false NOT NULL,
	"has_sales_type_pricing" boolean DEFAULT false NOT NULL,
	"base_price" numeric(18,6) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	CONSTRAINT "products_base_price_chk" CHECK ("base_price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "purchase_invoice_items" (
	"id" serial PRIMARY KEY,
	"invoice_id" integer NOT NULL,
	"purchase_order_item_id" integer,
	"material_id" integer,
	"item_name" text NOT NULL,
	"quantity" numeric(18,6) DEFAULT '0' NOT NULL,
	"unit_price" numeric(18,2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(18,2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(18,2) DEFAULT '0' NOT NULL,
	"subtotal" numeric(18,2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" integer,
	CONSTRAINT "purchase_invoice_items_qty_pos_chk" CHECK ("quantity" > 0),
	CONSTRAINT "purchase_invoice_items_unit_price_nonneg_chk" CHECK ("unit_price" >= 0),
	CONSTRAINT "purchase_invoice_items_tax_nonneg_chk" CHECK ("tax_amount" >= 0),
	CONSTRAINT "purchase_invoice_items_discount_nonneg_chk" CHECK ("discount_amount" >= 0),
	CONSTRAINT "purchase_invoice_items_subtotal_nonneg_chk" CHECK ("subtotal" >= 0)
);
--> statement-breakpoint
CREATE TABLE "purchase_invoices" (
	"id" serial PRIMARY KEY,
	"order_id" integer NOT NULL,
	"supplier_id" integer NOT NULL,
	"location_id" integer NOT NULL,
	"status" "invoice_status" DEFAULT 'draft'::"invoice_status" NOT NULL,
	"invoice_date" timestamp with time zone DEFAULT now() NOT NULL,
	"due_date" timestamp with time zone,
	"external_invoice_number" text,
	"total_amount" numeric(18,2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(18,2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(18,2) DEFAULT '0' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" integer,
	CONSTRAINT "purchase_invoices_total_nonneg_chk" CHECK ("total_amount" >= 0),
	CONSTRAINT "purchase_invoices_tax_nonneg_chk" CHECK ("tax_amount" >= 0),
	CONSTRAINT "purchase_invoices_discount_nonneg_chk" CHECK ("discount_amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "purchase_order_items" (
	"id" serial PRIMARY KEY,
	"order_id" integer NOT NULL,
	"request_item_id" integer,
	"material_id" integer,
	"item_name" text NOT NULL,
	"quantity" numeric(18,6) DEFAULT '1' NOT NULL,
	"unit_price" numeric(18,2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(18,2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(18,2) DEFAULT '0' NOT NULL,
	"subtotal" numeric(18,2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" integer,
	CONSTRAINT "purchase_order_items_qty_pos_chk" CHECK ("quantity" > 0),
	CONSTRAINT "purchase_order_items_unit_price_nonneg_chk" CHECK ("unit_price" >= 0),
	CONSTRAINT "purchase_order_items_discount_nonneg_chk" CHECK ("discount_amount" >= 0),
	CONSTRAINT "purchase_order_items_tax_nonneg_chk" CHECK ("tax_amount" >= 0),
	CONSTRAINT "purchase_order_items_subtotal_nonneg_chk" CHECK ("subtotal" >= 0)
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" serial PRIMARY KEY,
	"request_id" integer,
	"location_id" integer NOT NULL,
	"supplier_id" integer NOT NULL,
	"status" "purchase_order_status" DEFAULT 'open'::"purchase_order_status" NOT NULL,
	"transaction_date" timestamp with time zone DEFAULT now() NOT NULL,
	"expected_delivery_date" timestamp with time zone,
	"total_amount" numeric(18,2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(18,2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(18,2) DEFAULT '0' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" integer,
	CONSTRAINT "purchase_orders_total_nonneg_chk" CHECK ("total_amount" >= 0),
	CONSTRAINT "purchase_orders_discount_nonneg_chk" CHECK ("discount_amount" >= 0),
	CONSTRAINT "purchase_orders_tax_nonneg_chk" CHECK ("tax_amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "purchase_request_items" (
	"id" serial PRIMARY KEY,
	"request_id" integer NOT NULL,
	"material_id" integer,
	"item_name" text NOT NULL,
	"quantity" numeric(18,6) DEFAULT '1' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" integer,
	CONSTRAINT "purchase_request_items_qty_pos_chk" CHECK ("quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "purchase_requests" (
	"id" serial PRIMARY KEY,
	"location_id" integer NOT NULL,
	"requested_by" integer NOT NULL,
	"status" "purchase_request_status" DEFAULT 'open'::"purchase_request_status" NOT NULL,
	"request_date" timestamp with time zone DEFAULT now() NOT NULL,
	"expected_date" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" integer
);
--> statement-breakpoint
CREATE TABLE "recipe_items" (
	"id" serial PRIMARY KEY,
	"recipe_id" integer NOT NULL,
	"material_id" integer NOT NULL,
	"qty" numeric(18,6) NOT NULL,
	"uom_id" integer NOT NULL,
	"scrap_percentage" numeric(5,2) DEFAULT '0' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" integer,
	CONSTRAINT "recipe_items_qty_chk" CHECK ("qty" > 0),
	CONSTRAINT "recipe_items_scrap_pct_chk" CHECK ((("scrap_percentage" >= 0) and ("scrap_percentage" < 100)))
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" serial PRIMARY KEY,
	"material_id" integer,
	"product_id" integer,
	"product_variant_id" integer,
	"name" text,
	"target_qty" numeric(18,6) DEFAULT '1' NOT NULL,
	"target_uom_id" integer NOT NULL,
	"instructions" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" integer,
	CONSTRAINT "recipes_target_xor_chk" CHECK (((((("material_id" is not null)) and (("product_id" is null)) and (("product_variant_id" is null)))) or (((("material_id" is null)) and (("product_id" is not null)) and (("product_variant_id" is null)))) or (((("material_id" is null)) and (("product_id" is null)) and (("product_variant_id" is not null)))))),
	CONSTRAINT "recipes_target_qty_chk" CHECK ("target_qty" > 0)
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
	"order_id" integer NOT NULL,
	"external_source" text NOT NULL,
	"external_order_id" text NOT NULL,
	"raw_payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_invoice_items" (
	"id" serial PRIMARY KEY,
	"invoice_id" integer NOT NULL,
	"sales_order_item_id" integer,
	"product_id" integer,
	"variant_id" integer,
	"item_name" text NOT NULL,
	"quantity" numeric(18,6) DEFAULT '0' NOT NULL,
	"unit_price" numeric(18,2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(18,2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(18,2) DEFAULT '0' NOT NULL,
	"subtotal" numeric(18,2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	CONSTRAINT "sales_invoice_items_qty_pos_chk" CHECK ("quantity" > 0),
	CONSTRAINT "sales_invoice_items_unit_price_nonneg_chk" CHECK ("unit_price" >= 0),
	CONSTRAINT "sales_invoice_items_tax_nonneg_chk" CHECK ("tax_amount" >= 0),
	CONSTRAINT "sales_invoice_items_discount_nonneg_chk" CHECK ("discount_amount" >= 0),
	CONSTRAINT "sales_invoice_items_subtotal_nonneg_chk" CHECK ("subtotal" >= 0)
);
--> statement-breakpoint
CREATE TABLE "sales_invoices" (
	"id" serial PRIMARY KEY,
	"order_id" integer NOT NULL,
	"customer_id" integer,
	"location_id" integer NOT NULL,
	"status" "invoice_status" DEFAULT 'draft'::"invoice_status" NOT NULL,
	"invoice_date" timestamp with time zone DEFAULT now() NOT NULL,
	"due_date" timestamp with time zone,
	"total_amount" numeric(18,2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(18,2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(18,2) DEFAULT '0' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	CONSTRAINT "sales_invoices_total_nonneg_chk" CHECK ("total_amount" >= 0),
	CONSTRAINT "sales_invoices_tax_nonneg_chk" CHECK ("tax_amount" >= 0),
	CONSTRAINT "sales_invoices_discount_nonneg_chk" CHECK ("discount_amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "sales_order_batches" (
	"id" serial PRIMARY KEY,
	"order_id" integer NOT NULL,
	"batch_number" numeric(5,0) NOT NULL,
	"status" "batch_status" DEFAULT 'pending'::"batch_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_order_items" (
	"id" serial PRIMARY KEY,
	"order_id" integer NOT NULL,
	"batch_id" integer,
	"product_id" integer,
	"variant_id" integer,
	"item_name" text NOT NULL,
	"quantity" numeric(18,6) DEFAULT '1' NOT NULL,
	"unit_price" numeric(18,2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(18,2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(18,2) DEFAULT '0' NOT NULL,
	"subtotal" numeric(18,2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	CONSTRAINT "sales_order_items_qty_pos_chk" CHECK ("quantity" > 0),
	CONSTRAINT "sales_order_items_unit_price_nonneg_chk" CHECK ("unit_price" >= 0),
	CONSTRAINT "sales_order_items_discount_nonneg_chk" CHECK ("discount_amount" >= 0),
	CONSTRAINT "sales_order_items_tax_nonneg_chk" CHECK ("tax_amount" >= 0),
	CONSTRAINT "sales_order_items_subtotal_nonneg_chk" CHECK ("subtotal" >= 0)
);
--> statement-breakpoint
CREATE TABLE "sales_orders" (
	"id" serial PRIMARY KEY,
	"location_id" integer NOT NULL,
	"customer_id" integer,
	"sales_type_id" integer NOT NULL,
	"source" "sales_order_source" DEFAULT 'web'::"sales_order_source" NOT NULL,
	"status" "sales_order_status" DEFAULT 'open'::"sales_order_status" NOT NULL,
	"transaction_date" timestamp with time zone DEFAULT now() NOT NULL,
	"total_amount" numeric(18,2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(18,2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(18,2) DEFAULT '0' NOT NULL,
	"gratuity_amount" numeric(18,2) DEFAULT '0' NOT NULL,
	"refund_amount" numeric(18,2) DEFAULT '0' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	CONSTRAINT "sales_orders_total_nonneg_chk" CHECK ("total_amount" >= 0),
	CONSTRAINT "sales_orders_discount_nonneg_chk" CHECK ("discount_amount" >= 0),
	CONSTRAINT "sales_orders_tax_nonneg_chk" CHECK ("tax_amount" >= 0),
	CONSTRAINT "sales_orders_gratuity_nonneg_chk" CHECK ("gratuity_amount" >= 0),
	CONSTRAINT "sales_orders_refund_nonneg_chk" CHECK ("refund_amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "sales_refunds" (
	"id" serial PRIMARY KEY,
	"order_id" integer NOT NULL,
	"item_id" integer,
	"amount" numeric(18,2) NOT NULL,
	"reason" text,
	"refunded_by" integer,
	"refunded_at" timestamp with time zone NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	CONSTRAINT "sales_refunds_amount_pos_chk" CHECK ("amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "sales_types" (
	"id" serial PRIMARY KEY,
	"location_id" integer,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	CONSTRAINT "sales_types_system_global_chk" CHECK (((not "is_system") or (("location_id" is null))))
);
--> statement-breakpoint
CREATE TABLE "sales_voids" (
	"id" serial PRIMARY KEY,
	"order_id" integer NOT NULL,
	"item_id" integer,
	"reason" text,
	"voided_by" integer,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL,
	"location_id" integer NOT NULL,
	"ip_address" text,
	"user_agent" varchar(512),
	"revoked_at" timestamp with time zone,
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
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" integer
);
--> statement-breakpoint
CREATE TABLE "stock_adjustment_items" (
	"id" serial PRIMARY KEY,
	"adjustment_id" integer NOT NULL,
	"material_id" integer NOT NULL,
	"batch_id" integer,
	"qty_diff" numeric(18,6) NOT NULL,
	"unit_cost" numeric(18,2) NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" integer,
	CONSTRAINT "stock_adj_items_unit_cost_nonneg_chk" CHECK ("unit_cost" >= 0)
);
--> statement-breakpoint
CREATE TABLE "stock_adjustments" (
	"id" serial PRIMARY KEY,
	"location_id" integer NOT NULL,
	"type" "stock_adjustment_type" NOT NULL,
	"adjustment_date" timestamp with time zone DEFAULT now() NOT NULL,
	"reason" text,
	"reference_no" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" integer
);
--> statement-breakpoint
CREATE TABLE "stock_batches" (
	"id" serial PRIMARY KEY,
	"material_id" integer NOT NULL,
	"batch_no" text NOT NULL,
	"expiry_date" timestamp,
	"production_date" timestamp,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" integer
);
--> statement-breakpoint
CREATE TABLE "stock_summaries" (
	"id" serial PRIMARY KEY,
	"material_id" integer NOT NULL,
	"location_id" integer NOT NULL,
	"date" date NOT NULL,
	"opening_qty" numeric(18,6) DEFAULT '0' NOT NULL,
	"opening_avg_cost" numeric(18,2) DEFAULT '0' NOT NULL,
	"opening_value" numeric(18,2) DEFAULT '0' NOT NULL,
	"purchase_qty" numeric(18,6) DEFAULT '0' NOT NULL,
	"purchase_value" numeric(18,2) DEFAULT '0' NOT NULL,
	"transfer_in_qty" numeric(18,6) DEFAULT '0' NOT NULL,
	"transfer_in_value" numeric(18,2) DEFAULT '0' NOT NULL,
	"transfer_out_qty" numeric(18,6) DEFAULT '0' NOT NULL,
	"transfer_out_value" numeric(18,2) DEFAULT '0' NOT NULL,
	"adjustment_qty" numeric(18,6) DEFAULT '0' NOT NULL,
	"adjustment_value" numeric(18,2) DEFAULT '0' NOT NULL,
	"usage_qty" numeric(18,6) DEFAULT '0' NOT NULL,
	"usage_value" numeric(18,2) DEFAULT '0' NOT NULL,
	"production_in_qty" numeric(18,6) DEFAULT '0' NOT NULL,
	"production_in_value" numeric(18,2) DEFAULT '0' NOT NULL,
	"production_out_qty" numeric(18,6) DEFAULT '0' NOT NULL,
	"production_out_value" numeric(18,2) DEFAULT '0' NOT NULL,
	"sell_qty" numeric(18,6) DEFAULT '0' NOT NULL,
	"sell_value" numeric(18,2) DEFAULT '0' NOT NULL,
	"closing_qty" numeric(18,6) DEFAULT '0' NOT NULL,
	"closing_avg_cost" numeric(18,2) DEFAULT '0' NOT NULL,
	"closing_value" numeric(18,2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" integer
);
--> statement-breakpoint
CREATE TABLE "stock_transactions" (
	"id" serial PRIMARY KEY,
	"material_id" integer NOT NULL,
	"location_id" integer NOT NULL,
	"type" "transaction_type" NOT NULL,
	"date" date NOT NULL,
	"reference_no" text NOT NULL,
	"notes" text,
	"batch_id" integer,
	"qty" numeric(18,6) NOT NULL,
	"unit_cost" numeric(18,2) NOT NULL,
	"total_cost" numeric(18,2) NOT NULL,
	"counterpart_location_id" integer,
	"transfer_id" integer,
	"running_qty" numeric(18,6) NOT NULL,
	"running_avg_cost" numeric(18,2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" integer,
	CONSTRAINT "stock_txn_unit_cost_nonneg_chk" CHECK ("unit_cost" >= 0),
	CONSTRAINT "stock_txn_total_cost_nonneg_chk" CHECK ("total_cost" >= 0)
);
--> statement-breakpoint
CREATE TABLE "stock_transfer_items" (
	"id" serial PRIMARY KEY,
	"transfer_id" integer NOT NULL,
	"material_id" integer NOT NULL,
	"item_name" text NOT NULL,
	"quantity" numeric(18,6) NOT NULL,
	"unit_cost" numeric(18,2) NOT NULL,
	"total_cost" numeric(18,2) NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" integer,
	CONSTRAINT "stock_transfer_items_qty_pos_chk" CHECK ("quantity" > 0),
	CONSTRAINT "stock_transfer_items_unit_cost_nonneg_chk" CHECK ("unit_cost" >= 0),
	CONSTRAINT "stock_transfer_items_total_cost_nonneg_chk" CHECK ("total_cost" >= 0)
);
--> statement-breakpoint
CREATE TABLE "stock_transfers" (
	"id" serial PRIMARY KEY,
	"source_location_id" integer NOT NULL,
	"destination_location_id" integer NOT NULL,
	"status" text DEFAULT 'pending_approval' NOT NULL,
	"transfer_date" timestamp with time zone NOT NULL,
	"expected_date" timestamp with time zone,
	"received_date" timestamp with time zone,
	"reference_no" text NOT NULL,
	"notes" text,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" integer,
	CONSTRAINT "stock_transfers_different_locations_chk" CHECK ("source_location_id" <> "destination_location_id")
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
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" integer
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
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" integer,
	CONSTRAINT "taxes_rate_range_chk" CHECK ("rate" between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE "uoms" (
	"id" serial PRIMARY KEY,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL
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
	"pin_code" text,
	"password_hash" text,
	"is_root" boolean DEFAULT false NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"default_location_id" integer,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_orders" (
	"id" serial PRIMARY KEY,
	"recipe_id" integer NOT NULL,
	"location_id" integer NOT NULL,
	"status" "work_order_status" DEFAULT 'draft'::"work_order_status" NOT NULL,
	"expected_qty" numeric(18,6) NOT NULL,
	"actual_qty" numeric(18,6) DEFAULT '0' NOT NULL,
	"note" text,
	"total_cost" numeric(18,2) DEFAULT '0' NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" integer,
	CONSTRAINT "work_orders_expected_qty_pos_chk" CHECK ("expected_qty" > 0),
	CONSTRAINT "work_orders_actual_qty_nonneg_chk" CHECK ("actual_qty" >= 0),
	CONSTRAINT "work_orders_total_cost_nonneg_chk" CHECK ("total_cost" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_code_idx" ON "accounts" ("code") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE INDEX "attendances_employee_idx" ON "attendances" ("employee_id");--> statement-breakpoint
CREATE INDEX "attendances_location_idx" ON "attendances" ("location_id");--> statement-breakpoint
CREATE INDEX "attendances_date_idx" ON "attendances" ("date");--> statement-breakpoint
CREATE INDEX "attendances_shift_idx" ON "attendances" ("shift_id");--> statement-breakpoint
CREATE INDEX "audit_logs_user_idx" ON "audit_logs" ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" ("action");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_action_at_idx" ON "audit_logs" ("action_at");--> statement-breakpoint
CREATE INDEX "customer_loyalty_txn_customer_idx" ON "customer_loyalty_transactions" ("customer_id");--> statement-breakpoint
CREATE INDEX "customer_loyalty_txn_type_idx" ON "customer_loyalty_transactions" ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_code_idx" ON "customers" ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_name_idx" ON "customers" ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "employees_code_idx" ON "employees" ("code");--> statement-breakpoint
CREATE INDEX "employees_user_idx" ON "employees" ("user_id");--> statement-breakpoint
CREATE INDEX "expenditures_date_idx" ON "expenditures" ("date");--> statement-breakpoint
CREATE INDEX "expenditures_location_idx" ON "expenditures" ("location_id");--> statement-breakpoint
CREATE INDEX "expenditures_type_idx" ON "expenditures" ("type");--> statement-breakpoint
CREATE INDEX "expenditures_status_idx" ON "expenditures" ("status");--> statement-breakpoint
CREATE INDEX "expenditures_source_account_idx" ON "expenditures" ("source_account_id");--> statement-breakpoint
CREATE INDEX "expenditures_target_account_idx" ON "expenditures" ("target_account_id");--> statement-breakpoint
CREATE INDEX "expenditures_liability_account_idx" ON "expenditures" ("liability_account_id");--> statement-breakpoint
CREATE INDEX "expenditures_supplier_idx" ON "expenditures" ("supplier_id");--> statement-breakpoint
CREATE INDEX "goods_receipt_note_items_grn_idx" ON "goods_receipt_note_items" ("grn_id");--> statement-breakpoint
CREATE INDEX "goods_receipt_note_items_po_item_idx" ON "goods_receipt_note_items" ("purchase_order_item_id");--> statement-breakpoint
CREATE INDEX "goods_receipt_note_items_material_idx" ON "goods_receipt_note_items" ("material_id");--> statement-breakpoint
CREATE INDEX "goods_receipt_notes_order_idx" ON "goods_receipt_notes" ("order_id");--> statement-breakpoint
CREATE INDEX "goods_receipt_notes_location_idx" ON "goods_receipt_notes" ("location_id");--> statement-breakpoint
CREATE INDEX "goods_receipt_notes_supplier_idx" ON "goods_receipt_notes" ("supplier_id");--> statement-breakpoint
CREATE INDEX "goods_receipt_notes_status_idx" ON "goods_receipt_notes" ("status");--> statement-breakpoint
CREATE INDEX "journal_entries_date_idx" ON "journal_entries" ("date");--> statement-breakpoint
CREATE INDEX "journal_entries_source_idx" ON "journal_entries" ("source_type","source_id");--> statement-breakpoint
CREATE INDEX "journal_items_entry_idx" ON "journal_items" ("journal_entry_id");--> statement-breakpoint
CREATE INDEX "journal_items_account_idx" ON "journal_items" ("account_id");--> statement-breakpoint
CREATE INDEX "leave_requests_employee_idx" ON "leave_requests" ("employee_id");--> statement-breakpoint
CREATE INDEX "leave_requests_status_idx" ON "leave_requests" ("status");--> statement-breakpoint
CREATE INDEX "leave_requests_dates_idx" ON "leave_requests" ("date_start","date_end");--> statement-breakpoint
CREATE INDEX "location_payment_methods_location_id_idx" ON "location_payment_methods" ("location_id");--> statement-breakpoint
CREATE INDEX "location_payment_methods_payment_method_id_idx" ON "location_payment_methods" ("payment_method_id");--> statement-breakpoint
CREATE INDEX "location_payment_methods_payment_provider_id_idx" ON "location_payment_methods" ("payment_provider_id");--> statement-breakpoint
CREATE INDEX "location_payment_methods_is_enabled_idx" ON "location_payment_methods" ("is_enabled");--> statement-breakpoint
CREATE UNIQUE INDEX "locations_code_idx" ON "locations" ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "locations_name_idx" ON "locations" ("name");--> statement-breakpoint
CREATE INDEX "locations_type_active_idx" ON "locations" ("type","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "material_categories_code_idx" ON "material_categories" ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "material_categories_name_idx" ON "material_categories" ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "material_conversions_material_uom_idx" ON "material_conversions" ("material_id","uom_id");--> statement-breakpoint
CREATE INDEX "material_conversions_uom_idx" ON "material_conversions" ("uom_id");--> statement-breakpoint
CREATE UNIQUE INDEX "material_locations_material_location_idx" ON "material_locations" ("material_id","location_id");--> statement-breakpoint
CREATE INDEX "material_locations_location_idx" ON "material_locations" ("location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "material_stock_snapshots_material_location_idx" ON "material_stock_snapshots" ("material_id","location_id");--> statement-breakpoint
CREATE INDEX "material_stock_snapshots_location_idx" ON "material_stock_snapshots" ("location_id");--> statement-breakpoint
CREATE INDEX "material_stock_snapshots_snapshot_at_idx" ON "material_stock_snapshots" ("snapshot_at");--> statement-breakpoint
CREATE UNIQUE INDEX "materials_sku_active_idx" ON "materials" ("sku") WHERE "is_active" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "materials_name_type_active_idx" ON "materials" ("name","type") WHERE "is_active" = true;--> statement-breakpoint
CREATE INDEX "materials_category_idx" ON "materials" ("category_id");--> statement-breakpoint
CREATE INDEX "materials_base_uom_idx" ON "materials" ("base_uom_id");--> statement-breakpoint
CREATE UNIQUE INDEX "moka_config_provider_location_idx" ON "moka_configurations" ("provider","location_id");--> statement-breakpoint
CREATE INDEX "moka_config_location_idx" ON "moka_configurations" ("location_id");--> statement-breakpoint
CREATE INDEX "moka_config_provider_idx" ON "moka_configurations" ("provider");--> statement-breakpoint
CREATE INDEX "moka_config_active_idx" ON "moka_configurations" ("is_active");--> statement-breakpoint
CREATE INDEX "moka_scrap_history_config_idx" ON "moka_scrap_histories" ("moka_configuration_id");--> statement-breakpoint
CREATE INDEX "moka_scrap_history_provider_idx" ON "moka_scrap_histories" ("provider");--> statement-breakpoint
CREATE INDEX "moka_scrap_history_type_idx" ON "moka_scrap_histories" ("type");--> statement-breakpoint
CREATE INDEX "moka_scrap_history_status_idx" ON "moka_scrap_histories" ("status");--> statement-breakpoint
CREATE INDEX "moka_scrap_history_trigger_mode_idx" ON "moka_scrap_histories" ("trigger_mode");--> statement-breakpoint
CREATE INDEX "moka_scrap_history_created_at_idx" ON "moka_scrap_histories" ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "moka_sync_cursor_config_type_idx" ON "moka_sync_cursors" ("moka_configuration_id","type");--> statement-breakpoint
CREATE INDEX "moka_sync_cursor_history_idx" ON "moka_sync_cursors" ("last_history_id");--> statement-breakpoint
CREATE INDEX "payment_invoices_payment_idx" ON "payment_invoices" ("payment_id");--> statement-breakpoint
CREATE INDEX "payment_invoices_sales_inv_idx" ON "payment_invoices" ("sales_invoice_id");--> statement-breakpoint
CREATE INDEX "payment_invoices_purchase_inv_idx" ON "payment_invoices" ("purchase_invoice_id");--> statement-breakpoint
CREATE INDEX "payment_methods_type_idx" ON "payment_methods" ("type");--> statement-breakpoint
CREATE INDEX "payment_methods_category_idx" ON "payment_methods" ("category");--> statement-breakpoint
CREATE INDEX "payment_methods_is_enabled_idx" ON "payment_methods" ("is_enabled");--> statement-breakpoint
CREATE INDEX "payment_methods_is_global_idx" ON "payment_methods" ("is_global");--> statement-breakpoint
CREATE INDEX "payment_methods_payment_provider_id_idx" ON "payment_methods" ("payment_provider_id");--> statement-breakpoint
CREATE INDEX "payment_providers_code_idx" ON "payment_providers" ("code");--> statement-breakpoint
CREATE INDEX "payment_providers_is_active_idx" ON "payment_providers" ("is_active");--> statement-breakpoint
CREATE INDEX "payments_date_idx" ON "payments" ("date");--> statement-breakpoint
CREATE INDEX "payments_account_idx" ON "payments" ("account_id");--> statement-breakpoint
CREATE INDEX "payments_type_idx" ON "payments" ("type");--> statement-breakpoint
CREATE INDEX "payroll_adjustments_item_idx" ON "payroll_adjustments" ("payroll_item_id");--> statement-breakpoint
CREATE INDEX "payroll_batches_status_idx" ON "payroll_batches" ("status");--> statement-breakpoint
CREATE INDEX "payroll_batches_period_idx" ON "payroll_batches" ("period_year","period_month");--> statement-breakpoint
CREATE INDEX "payroll_items_batch_idx" ON "payroll_items" ("batch_id");--> statement-breakpoint
CREATE INDEX "payroll_items_employee_idx" ON "payroll_items" ("employee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_categories_code_location_idx" ON "product_categories" ("code","location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_categories_name_location_idx" ON "product_categories" ("name","location_id");--> statement-breakpoint
CREATE INDEX "product_categories_location_idx" ON "product_categories" ("location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_prices_product_sales_type_idx" ON "product_prices" ("product_id","sales_type_id");--> statement-breakpoint
CREATE INDEX "product_prices_sales_type_idx" ON "product_prices" ("sales_type_id");--> statement-breakpoint
CREATE UNIQUE INDEX "variant_prices_variant_sales_type_idx" ON "product_variant_prices" ("variant_id","sales_type_id");--> statement-breakpoint
CREATE INDEX "variant_prices_sales_type_idx" ON "product_variant_prices" ("sales_type_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variants_product_name_idx" ON "product_variants" ("product_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variants_product_sku_idx" ON "product_variants" ("product_id","sku");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variants_default_idx" ON "product_variants" ("product_id") WHERE "is_default" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "products_sku_location_idx" ON "products" ("sku","location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "products_name_location_idx" ON "products" ("name","location_id");--> statement-breakpoint
CREATE INDEX "products_location_status_idx" ON "products" ("location_id","status");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" ("category_id");--> statement-breakpoint
CREATE INDEX "purchase_invoice_items_invoice_idx" ON "purchase_invoice_items" ("invoice_id");--> statement-breakpoint
CREATE INDEX "purchase_invoice_items_po_item_idx" ON "purchase_invoice_items" ("purchase_order_item_id");--> statement-breakpoint
CREATE INDEX "purchase_invoice_items_material_idx" ON "purchase_invoice_items" ("material_id");--> statement-breakpoint
CREATE INDEX "purchase_invoices_order_idx" ON "purchase_invoices" ("order_id");--> statement-breakpoint
CREATE INDEX "purchase_invoices_supplier_idx" ON "purchase_invoices" ("supplier_id");--> statement-breakpoint
CREATE INDEX "purchase_invoices_status_idx" ON "purchase_invoices" ("status");--> statement-breakpoint
CREATE INDEX "purchase_order_items_order_idx" ON "purchase_order_items" ("order_id");--> statement-breakpoint
CREATE INDEX "purchase_order_items_material_idx" ON "purchase_order_items" ("material_id");--> statement-breakpoint
CREATE INDEX "purchase_order_items_request_item_idx" ON "purchase_order_items" ("request_item_id");--> statement-breakpoint
CREATE INDEX "purchase_orders_location_idx" ON "purchase_orders" ("location_id");--> statement-breakpoint
CREATE INDEX "purchase_orders_supplier_idx" ON "purchase_orders" ("supplier_id");--> statement-breakpoint
CREATE INDEX "purchase_orders_status_idx" ON "purchase_orders" ("status");--> statement-breakpoint
CREATE INDEX "purchase_orders_request_idx" ON "purchase_orders" ("request_id");--> statement-breakpoint
CREATE INDEX "purchase_request_items_request_idx" ON "purchase_request_items" ("request_id");--> statement-breakpoint
CREATE INDEX "purchase_request_items_material_idx" ON "purchase_request_items" ("material_id");--> statement-breakpoint
CREATE INDEX "purchase_requests_location_idx" ON "purchase_requests" ("location_id");--> statement-breakpoint
CREATE INDEX "purchase_requests_status_idx" ON "purchase_requests" ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "recipe_items_recipe_material_idx" ON "recipe_items" ("recipe_id","material_id");--> statement-breakpoint
CREATE INDEX "recipe_items_recipe_idx" ON "recipe_items" ("recipe_id");--> statement-breakpoint
CREATE INDEX "recipe_items_material_idx" ON "recipe_items" ("material_id");--> statement-breakpoint
CREATE UNIQUE INDEX "recipes_material_idx" ON "recipes" ("material_id") WHERE ("material_id" is not null);--> statement-breakpoint
CREATE UNIQUE INDEX "recipes_product_idx" ON "recipes" ("product_id") WHERE ("product_id" is not null);--> statement-breakpoint
CREATE UNIQUE INDEX "recipes_variant_idx" ON "recipes" ("product_variant_id") WHERE ("product_variant_id" is not null);--> statement-breakpoint
CREATE UNIQUE INDEX "roles_code_idx" ON "roles" ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "sales_external_refs_source_ext_id_idx" ON "sales_external_refs" ("external_source","external_order_id");--> statement-breakpoint
CREATE INDEX "sales_external_refs_order_idx" ON "sales_external_refs" ("order_id");--> statement-breakpoint
CREATE INDEX "sales_invoice_items_invoice_idx" ON "sales_invoice_items" ("invoice_id");--> statement-breakpoint
CREATE INDEX "sales_invoice_items_so_item_idx" ON "sales_invoice_items" ("sales_order_item_id");--> statement-breakpoint
CREATE INDEX "sales_invoice_items_product_idx" ON "sales_invoice_items" ("product_id");--> statement-breakpoint
CREATE INDEX "sales_invoice_items_variant_idx" ON "sales_invoice_items" ("variant_id");--> statement-breakpoint
CREATE INDEX "sales_invoices_order_idx" ON "sales_invoices" ("order_id");--> statement-breakpoint
CREATE INDEX "sales_invoices_customer_idx" ON "sales_invoices" ("customer_id");--> statement-breakpoint
CREATE INDEX "sales_invoices_status_idx" ON "sales_invoices" ("status");--> statement-breakpoint
CREATE INDEX "sales_order_batches_order_idx" ON "sales_order_batches" ("order_id");--> statement-breakpoint
CREATE INDEX "sales_order_items_order_idx" ON "sales_order_items" ("order_id");--> statement-breakpoint
CREATE INDEX "sales_order_items_product_idx" ON "sales_order_items" ("product_id");--> statement-breakpoint
CREATE INDEX "sales_order_items_variant_idx" ON "sales_order_items" ("variant_id");--> statement-breakpoint
CREATE INDEX "sales_order_items_batch_idx" ON "sales_order_items" ("batch_id");--> statement-breakpoint
CREATE INDEX "sales_orders_location_idx" ON "sales_orders" ("location_id");--> statement-breakpoint
CREATE INDEX "sales_orders_source_idx" ON "sales_orders" ("source");--> statement-breakpoint
CREATE INDEX "sales_orders_status_idx" ON "sales_orders" ("status");--> statement-breakpoint
CREATE INDEX "sales_orders_transaction_date_idx" ON "sales_orders" ("transaction_date");--> statement-breakpoint
CREATE INDEX "sales_orders_customer_idx" ON "sales_orders" ("customer_id");--> statement-breakpoint
CREATE INDEX "sales_orders_sales_type_idx" ON "sales_orders" ("sales_type_id");--> statement-breakpoint
CREATE INDEX "sales_refunds_order_idx" ON "sales_refunds" ("order_id");--> statement-breakpoint
CREATE INDEX "sales_refunds_item_idx" ON "sales_refunds" ("item_id");--> statement-breakpoint
CREATE INDEX "sales_refunds_date_idx" ON "sales_refunds" ("refunded_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sales_types_global_code_idx" ON "sales_types" ("code") WHERE ("location_id" is null);--> statement-breakpoint
CREATE UNIQUE INDEX "sales_types_location_code_idx" ON "sales_types" ("location_id","code") WHERE ("location_id" is not null);--> statement-breakpoint
CREATE UNIQUE INDEX "sales_types_global_name_idx" ON "sales_types" ("name") WHERE ("location_id" is null);--> statement-breakpoint
CREATE UNIQUE INDEX "sales_types_location_name_idx" ON "sales_types" ("location_id","name") WHERE ("location_id" is not null);--> statement-breakpoint
CREATE INDEX "sales_types_location_idx" ON "sales_types" ("location_id");--> statement-breakpoint
CREATE INDEX "sales_voids_order_idx" ON "sales_voids" ("order_id");--> statement-breakpoint
CREATE INDEX "sales_voids_item_idx" ON "sales_voids" ("item_id");--> statement-breakpoint
CREATE INDEX "sessions_expired_at_idx" ON "sessions" ("expired_at");--> statement-breakpoint
CREATE INDEX "sessions_user_revoked_idx" ON "sessions" ("user_id","revoked_at");--> statement-breakpoint
CREATE INDEX "sessions_location_idx" ON "sessions" ("location_id");--> statement-breakpoint
CREATE INDEX "stock_adj_items_header_idx" ON "stock_adjustment_items" ("adjustment_id");--> statement-breakpoint
CREATE INDEX "stock_adj_items_material_idx" ON "stock_adjustment_items" ("material_id");--> statement-breakpoint
CREATE INDEX "stock_adjustments_location_idx" ON "stock_adjustments" ("location_id");--> statement-breakpoint
CREATE INDEX "stock_adjustments_date_idx" ON "stock_adjustments" ("adjustment_date");--> statement-breakpoint
CREATE INDEX "stock_batches_material_idx" ON "stock_batches" ("material_id");--> statement-breakpoint
CREATE INDEX "stock_batches_expiry_idx" ON "stock_batches" ("expiry_date");--> statement-breakpoint
CREATE UNIQUE INDEX "stock_batches_material_no_idx" ON "stock_batches" ("material_id","batch_no");--> statement-breakpoint
CREATE UNIQUE INDEX "stock_summaries_material_location_date_idx" ON "stock_summaries" ("material_id","location_id","date") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE INDEX "stock_summaries_location_date_idx" ON "stock_summaries" ("location_id","date");--> statement-breakpoint
CREATE INDEX "stock_summaries_date_idx" ON "stock_summaries" ("date");--> statement-breakpoint
CREATE INDEX "stock_txn_material_location_date_idx" ON "stock_transactions" ("material_id","location_id","date");--> statement-breakpoint
CREATE INDEX "stock_txn_location_date_idx" ON "stock_transactions" ("location_id","date");--> statement-breakpoint
CREATE INDEX "stock_txn_type_date_idx" ON "stock_transactions" ("type","date");--> statement-breakpoint
CREATE INDEX "stock_txn_transfer_idx" ON "stock_transactions" ("transfer_id");--> statement-breakpoint
CREATE INDEX "stock_txn_reference_no_idx" ON "stock_transactions" ("reference_no");--> statement-breakpoint
CREATE INDEX "stock_txn_batch_idx" ON "stock_transactions" ("batch_id");--> statement-breakpoint
CREATE INDEX "stock_txn_counterpart_location_idx" ON "stock_transactions" ("counterpart_location_id");--> statement-breakpoint
CREATE INDEX "stock_transfer_items_transfer_idx" ON "stock_transfer_items" ("transfer_id");--> statement-breakpoint
CREATE INDEX "stock_transfer_items_material_idx" ON "stock_transfer_items" ("material_id");--> statement-breakpoint
CREATE INDEX "stock_transfers_source_idx" ON "stock_transfers" ("source_location_id");--> statement-breakpoint
CREATE INDEX "stock_transfers_destination_idx" ON "stock_transfers" ("destination_location_id");--> statement-breakpoint
CREATE INDEX "stock_transfers_status_idx" ON "stock_transfers" ("status");--> statement-breakpoint
CREATE INDEX "stock_transfers_date_idx" ON "stock_transfers" ("transfer_date");--> statement-breakpoint
CREATE UNIQUE INDEX "suppliers_code_idx" ON "suppliers" ("code") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE UNIQUE INDEX "suppliers_name_idx" ON "suppliers" ("name") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE UNIQUE INDEX "taxes_code_idx" ON "taxes" ("code") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE INDEX "taxes_account_idx" ON "taxes" ("account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uoms_code_idx" ON "uoms" ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "uoms_name_idx" ON "uoms" ("name");--> statement-breakpoint
CREATE INDEX "user_assignments_user_idx" ON "user_assignments" ("user_id");--> statement-breakpoint
CREATE INDEX "user_assignments_role_idx" ON "user_assignments" ("role_id");--> statement-breakpoint
CREATE INDEX "user_assignments_location_idx" ON "user_assignments" ("location_id");--> statement-breakpoint
CREATE INDEX "user_assignments_added_by_idx" ON "user_assignments" ("added_by");--> statement-breakpoint
CREATE UNIQUE INDEX "user_assignments_user_location_idx" ON "user_assignments" ("user_id","location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_idx" ON "users" ("username");--> statement-breakpoint
CREATE INDEX "users_default_location_idx" ON "users" ("default_location_id");--> statement-breakpoint
CREATE INDEX "users_active_idx" ON "users" ("is_active");--> statement-breakpoint
CREATE INDEX "work_orders_recipe_idx" ON "work_orders" ("recipe_id");--> statement-breakpoint
CREATE INDEX "work_orders_location_idx" ON "work_orders" ("location_id");--> statement-breakpoint
CREATE INDEX "work_orders_status_idx" ON "work_orders" ("status");--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_parent_id_accounts_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "accounts"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_employee_id_employees_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_shift_id_shifts_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "customer_loyalty_transactions" ADD CONSTRAINT "customer_loyalty_transactions_customer_id_customers_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "expenditures" ADD CONSTRAINT "expenditures_source_account_id_accounts_id_fkey" FOREIGN KEY ("source_account_id") REFERENCES "accounts"("id");--> statement-breakpoint
ALTER TABLE "expenditures" ADD CONSTRAINT "expenditures_target_account_id_accounts_id_fkey" FOREIGN KEY ("target_account_id") REFERENCES "accounts"("id");--> statement-breakpoint
ALTER TABLE "expenditures" ADD CONSTRAINT "expenditures_liability_account_id_accounts_id_fkey" FOREIGN KEY ("liability_account_id") REFERENCES "accounts"("id");--> statement-breakpoint
ALTER TABLE "expenditures" ADD CONSTRAINT "expenditures_supplier_id_suppliers_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id");--> statement-breakpoint
ALTER TABLE "expenditures" ADD CONSTRAINT "expenditures_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id");--> statement-breakpoint
ALTER TABLE "goods_receipt_note_items" ADD CONSTRAINT "goods_receipt_note_items_grn_id_goods_receipt_notes_id_fkey" FOREIGN KEY ("grn_id") REFERENCES "goods_receipt_notes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "goods_receipt_note_items" ADD CONSTRAINT "goods_receipt_note_items_G4muRgLahTEk_fkey" FOREIGN KEY ("purchase_order_item_id") REFERENCES "purchase_order_items"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "goods_receipt_note_items" ADD CONSTRAINT "goods_receipt_note_items_material_id_materials_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "goods_receipt_notes" ADD CONSTRAINT "goods_receipt_notes_order_id_purchase_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "goods_receipt_notes" ADD CONSTRAINT "goods_receipt_notes_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "goods_receipt_notes" ADD CONSTRAINT "goods_receipt_notes_supplier_id_suppliers_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "journal_items" ADD CONSTRAINT "journal_items_journal_entry_id_journal_entries_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "journal_items" ADD CONSTRAINT "journal_items_account_id_accounts_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id");--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employee_id_employees_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "location_payment_methods" ADD CONSTRAINT "location_payment_methods_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "location_payment_methods" ADD CONSTRAINT "location_payment_methods_fS3Ob7JTlMq0_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "location_payment_methods" ADD CONSTRAINT "location_payment_methods_N34VZ9RW0bR6_fkey" FOREIGN KEY ("payment_provider_id") REFERENCES "payment_providers"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "material_conversions" ADD CONSTRAINT "material_conversions_material_id_materials_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "material_conversions" ADD CONSTRAINT "material_conversions_uom_id_uoms_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "uoms"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "material_locations" ADD CONSTRAINT "material_locations_material_id_materials_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "material_locations" ADD CONSTRAINT "material_locations_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "material_stock_snapshots" ADD CONSTRAINT "material_stock_snapshots_material_id_materials_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "material_stock_snapshots" ADD CONSTRAINT "material_stock_snapshots_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_category_id_material_categories_id_fkey" FOREIGN KEY ("category_id") REFERENCES "material_categories"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_base_uom_id_uoms_id_fkey" FOREIGN KEY ("base_uom_id") REFERENCES "uoms"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "moka_configurations" ADD CONSTRAINT "moka_configurations_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "moka_scrap_histories" ADD CONSTRAINT "moka_scrap_histories_EZrm2vyeRld8_fkey" FOREIGN KEY ("moka_configuration_id") REFERENCES "moka_configurations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "moka_sync_cursors" ADD CONSTRAINT "moka_sync_cursors_RnhRkie2jRN3_fkey" FOREIGN KEY ("moka_configuration_id") REFERENCES "moka_configurations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "moka_sync_cursors" ADD CONSTRAINT "moka_sync_cursors_last_history_id_moka_scrap_histories_id_fkey" FOREIGN KEY ("last_history_id") REFERENCES "moka_scrap_histories"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "payment_invoices" ADD CONSTRAINT "payment_invoices_payment_id_payments_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payment_invoices" ADD CONSTRAINT "payment_invoices_sales_invoice_id_sales_invoices_id_fkey" FOREIGN KEY ("sales_invoice_id") REFERENCES "sales_invoices"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payment_invoices" ADD CONSTRAINT "payment_invoices_purchase_invoice_id_purchase_invoices_id_fkey" FOREIGN KEY ("purchase_invoice_id") REFERENCES "purchase_invoices"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_payment_provider_id_payment_providers_id_fkey" FOREIGN KEY ("payment_provider_id") REFERENCES "payment_providers"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_account_id_accounts_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "payroll_adjustments" ADD CONSTRAINT "payroll_adjustments_payroll_item_id_payroll_items_id_fkey" FOREIGN KEY ("payroll_item_id") REFERENCES "payroll_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_batch_id_payroll_batches_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "payroll_batches"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_employee_id_employees_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_sales_type_id_sales_types_id_fkey" FOREIGN KEY ("sales_type_id") REFERENCES "sales_types"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "product_variant_prices" ADD CONSTRAINT "product_variant_prices_variant_id_product_variants_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product_variant_prices" ADD CONSTRAINT "product_variant_prices_sales_type_id_sales_types_id_fkey" FOREIGN KEY ("sales_type_id") REFERENCES "sales_types"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_product_categories_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "purchase_invoice_items" ADD CONSTRAINT "purchase_invoice_items_invoice_id_purchase_invoices_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "purchase_invoices"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "purchase_invoice_items" ADD CONSTRAINT "purchase_invoice_items_nvvhR99lmzTd_fkey" FOREIGN KEY ("purchase_order_item_id") REFERENCES "purchase_order_items"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "purchase_invoice_items" ADD CONSTRAINT "purchase_invoice_items_material_id_materials_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_order_id_purchase_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_supplier_id_suppliers_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_order_id_purchase_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_0fJp3ANidglg_fkey" FOREIGN KEY ("request_item_id") REFERENCES "purchase_request_items"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_material_id_materials_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_request_id_purchase_requests_id_fkey" FOREIGN KEY ("request_id") REFERENCES "purchase_requests"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_suppliers_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "purchase_request_items" ADD CONSTRAINT "purchase_request_items_request_id_purchase_requests_id_fkey" FOREIGN KEY ("request_id") REFERENCES "purchase_requests"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "purchase_request_items" ADD CONSTRAINT "purchase_request_items_material_id_materials_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_recipe_id_recipes_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_material_id_materials_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_uom_id_uoms_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "uoms"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_material_id_materials_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_product_variant_id_product_variants_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_target_uom_id_uoms_id_fkey" FOREIGN KEY ("target_uom_id") REFERENCES "uoms"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "sales_external_refs" ADD CONSTRAINT "sales_external_refs_order_id_sales_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "sales_orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sales_invoice_items" ADD CONSTRAINT "sales_invoice_items_invoice_id_sales_invoices_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "sales_invoices"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sales_invoice_items" ADD CONSTRAINT "sales_invoice_items_DfAAgBXuZH3g_fkey" FOREIGN KEY ("sales_order_item_id") REFERENCES "sales_order_items"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "sales_invoice_items" ADD CONSTRAINT "sales_invoice_items_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "sales_invoice_items" ADD CONSTRAINT "sales_invoice_items_variant_id_product_variants_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_order_id_sales_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "sales_orders"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_customer_id_customers_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "sales_order_batches" ADD CONSTRAINT "sales_order_batches_order_id_sales_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "sales_orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_order_id_sales_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "sales_orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_batch_id_sales_order_batches_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "sales_order_batches"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_variant_id_product_variants_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_customer_id_customers_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_sales_type_id_sales_types_id_fkey" FOREIGN KEY ("sales_type_id") REFERENCES "sales_types"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "sales_refunds" ADD CONSTRAINT "sales_refunds_order_id_sales_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "sales_orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sales_refunds" ADD CONSTRAINT "sales_refunds_item_id_sales_order_items_id_fkey" FOREIGN KEY ("item_id") REFERENCES "sales_order_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sales_refunds" ADD CONSTRAINT "sales_refunds_refunded_by_users_id_fkey" FOREIGN KEY ("refunded_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "sales_types" ADD CONSTRAINT "sales_types_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "sales_voids" ADD CONSTRAINT "sales_voids_order_id_sales_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "sales_orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sales_voids" ADD CONSTRAINT "sales_voids_item_id_sales_order_items_id_fkey" FOREIGN KEY ("item_id") REFERENCES "sales_order_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sales_voids" ADD CONSTRAINT "sales_voids_voided_by_users_id_fkey" FOREIGN KEY ("voided_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "stock_adjustment_items" ADD CONSTRAINT "stock_adjustment_items_adjustment_id_stock_adjustments_id_fkey" FOREIGN KEY ("adjustment_id") REFERENCES "stock_adjustments"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "stock_adjustment_items" ADD CONSTRAINT "stock_adjustment_items_material_id_materials_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "stock_adjustment_items" ADD CONSTRAINT "stock_adjustment_items_batch_id_stock_batches_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "stock_batches"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "stock_batches" ADD CONSTRAINT "stock_batches_material_id_materials_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "stock_summaries" ADD CONSTRAINT "stock_summaries_material_id_materials_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "stock_summaries" ADD CONSTRAINT "stock_summaries_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_material_id_materials_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_batch_id_stock_batches_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "stock_batches"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_counterpart_location_id_locations_id_fkey" FOREIGN KEY ("counterpart_location_id") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "stock_transfer_items" ADD CONSTRAINT "stock_transfer_items_transfer_id_stock_transfers_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "stock_transfers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "stock_transfer_items" ADD CONSTRAINT "stock_transfer_items_material_id_materials_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_source_location_id_locations_id_fkey" FOREIGN KEY ("source_location_id") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_destination_location_id_locations_id_fkey" FOREIGN KEY ("destination_location_id") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "taxes" ADD CONSTRAINT "taxes_account_id_accounts_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "user_assignments" ADD CONSTRAINT "user_assignments_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_assignments" ADD CONSTRAINT "user_assignments_role_id_roles_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "user_assignments" ADD CONSTRAINT "user_assignments_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "user_assignments" ADD CONSTRAINT "user_assignments_added_by_users_id_fkey" FOREIGN KEY ("added_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_default_location_id_locations_id_fkey" FOREIGN KEY ("default_location_id") REFERENCES "locations"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_recipe_id_recipes_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT;