CREATE TABLE "cashier_shifts" (
	"id" serial PRIMARY KEY,
	"location_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	"opening_cash" numeric(18,2) DEFAULT '0' NOT NULL,
	"closing_cash" numeric(18,2),
	"expected_cash" numeric(18,2),
	"notes" varchar(1000),
	CONSTRAINT "cashier_shifts_status_chk" CHECK ("status" IN ('open', 'closed'))
);
--> statement-breakpoint
CREATE TABLE "company_settings" (
	"id" serial PRIMARY KEY,
	"name" varchar(255) NOT NULL,
	"address" varchar(500),
	"phone" varchar(50),
	"email" varchar(255),
	"tax_id" varchar(100),
	"tax_rate" numeric(5,2) DEFAULT '0',
	"currency_code" varchar(10) DEFAULT 'IDR' NOT NULL,
	"currency_symbol" varchar(10) DEFAULT 'Rp' NOT NULL,
	"logo_url" varchar(500),
	"receipt_footer" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" serial PRIMARY KEY,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(20) NOT NULL,
	"address" varchar(500),
	"phone" varchar(50),
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_by" integer,
	CONSTRAINT "locations_type_chk" CHECK ("type" IN ('store', 'warehouse'))
);
--> statement-breakpoint
CREATE TABLE "material_categories" (
	"id" serial PRIMARY KEY,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "material_locations" (
	"id" serial PRIMARY KEY,
	"material_id" integer NOT NULL,
	"location_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" serial PRIMARY KEY,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(20) NOT NULL,
	"category_id" integer,
	"base_uom_id" integer NOT NULL,
	"default_purchase_uom_id" integer,
	"default_stock_uom_id" integer,
	"default_recipe_uom_id" integer,
	"min_stock" numeric(18,6),
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_by" integer,
	CONSTRAINT "materials_type_chk" CHECK ("type" IN ('raw', 'semi_finished'))
);
--> statement-breakpoint
CREATE TABLE "menu_categories" (
	"id" serial PRIMARY KEY,
	"location_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"parent_id" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "menu_item_modifiers" (
	"id" serial PRIMARY KEY,
	"menu_item_id" integer NOT NULL,
	"modifier_group_id" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_items" (
	"id" serial PRIMARY KEY,
	"location_id" integer NOT NULL,
	"sku" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"category_id" integer,
	"base_price" numeric(18,2) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"image_url" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_by" integer,
	CONSTRAINT "menu_items_status_chk" CHECK ("status" IN ('active', 'inactive'))
);
--> statement-breakpoint
CREATE TABLE "modifier_groups" (
	"id" serial PRIMARY KEY,
	"location_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"selection_type" varchar(20) DEFAULT 'single' NOT NULL,
	"is_required" integer DEFAULT 0 NOT NULL,
	"min_select" integer DEFAULT 0 NOT NULL,
	"max_select" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_by" integer,
	CONSTRAINT "modifier_groups_selection_type_chk" CHECK ("selection_type" IN ('single', 'multiple'))
);
--> statement-breakpoint
CREATE TABLE "modifier_options" (
	"id" serial PRIMARY KEY,
	"group_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"price_adjustment" numeric(18,2) DEFAULT '0' NOT NULL,
	"is_default" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_lines" (
	"id" serial PRIMARY KEY,
	"order_id" integer NOT NULL,
	"menu_item_id" integer NOT NULL,
	"menu_item_name" varchar(255) NOT NULL,
	"quantity" numeric(18,6) NOT NULL,
	"unit_price" numeric(18,2) NOT NULL,
	"modifiers" jsonb,
	"modifier_total" numeric(18,2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(18,2) DEFAULT '0' NOT NULL,
	"line_total" numeric(18,2) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"notes" varchar(500),
	"voided_by" integer,
	"voided_at" timestamp with time zone,
	CONSTRAINT "order_lines_status_chk" CHECK ("status" IN ('active', 'voided'))
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY,
	"order_no" varchar(100) NOT NULL,
	"location_id" integer NOT NULL,
	"table_id" integer,
	"shift_id" integer NOT NULL,
	"type" varchar(20) NOT NULL,
	"billing_mode" varchar(20) DEFAULT 'open' NOT NULL,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"subtotal" numeric(18,2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(18,2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(18,2) DEFAULT '0' NOT NULL,
	"total" numeric(18,2) DEFAULT '0' NOT NULL,
	"customer_id" integer,
	"source" varchar(20) DEFAULT 'internal' NOT NULL,
	"external_ref" varchar(255),
	"notes" varchar(1000),
	"ordered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_by" integer,
	CONSTRAINT "orders_type_chk" CHECK ("type" IN ('dine_in', 'takeaway')),
	CONSTRAINT "orders_status_chk" CHECK ("status" IN ('open', 'completed', 'voided')),
	CONSTRAINT "orders_source_chk" CHECK ("source" IN ('internal', 'moka', 'manual'))
);
--> statement-breakpoint
CREATE TABLE "payment_method_locations" (
	"id" serial PRIMARY KEY,
	"payment_method_id" integer NOT NULL,
	"location_id" integer NOT NULL,
	"is_enabled" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" serial PRIMARY KEY,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(20) NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_by" integer,
	CONSTRAINT "payment_methods_type_chk" CHECK ("type" IN ('cash', 'digital'))
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY,
	"order_id" integer NOT NULL,
	"payment_method_id" integer NOT NULL,
	"amount" numeric(18,2) NOT NULL,
	"reference" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "production_orders" (
	"id" serial PRIMARY KEY,
	"production_no" varchar(100) NOT NULL,
	"location_id" integer NOT NULL,
	"material_id" integer NOT NULL,
	"recipe_id" integer NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"planned_qty" numeric(18,6) NOT NULL,
	"actual_qty" numeric(18,6),
	"notes" varchar(1000),
	"produced_by" integer,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_by" integer,
	CONSTRAINT "production_orders_status_chk" CHECK ("status" IN ('draft', 'completed', 'cancelled')),
	CONSTRAINT "production_orders_planned_qty_positive_chk" CHECK ("planned_qty" > 0)
);
--> statement-breakpoint
CREATE TABLE "production_recipe_lines" (
	"id" serial PRIMARY KEY,
	"recipe_id" integer NOT NULL,
	"material_id" integer NOT NULL,
	"quantity" numeric(18,6) NOT NULL,
	"uom_id" integer NOT NULL,
	CONSTRAINT "production_recipe_lines_qty_positive_chk" CHECK ("quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "production_recipes" (
	"id" serial PRIMARY KEY,
	"material_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"yield_qty" numeric(18,6) NOT NULL,
	"yield_uom_id" integer NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "receiving_lines" (
	"id" serial PRIMARY KEY,
	"receiving_id" integer NOT NULL,
	"material_id" integer NOT NULL,
	"quantity" numeric(18,6) NOT NULL,
	"unit_cost" numeric(18,6) NOT NULL,
	"uom_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "receivings" (
	"id" serial PRIMARY KEY,
	"receiving_no" varchar(100) NOT NULL,
	"location_id" integer NOT NULL,
	"supplier_id" integer NOT NULL,
	"notes" varchar(1000),
	"received_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "recipe_lines" (
	"id" serial PRIMARY KEY,
	"recipe_id" integer NOT NULL,
	"material_id" integer NOT NULL,
	"quantity" numeric(18,6) NOT NULL,
	"uom_id" integer NOT NULL,
	CONSTRAINT "recipe_lines_qty_positive_chk" CHECK ("quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" serial PRIMARY KEY,
	"menu_item_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"yield_qty" numeric(18,6) NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"is_system" integer DEFAULT 0 NOT NULL,
	"permissions" jsonb DEFAULT '[]' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(255) PRIMARY KEY,
	"user_id" integer NOT NULL,
	"location_id" integer,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_balances" (
	"id" serial PRIMARY KEY,
	"material_id" integer NOT NULL,
	"location_id" integer NOT NULL,
	"quantity" numeric(18,6) DEFAULT '0' NOT NULL,
	"cost_price" numeric(18,6) DEFAULT '0' NOT NULL,
	CONSTRAINT "stock_balances_qty_nonneg_chk" CHECK ("quantity" >= 0)
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" serial PRIMARY KEY,
	"material_id" integer NOT NULL,
	"location_id" integer NOT NULL,
	"type" varchar(50) NOT NULL,
	"direction" varchar(10) NOT NULL,
	"quantity" numeric(18,6) NOT NULL,
	"cost_price" numeric(18,6) NOT NULL,
	"reference_type" varchar(50),
	"reference_id" integer,
	"notes" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer,
	CONSTRAINT "stock_movements_direction_chk" CHECK ("direction" IN ('in', 'out'))
);
--> statement-breakpoint
CREATE TABLE "stock_opname_lines" (
	"id" serial PRIMARY KEY,
	"opname_id" integer NOT NULL,
	"material_id" integer NOT NULL,
	"system_qty" numeric(18,6) NOT NULL,
	"actual_qty" numeric(18,6) NOT NULL,
	"reason" varchar(500)
);
--> statement-breakpoint
CREATE TABLE "stock_opnames" (
	"id" serial PRIMARY KEY,
	"opname_no" varchar(100) NOT NULL,
	"location_id" integer NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"conducted_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_by" integer,
	CONSTRAINT "stock_opnames_status_chk" CHECK ("status" IN ('draft', 'in_progress', 'completed', 'cancelled'))
);
--> statement-breakpoint
CREATE TABLE "supplier_materials" (
	"id" serial PRIMARY KEY,
	"supplier_id" integer NOT NULL,
	"material_id" integer NOT NULL,
	"unit_price" numeric(18,2) NOT NULL,
	"uom_id" integer NOT NULL,
	"min_order_qty" numeric(18,6),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" serial PRIMARY KEY,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"contact_person" varchar(255),
	"phone" varchar(50),
	"email" varchar(255),
	"address" varchar(500),
	"payment_terms" integer,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "tables" (
	"id" serial PRIMARY KEY,
	"location_id" integer NOT NULL,
	"number" varchar(50) NOT NULL,
	"capacity" integer DEFAULT 4 NOT NULL,
	"status" varchar(20) DEFAULT 'available' NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "tables_status_chk" CHECK ("status" IN ('available', 'occupied', 'reserved'))
);
--> statement-breakpoint
CREATE TABLE "transfer_lines" (
	"id" serial PRIMARY KEY,
	"transfer_id" integer NOT NULL,
	"material_id" integer NOT NULL,
	"requested_qty" numeric(18,6) NOT NULL,
	"shipped_qty" numeric(18,6),
	"received_qty" numeric(18,6),
	"uom_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transfer_requests" (
	"id" serial PRIMARY KEY,
	"transfer_no" varchar(100) NOT NULL,
	"from_location_id" integer NOT NULL,
	"to_location_id" integer NOT NULL,
	"status" varchar(20) DEFAULT 'requested' NOT NULL,
	"notes" varchar(1000),
	"requested_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_by" integer,
	CONSTRAINT "transfer_requests_status_chk" CHECK ("status" IN ('requested', 'in_transit', 'received', 'cancelled')),
	CONSTRAINT "transfer_requests_diff_location_chk" CHECK ("from_location_id" != "to_location_id")
);
--> statement-breakpoint
CREATE TABLE "uom_conversions" (
	"id" serial PRIMARY KEY,
	"from_uom_id" integer NOT NULL,
	"to_uom_id" integer NOT NULL,
	"factor" numeric(18,6) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_by" integer,
	CONSTRAINT "uom_conversions_factor_positive_chk" CHECK ("factor" > 0)
);
--> statement-breakpoint
CREATE TABLE "uoms" (
	"id" serial PRIMARY KEY,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_by" integer,
	CONSTRAINT "uoms_category_chk" CHECK ("category" IN ('weight', 'volume', 'quantity', 'length'))
);
--> statement-breakpoint
CREATE TABLE "user_assignments" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL,
	"role_id" integer NOT NULL,
	"location_id" integer
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY,
	"username" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(500) NOT NULL,
	"name" varchar(255) NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_by" integer
);
--> statement-breakpoint
CREATE INDEX "cashier_shifts_location_id_idx" ON "cashier_shifts" ("location_id");--> statement-breakpoint
CREATE INDEX "cashier_shifts_user_id_idx" ON "cashier_shifts" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "locations_code_uniq" ON "locations" ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "material_locations_material_location_uniq" ON "material_locations" ("material_id","location_id");--> statement-breakpoint
CREATE INDEX "material_locations_material_id_idx" ON "material_locations" ("material_id");--> statement-breakpoint
CREATE INDEX "material_locations_location_id_idx" ON "material_locations" ("location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "materials_code_uniq" ON "materials" ("code");--> statement-breakpoint
CREATE INDEX "materials_category_id_idx" ON "materials" ("category_id");--> statement-breakpoint
CREATE INDEX "materials_base_uom_id_idx" ON "materials" ("base_uom_id");--> statement-breakpoint
CREATE INDEX "materials_default_purchase_uom_id_idx" ON "materials" ("default_purchase_uom_id");--> statement-breakpoint
CREATE INDEX "materials_default_stock_uom_id_idx" ON "materials" ("default_stock_uom_id");--> statement-breakpoint
CREATE INDEX "materials_default_recipe_uom_id_idx" ON "materials" ("default_recipe_uom_id");--> statement-breakpoint
CREATE INDEX "menu_categories_location_id_idx" ON "menu_categories" ("location_id");--> statement-breakpoint
CREATE INDEX "menu_categories_parent_id_idx" ON "menu_categories" ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "menu_item_modifiers_item_group_uniq" ON "menu_item_modifiers" ("menu_item_id","modifier_group_id");--> statement-breakpoint
CREATE INDEX "menu_item_modifiers_menu_item_id_idx" ON "menu_item_modifiers" ("menu_item_id");--> statement-breakpoint
CREATE INDEX "menu_item_modifiers_modifier_group_id_idx" ON "menu_item_modifiers" ("modifier_group_id");--> statement-breakpoint
CREATE UNIQUE INDEX "menu_items_location_sku_uniq" ON "menu_items" ("location_id","sku");--> statement-breakpoint
CREATE INDEX "menu_items_location_id_idx" ON "menu_items" ("location_id");--> statement-breakpoint
CREATE INDEX "menu_items_category_id_idx" ON "menu_items" ("category_id");--> statement-breakpoint
CREATE INDEX "modifier_groups_location_id_idx" ON "modifier_groups" ("location_id");--> statement-breakpoint
CREATE INDEX "modifier_options_group_id_idx" ON "modifier_options" ("group_id");--> statement-breakpoint
CREATE INDEX "order_lines_order_id_idx" ON "order_lines" ("order_id");--> statement-breakpoint
CREATE INDEX "order_lines_menu_item_id_idx" ON "order_lines" ("menu_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_order_no_uniq" ON "orders" ("order_no");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_external_ref_uniq" ON "orders" ("external_ref") WHERE "external_ref" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "orders_location_status_ordered_idx" ON "orders" ("location_id","status","ordered_at");--> statement-breakpoint
CREATE INDEX "orders_table_id_idx" ON "orders" ("table_id");--> statement-breakpoint
CREATE INDEX "orders_shift_id_idx" ON "orders" ("shift_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_method_locations_method_location_uniq" ON "payment_method_locations" ("payment_method_id","location_id");--> statement-breakpoint
CREATE INDEX "payment_method_locations_payment_method_id_idx" ON "payment_method_locations" ("payment_method_id");--> statement-breakpoint
CREATE INDEX "payment_method_locations_location_id_idx" ON "payment_method_locations" ("location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_methods_code_uniq" ON "payment_methods" ("code");--> statement-breakpoint
CREATE INDEX "payments_order_id_idx" ON "payments" ("order_id");--> statement-breakpoint
CREATE INDEX "payments_payment_method_id_idx" ON "payments" ("payment_method_id");--> statement-breakpoint
CREATE UNIQUE INDEX "production_orders_production_no_uniq" ON "production_orders" ("production_no");--> statement-breakpoint
CREATE INDEX "production_orders_location_id_idx" ON "production_orders" ("location_id");--> statement-breakpoint
CREATE INDEX "production_orders_material_id_idx" ON "production_orders" ("material_id");--> statement-breakpoint
CREATE INDEX "production_orders_recipe_id_idx" ON "production_orders" ("recipe_id");--> statement-breakpoint
CREATE INDEX "production_orders_produced_by_idx" ON "production_orders" ("produced_by");--> statement-breakpoint
CREATE INDEX "production_recipe_lines_recipe_id_idx" ON "production_recipe_lines" ("recipe_id");--> statement-breakpoint
CREATE INDEX "production_recipe_lines_material_id_idx" ON "production_recipe_lines" ("material_id");--> statement-breakpoint
CREATE INDEX "production_recipe_lines_uom_id_idx" ON "production_recipe_lines" ("uom_id");--> statement-breakpoint
CREATE UNIQUE INDEX "production_recipes_material_active_uniq" ON "production_recipes" ("material_id") WHERE "is_active" = 1;--> statement-breakpoint
CREATE INDEX "production_recipes_material_id_idx" ON "production_recipes" ("material_id");--> statement-breakpoint
CREATE INDEX "production_recipes_yield_uom_id_idx" ON "production_recipes" ("yield_uom_id");--> statement-breakpoint
CREATE INDEX "receiving_lines_receiving_id_idx" ON "receiving_lines" ("receiving_id");--> statement-breakpoint
CREATE INDEX "receiving_lines_material_id_idx" ON "receiving_lines" ("material_id");--> statement-breakpoint
CREATE INDEX "receiving_lines_uom_id_idx" ON "receiving_lines" ("uom_id");--> statement-breakpoint
CREATE UNIQUE INDEX "receivings_receiving_no_uniq" ON "receivings" ("receiving_no");--> statement-breakpoint
CREATE INDEX "receivings_location_id_idx" ON "receivings" ("location_id");--> statement-breakpoint
CREATE INDEX "receivings_supplier_id_idx" ON "receivings" ("supplier_id");--> statement-breakpoint
CREATE INDEX "receivings_received_by_idx" ON "receivings" ("received_by");--> statement-breakpoint
CREATE INDEX "recipe_lines_recipe_id_idx" ON "recipe_lines" ("recipe_id");--> statement-breakpoint
CREATE INDEX "recipe_lines_material_id_idx" ON "recipe_lines" ("material_id");--> statement-breakpoint
CREATE INDEX "recipe_lines_uom_id_idx" ON "recipe_lines" ("uom_id");--> statement-breakpoint
CREATE UNIQUE INDEX "recipes_menu_item_active_uniq" ON "recipes" ("menu_item_id") WHERE "is_active" = 1;--> statement-breakpoint
CREATE INDEX "recipes_menu_item_id_idx" ON "recipes" ("menu_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "roles_code_uniq" ON "roles" ("code");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stock_balances_material_location_uniq" ON "stock_balances" ("material_id","location_id");--> statement-breakpoint
CREATE INDEX "stock_balances_material_id_idx" ON "stock_balances" ("material_id");--> statement-breakpoint
CREATE INDEX "stock_balances_location_id_idx" ON "stock_balances" ("location_id");--> statement-breakpoint
CREATE INDEX "stock_movements_material_location_created_idx" ON "stock_movements" ("material_id","location_id","created_at");--> statement-breakpoint
CREATE INDEX "stock_movements_material_id_idx" ON "stock_movements" ("material_id");--> statement-breakpoint
CREATE INDEX "stock_movements_location_id_idx" ON "stock_movements" ("location_id");--> statement-breakpoint
CREATE INDEX "stock_movements_created_by_idx" ON "stock_movements" ("created_by");--> statement-breakpoint
CREATE INDEX "stock_opname_lines_opname_id_idx" ON "stock_opname_lines" ("opname_id");--> statement-breakpoint
CREATE INDEX "stock_opname_lines_material_id_idx" ON "stock_opname_lines" ("material_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stock_opnames_opname_no_uniq" ON "stock_opnames" ("opname_no");--> statement-breakpoint
CREATE INDEX "stock_opnames_location_id_idx" ON "stock_opnames" ("location_id");--> statement-breakpoint
CREATE INDEX "stock_opnames_conducted_by_idx" ON "stock_opnames" ("conducted_by");--> statement-breakpoint
CREATE UNIQUE INDEX "supplier_materials_supplier_material_uniq" ON "supplier_materials" ("supplier_id","material_id");--> statement-breakpoint
CREATE INDEX "supplier_materials_supplier_id_idx" ON "supplier_materials" ("supplier_id");--> statement-breakpoint
CREATE INDEX "supplier_materials_material_id_idx" ON "supplier_materials" ("material_id");--> statement-breakpoint
CREATE INDEX "supplier_materials_uom_id_idx" ON "supplier_materials" ("uom_id");--> statement-breakpoint
CREATE UNIQUE INDEX "suppliers_code_uniq" ON "suppliers" ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "tables_location_number_uniq" ON "tables" ("location_id","number");--> statement-breakpoint
CREATE INDEX "tables_location_id_idx" ON "tables" ("location_id");--> statement-breakpoint
CREATE INDEX "transfer_lines_transfer_id_idx" ON "transfer_lines" ("transfer_id");--> statement-breakpoint
CREATE INDEX "transfer_lines_material_id_idx" ON "transfer_lines" ("material_id");--> statement-breakpoint
CREATE INDEX "transfer_lines_uom_id_idx" ON "transfer_lines" ("uom_id");--> statement-breakpoint
CREATE UNIQUE INDEX "transfer_requests_transfer_no_uniq" ON "transfer_requests" ("transfer_no");--> statement-breakpoint
CREATE INDEX "transfer_requests_from_location_id_idx" ON "transfer_requests" ("from_location_id");--> statement-breakpoint
CREATE INDEX "transfer_requests_to_location_id_idx" ON "transfer_requests" ("to_location_id");--> statement-breakpoint
CREATE INDEX "transfer_requests_requested_by_idx" ON "transfer_requests" ("requested_by");--> statement-breakpoint
CREATE UNIQUE INDEX "uom_conversions_from_to_uniq" ON "uom_conversions" ("from_uom_id","to_uom_id");--> statement-breakpoint
CREATE INDEX "uom_conversions_from_uom_id_idx" ON "uom_conversions" ("from_uom_id");--> statement-breakpoint
CREATE INDEX "uom_conversions_to_uom_id_idx" ON "uom_conversions" ("to_uom_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uoms_code_uniq" ON "uoms" ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "user_assignments_user_role_location_uniq" ON "user_assignments" ("user_id","role_id","location_id");--> statement-breakpoint
CREATE INDEX "user_assignments_user_id_idx" ON "user_assignments" ("user_id");--> statement-breakpoint
CREATE INDEX "user_assignments_role_id_idx" ON "user_assignments" ("role_id");--> statement-breakpoint
CREATE INDEX "user_assignments_location_id_idx" ON "user_assignments" ("location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_uniq" ON "users" ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uniq" ON "users" ("email");--> statement-breakpoint
ALTER TABLE "cashier_shifts" ADD CONSTRAINT "cashier_shifts_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "cashier_shifts" ADD CONSTRAINT "cashier_shifts_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "material_locations" ADD CONSTRAINT "material_locations_material_id_materials_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "material_locations" ADD CONSTRAINT "material_locations_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_category_id_material_categories_id_fkey" FOREIGN KEY ("category_id") REFERENCES "material_categories"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_base_uom_id_uoms_id_fkey" FOREIGN KEY ("base_uom_id") REFERENCES "uoms"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_default_purchase_uom_id_uoms_id_fkey" FOREIGN KEY ("default_purchase_uom_id") REFERENCES "uoms"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_default_stock_uom_id_uoms_id_fkey" FOREIGN KEY ("default_stock_uom_id") REFERENCES "uoms"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_default_recipe_uom_id_uoms_id_fkey" FOREIGN KEY ("default_recipe_uom_id") REFERENCES "uoms"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "menu_item_modifiers" ADD CONSTRAINT "menu_item_modifiers_menu_item_id_menu_items_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "menu_item_modifiers" ADD CONSTRAINT "menu_item_modifiers_modifier_group_id_modifier_groups_id_fkey" FOREIGN KEY ("modifier_group_id") REFERENCES "modifier_groups"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_category_id_menu_categories_id_fkey" FOREIGN KEY ("category_id") REFERENCES "menu_categories"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "modifier_groups" ADD CONSTRAINT "modifier_groups_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "modifier_options" ADD CONSTRAINT "modifier_options_group_id_modifier_groups_id_fkey" FOREIGN KEY ("group_id") REFERENCES "modifier_groups"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_order_id_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_menu_item_id_menu_items_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_voided_by_users_id_fkey" FOREIGN KEY ("voided_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_table_id_tables_id_fkey" FOREIGN KEY ("table_id") REFERENCES "tables"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_shift_id_cashier_shifts_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "cashier_shifts"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "payment_method_locations" ADD CONSTRAINT "payment_method_locations_Y9fBHc45kL6w_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payment_method_locations" ADD CONSTRAINT "payment_method_locations_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_payment_method_id_payment_methods_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_material_id_materials_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_recipe_id_production_recipes_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "production_recipes"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_produced_by_users_id_fkey" FOREIGN KEY ("produced_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "production_recipe_lines" ADD CONSTRAINT "production_recipe_lines_recipe_id_production_recipes_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "production_recipes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "production_recipe_lines" ADD CONSTRAINT "production_recipe_lines_material_id_materials_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "production_recipe_lines" ADD CONSTRAINT "production_recipe_lines_uom_id_uoms_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "uoms"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "production_recipes" ADD CONSTRAINT "production_recipes_material_id_materials_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "production_recipes" ADD CONSTRAINT "production_recipes_yield_uom_id_uoms_id_fkey" FOREIGN KEY ("yield_uom_id") REFERENCES "uoms"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "receiving_lines" ADD CONSTRAINT "receiving_lines_receiving_id_receivings_id_fkey" FOREIGN KEY ("receiving_id") REFERENCES "receivings"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "receiving_lines" ADD CONSTRAINT "receiving_lines_material_id_materials_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "receiving_lines" ADD CONSTRAINT "receiving_lines_uom_id_uoms_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "uoms"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "receivings" ADD CONSTRAINT "receivings_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "receivings" ADD CONSTRAINT "receivings_supplier_id_suppliers_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "receivings" ADD CONSTRAINT "receivings_received_by_users_id_fkey" FOREIGN KEY ("received_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "recipe_lines" ADD CONSTRAINT "recipe_lines_recipe_id_recipes_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "recipe_lines" ADD CONSTRAINT "recipe_lines_material_id_materials_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "recipe_lines" ADD CONSTRAINT "recipe_lines_uom_id_uoms_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "uoms"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_menu_item_id_menu_items_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "stock_balances" ADD CONSTRAINT "stock_balances_material_id_materials_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "stock_balances" ADD CONSTRAINT "stock_balances_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_material_id_materials_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "stock_opname_lines" ADD CONSTRAINT "stock_opname_lines_opname_id_stock_opnames_id_fkey" FOREIGN KEY ("opname_id") REFERENCES "stock_opnames"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "stock_opname_lines" ADD CONSTRAINT "stock_opname_lines_material_id_materials_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "stock_opnames" ADD CONSTRAINT "stock_opnames_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "stock_opnames" ADD CONSTRAINT "stock_opnames_conducted_by_users_id_fkey" FOREIGN KEY ("conducted_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "supplier_materials" ADD CONSTRAINT "supplier_materials_supplier_id_suppliers_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "supplier_materials" ADD CONSTRAINT "supplier_materials_material_id_materials_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "supplier_materials" ADD CONSTRAINT "supplier_materials_uom_id_uoms_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "uoms"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "tables" ADD CONSTRAINT "tables_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "transfer_lines" ADD CONSTRAINT "transfer_lines_transfer_id_transfer_requests_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "transfer_requests"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "transfer_lines" ADD CONSTRAINT "transfer_lines_material_id_materials_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "transfer_lines" ADD CONSTRAINT "transfer_lines_uom_id_uoms_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "uoms"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_from_location_id_locations_id_fkey" FOREIGN KEY ("from_location_id") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_to_location_id_locations_id_fkey" FOREIGN KEY ("to_location_id") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_requested_by_users_id_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "uom_conversions" ADD CONSTRAINT "uom_conversions_from_uom_id_uoms_id_fkey" FOREIGN KEY ("from_uom_id") REFERENCES "uoms"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "uom_conversions" ADD CONSTRAINT "uom_conversions_to_uom_id_uoms_id_fkey" FOREIGN KEY ("to_uom_id") REFERENCES "uoms"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "user_assignments" ADD CONSTRAINT "user_assignments_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_assignments" ADD CONSTRAINT "user_assignments_role_id_roles_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "user_assignments" ADD CONSTRAINT "user_assignments_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL;