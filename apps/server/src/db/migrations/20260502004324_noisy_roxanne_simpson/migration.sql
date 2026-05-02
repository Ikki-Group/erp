CREATE TYPE "customer_tier" AS ENUM('bronze', 'silver', 'gold', 'platinum');--> statement-breakpoint
CREATE TYPE "loyalty_transaction_type" AS ENUM('earned', 'redeemed', 'adjusted', 'expired');--> statement-breakpoint
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
ALTER TABLE "customers" ADD COLUMN "date_of_birth" timestamp;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "tier" "customer_tier" DEFAULT 'bronze'::"customer_tier";--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "points_balance" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "total_points_earned" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "registered_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "last_visit_at" timestamp;--> statement-breakpoint
CREATE INDEX "payment_method_configs_type_idx" ON "payment_method_configs" ("type");--> statement-breakpoint
CREATE INDEX "payment_method_configs_category_idx" ON "payment_method_configs" ("category");--> statement-breakpoint
CREATE INDEX "payment_method_configs_is_enabled_idx" ON "payment_method_configs" ("is_enabled");--> statement-breakpoint
ALTER TABLE "customer_loyalty_transactions" ADD CONSTRAINT "customer_loyalty_transactions_customer_id_customers_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE;