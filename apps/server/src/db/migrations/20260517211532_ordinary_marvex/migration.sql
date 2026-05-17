CREATE TYPE "location_type" AS ENUM('store', 'warehouse');--> statement-breakpoint
CREATE TYPE "material_type" AS ENUM('raw', 'semi', 'packaging');--> statement-breakpoint
CREATE TYPE "product_status" AS ENUM('active', 'inactive', 'archived');--> statement-breakpoint
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
	CONSTRAINT "material_conversions_factor_chk" CHECK (to_base_factor > 0)
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
	CONSTRAINT "material_locations_stock_range_chk" CHECK (max_stock IS NULL OR (max_stock >= min_stock AND max_stock >= reorder_point))
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
	CONSTRAINT "material_stock_snapshots_qty_chk" CHECK (current_qty >= 0),
	CONSTRAINT "material_stock_snapshots_cost_chk" CHECK (current_avg_cost >= 0 AND current_value >= 0)
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
	"updated_by" integer NOT NULL
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
	"updated_by" integer NOT NULL
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
	"updated_by" integer NOT NULL
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
	CONSTRAINT "products_base_price_chk" CHECK (base_price >= 0)
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
	CONSTRAINT "recipe_items_qty_chk" CHECK (qty > 0),
	CONSTRAINT "recipe_items_scrap_pct_chk" CHECK (scrap_percentage >= 0 AND scrap_percentage < 100)
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
	CONSTRAINT "recipes_target_xor_chk" CHECK ((
				(CASE WHEN material_id IS NOT NULL THEN 1 ELSE 0 END) +
				(CASE WHEN product_id IS NOT NULL THEN 1 ELSE 0 END) +
				(CASE WHEN product_variant_id IS NOT NULL THEN 1 ELSE 0 END)
			) = 1),
	CONSTRAINT "recipes_target_qty_chk" CHECK (target_qty > 0)
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"permissions" text[] DEFAULT '{}'::text[] NOT NULL,
	"is_built_in" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_types" (
	"id" serial PRIMARY KEY,
	"location_id" integer,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"is_built_in" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	CONSTRAINT "sales_types_built_in_global_chk" CHECK (NOT is_built_in OR location_id IS NULL)
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expired_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uoms" (
	"id" serial PRIMARY KEY,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"is_built_in" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	CONSTRAINT "uoms_code_uppercase_chk" CHECK (code = upper(code))
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
	"password_hash" text,
	"is_root" boolean DEFAULT false NOT NULL,
	"is_built_in" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"default_location_id" integer,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "locations_code_active_idx" ON "locations" ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "locations_name_active_idx" ON "locations" ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "material_categories_code_idx" ON "material_categories" ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "material_categories_name_idx" ON "material_categories" ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "material_conversions_material_uom_idx" ON "material_conversions" ("material_id","uom_id");--> statement-breakpoint
