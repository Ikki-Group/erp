DROP INDEX "production_recipes_material_active_uniq";--> statement-breakpoint
DROP INDEX "recipes_menu_item_active_uniq";--> statement-breakpoint
ALTER TABLE "locations" ALTER COLUMN "is_active" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "locations" ALTER COLUMN "is_active" SET DATA TYPE boolean USING "is_active" <> 0;--> statement-breakpoint
ALTER TABLE "locations" ALTER COLUMN "is_active" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "materials" ALTER COLUMN "is_active" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "materials" ALTER COLUMN "is_active" SET DATA TYPE boolean USING "is_active" <> 0;--> statement-breakpoint
ALTER TABLE "materials" ALTER COLUMN "is_active" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "modifier_groups" ALTER COLUMN "is_required" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "modifier_groups" ALTER COLUMN "is_required" SET DATA TYPE boolean USING "is_required" <> 0;--> statement-breakpoint
ALTER TABLE "modifier_options" ALTER COLUMN "is_default" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "modifier_options" ALTER COLUMN "is_default" SET DATA TYPE boolean USING "is_default" <> 0;--> statement-breakpoint
ALTER TABLE "modifier_options" ALTER COLUMN "is_active" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "modifier_options" ALTER COLUMN "is_active" SET DATA TYPE boolean USING "is_active" <> 0;--> statement-breakpoint
ALTER TABLE "modifier_options" ALTER COLUMN "is_active" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "payment_method_locations" ALTER COLUMN "is_enabled" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "payment_method_locations" ALTER COLUMN "is_enabled" SET DATA TYPE boolean USING "is_enabled" <> 0;--> statement-breakpoint
ALTER TABLE "payment_method_locations" ALTER COLUMN "is_enabled" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "payment_methods" ALTER COLUMN "is_active" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "payment_methods" ALTER COLUMN "is_active" SET DATA TYPE boolean USING "is_active" <> 0;--> statement-breakpoint
ALTER TABLE "payment_methods" ALTER COLUMN "is_active" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "production_recipes" ALTER COLUMN "is_active" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "production_recipes" ALTER COLUMN "is_active" SET DATA TYPE boolean USING "is_active" <> 0;--> statement-breakpoint
ALTER TABLE "production_recipes" ALTER COLUMN "is_active" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "recipes" ALTER COLUMN "is_active" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "recipes" ALTER COLUMN "is_active" SET DATA TYPE boolean USING "is_active" <> 0;--> statement-breakpoint
ALTER TABLE "recipes" ALTER COLUMN "is_active" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "roles" ALTER COLUMN "is_system" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "roles" ALTER COLUMN "is_system" SET DATA TYPE boolean USING "is_system" <> 0;--> statement-breakpoint
ALTER TABLE "suppliers" ALTER COLUMN "is_active" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "suppliers" ALTER COLUMN "is_active" SET DATA TYPE boolean USING "is_active" <> 0;--> statement-breakpoint
ALTER TABLE "suppliers" ALTER COLUMN "is_active" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "tables" ALTER COLUMN "is_active" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "tables" ALTER COLUMN "is_active" SET DATA TYPE boolean USING "is_active" <> 0;--> statement-breakpoint
ALTER TABLE "tables" ALTER COLUMN "is_active" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "is_active" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "is_active" SET DATA TYPE boolean USING "is_active" <> 0;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "is_active" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "vouchers" ALTER COLUMN "is_active" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "vouchers" ALTER COLUMN "is_active" SET DATA TYPE boolean USING "is_active" <> 0;--> statement-breakpoint
ALTER TABLE "vouchers" ALTER COLUMN "is_active" SET DEFAULT true;--> statement-breakpoint
CREATE UNIQUE INDEX "production_recipes_material_active_uniq" ON "production_recipes" USING btree ("material_id") WHERE "production_recipes"."is_active" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "recipes_menu_item_active_uniq" ON "recipes" USING btree ("menu_item_id") WHERE "recipes"."is_active" = true;