ALTER TABLE "cashier_shifts" ALTER COLUMN "opening_cash" SET DATA TYPE numeric(18, 0);--> statement-breakpoint
ALTER TABLE "cashier_shifts" ALTER COLUMN "opening_cash" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "cashier_shifts" ALTER COLUMN "closing_cash" SET DATA TYPE numeric(18, 0);--> statement-breakpoint
ALTER TABLE "cashier_shifts" ALTER COLUMN "expected_cash" SET DATA TYPE numeric(18, 0);--> statement-breakpoint
ALTER TABLE "menu_items" ALTER COLUMN "base_price" SET DATA TYPE numeric(18, 0);--> statement-breakpoint
ALTER TABLE "modifier_options" ALTER COLUMN "price_adjustment" SET DATA TYPE numeric(18, 0);--> statement-breakpoint
ALTER TABLE "modifier_options" ALTER COLUMN "price_adjustment" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "order_lines" ALTER COLUMN "unit_price" SET DATA TYPE numeric(18, 0);--> statement-breakpoint
ALTER TABLE "order_lines" ALTER COLUMN "modifier_total" SET DATA TYPE numeric(18, 0);--> statement-breakpoint
ALTER TABLE "order_lines" ALTER COLUMN "modifier_total" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "order_lines" ALTER COLUMN "discount_amount" SET DATA TYPE numeric(18, 0);--> statement-breakpoint
ALTER TABLE "order_lines" ALTER COLUMN "discount_amount" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "order_lines" ALTER COLUMN "line_total" SET DATA TYPE numeric(18, 0);--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "subtotal" SET DATA TYPE numeric(18, 0);--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "subtotal" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "discount_amount" SET DATA TYPE numeric(18, 0);--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "discount_amount" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "tax_amount" SET DATA TYPE numeric(18, 0);--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "tax_amount" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "total" SET DATA TYPE numeric(18, 0);--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "total" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "amount" SET DATA TYPE numeric(18, 0);--> statement-breakpoint
ALTER TABLE "receiving_lines" ALTER COLUMN "unit_cost" SET DATA TYPE numeric(18, 4);--> statement-breakpoint
ALTER TABLE "stock_balances" ALTER COLUMN "cost_price" SET DATA TYPE numeric(18, 4);--> statement-breakpoint
ALTER TABLE "stock_balances" ALTER COLUMN "cost_price" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "stock_movements" ALTER COLUMN "cost_price" SET DATA TYPE numeric(18, 4);--> statement-breakpoint
ALTER TABLE "supplier_materials" ALTER COLUMN "unit_price" SET DATA TYPE numeric(18, 4);--> statement-breakpoint
ALTER TABLE "transfer_lines" ALTER COLUMN "shipped_cost_price" SET DATA TYPE numeric(18, 4);--> statement-breakpoint
ALTER TABLE "vouchers" ALTER COLUMN "min_purchase" SET DATA TYPE numeric(18, 0);--> statement-breakpoint
ALTER TABLE "vouchers" ALTER COLUMN "max_discount" SET DATA TYPE numeric(18, 0);