CREATE INDEX "material_conversions_uom_idx" ON "material_conversions" ("uom_id");--> statement-breakpoint
CREATE UNIQUE INDEX "material_locations_material_location_idx" ON "material_locations" ("material_id","location_id");--> statement-breakpoint
CREATE INDEX "material_locations_location_idx" ON "material_locations" ("location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "material_stock_snapshots_material_location_idx" ON "material_stock_snapshots" ("material_id","location_id");--> statement-breakpoint
CREATE INDEX "material_stock_snapshots_location_idx" ON "material_stock_snapshots" ("location_id");--> statement-breakpoint
CREATE INDEX "material_stock_snapshots_snapshot_at_idx" ON "material_stock_snapshots" ("snapshot_at");--> statement-breakpoint
CREATE UNIQUE INDEX "materials_sku_active_idx" ON "materials" ("sku") WHERE is_active = TRUE;--> statement-breakpoint
CREATE UNIQUE INDEX "materials_name_type_active_idx" ON "materials" ("name","type") WHERE is_active = TRUE;--> statement-breakpoint
CREATE INDEX "materials_category_idx" ON "materials" ("category_id");--> statement-breakpoint
CREATE INDEX "materials_base_uom_idx" ON "materials" ("base_uom_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_categories_code_location_idx" ON "product_categories" ("code","location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_categories_name_location_idx" ON "product_categories" ("name","location_id");--> statement-breakpoint
CREATE INDEX "product_categories_location_idx" ON "product_categories" ("location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_prices_product_sales_type_idx" ON "product_prices" ("product_id","sales_type_id");--> statement-breakpoint
CREATE INDEX "product_prices_sales_type_idx" ON "product_prices" ("sales_type_id");--> statement-breakpoint
CREATE UNIQUE INDEX "variant_prices_variant_sales_type_idx" ON "product_variant_prices" ("variant_id","sales_type_id");--> statement-breakpoint
CREATE INDEX "variant_prices_sales_type_idx" ON "product_variant_prices" ("sales_type_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variants_product_name_idx" ON "product_variants" ("product_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variants_product_sku_idx" ON "product_variants" ("product_id","sku");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variants_default_idx" ON "product_variants" ("product_id") WHERE is_default = TRUE;--> statement-breakpoint
CREATE UNIQUE INDEX "products_sku_location_idx" ON "products" ("sku","location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "products_name_location_idx" ON "products" ("name","location_id");--> statement-breakpoint
CREATE INDEX "products_location_status_idx" ON "products" ("location_id","status");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "recipe_items_recipe_material_idx" ON "recipe_items" ("recipe_id","material_id");--> statement-breakpoint
CREATE INDEX "recipe_items_recipe_idx" ON "recipe_items" ("recipe_id");--> statement-breakpoint
CREATE INDEX "recipe_items_material_idx" ON "recipe_items" ("material_id");--> statement-breakpoint
CREATE UNIQUE INDEX "recipes_material_idx" ON "recipes" ("material_id") WHERE material_id IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "recipes_product_idx" ON "recipes" ("product_id") WHERE product_id IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "recipes_variant_idx" ON "recipes" ("product_variant_id") WHERE product_variant_id IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "roles_code_idx" ON "roles" ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "sales_types_global_code_idx" ON "sales_types" ("code") WHERE location_id IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "sales_types_location_code_idx" ON "sales_types" ("location_id","code") WHERE location_id IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "sales_types_global_name_idx" ON "sales_types" ("name") WHERE location_id IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "sales_types_location_name_idx" ON "sales_types" ("location_id","name") WHERE location_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "sales_types_location_idx" ON "sales_types" ("location_id");--> statement-breakpoint
CREATE INDEX "sessions_expired_at_idx" ON "sessions" ("expired_at");--> statement-breakpoint
CREATE INDEX "sessions_user_revoked_idx" ON "sessions" ("user_id","revoked_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uoms_code_idx" ON "uoms" ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "uoms_name_idx" ON "uoms" ("name");--> statement-breakpoint
CREATE INDEX "user_assignments_user_idx" ON "user_assignments" ("user_id");--> statement-breakpoint
CREATE INDEX "user_assignments_role_idx" ON "user_assignments" ("role_id");--> statement-breakpoint
CREATE INDEX "user_assignments_location_idx" ON "user_assignments" ("location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_assignments_user_location_idx" ON "user_assignments" ("user_id","location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_idx" ON "users" ("username");--> statement-breakpoint
CREATE INDEX "users_default_location_idx" ON "users" ("default_location_id");--> statement-breakpoint
ALTER TABLE "material_conversions" ADD CONSTRAINT "material_conversions_material_id_materials_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "material_conversions" ADD CONSTRAINT "material_conversions_uom_id_uoms_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "uoms"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "material_locations" ADD CONSTRAINT "material_locations_material_id_materials_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "material_locations" ADD CONSTRAINT "material_locations_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "material_stock_snapshots" ADD CONSTRAINT "material_stock_snapshots_material_id_materials_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "material_stock_snapshots" ADD CONSTRAINT "material_stock_snapshots_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_category_id_material_categories_id_fkey" FOREIGN KEY ("category_id") REFERENCES "material_categories"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_base_uom_id_uoms_id_fkey" FOREIGN KEY ("base_uom_id") REFERENCES "uoms"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_sales_type_id_sales_types_id_fkey" FOREIGN KEY ("sales_type_id") REFERENCES "sales_types"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "product_variant_prices" ADD CONSTRAINT "product_variant_prices_variant_id_product_variants_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product_variant_prices" ADD CONSTRAINT "product_variant_prices_sales_type_id_sales_types_id_fkey" FOREIGN KEY ("sales_type_id") REFERENCES "sales_types"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_product_categories_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_recipe_id_recipes_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_material_id_materials_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_uom_id_uoms_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "uoms"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_material_id_materials_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_product_variant_id_product_variants_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_target_uom_id_uoms_id_fkey" FOREIGN KEY ("target_uom_id") REFERENCES "uoms"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "sales_types" ADD CONSTRAINT "sales_types_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_assignments" ADD CONSTRAINT "user_assignments_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_assignments" ADD CONSTRAINT "user_assignments_role_id_roles_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "user_assignments" ADD CONSTRAINT "user_assignments_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "user_assignments" ADD CONSTRAINT "user_assignments_added_by_users_id_fkey" FOREIGN KEY ("added_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_default_location_id_locations_id_fkey" FOREIGN KEY ("default_location_id") REFERENCES "locations"("id") ON DELETE SET NULL;