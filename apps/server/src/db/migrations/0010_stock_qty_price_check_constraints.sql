ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_base_price_nonneg_chk" CHECK ("menu_items"."base_price" >= 0);--> statement-breakpoint
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_quantity_positive_chk" CHECK ("order_lines"."quantity" > 0);--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_amount_positive_chk" CHECK ("payments"."amount" > 0);--> statement-breakpoint
ALTER TABLE "production_recipes" ADD CONSTRAINT "production_recipes_yield_qty_positive_chk" CHECK ("production_recipes"."yield_qty" > 0);--> statement-breakpoint
ALTER TABLE "receiving_lines" ADD CONSTRAINT "receiving_lines_quantity_positive_chk" CHECK ("receiving_lines"."quantity" > 0);--> statement-breakpoint
ALTER TABLE "receiving_lines" ADD CONSTRAINT "receiving_lines_unit_cost_nonneg_chk" CHECK ("receiving_lines"."unit_cost" >= 0);--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_yield_qty_positive_chk" CHECK ("recipes"."yield_qty" > 0);--> statement-breakpoint
ALTER TABLE "stock_balances" ADD CONSTRAINT "stock_balances_cost_price_nonneg_chk" CHECK ("stock_balances"."cost_price" >= 0);--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_quantity_nonneg_chk" CHECK ("stock_movements"."quantity" >= 0);--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_cost_price_nonneg_chk" CHECK ("stock_movements"."cost_price" >= 0);--> statement-breakpoint
ALTER TABLE "transfer_lines" ADD CONSTRAINT "transfer_lines_requested_qty_positive_chk" CHECK ("transfer_lines"."requested_qty" > 0);--> statement-breakpoint
ALTER TABLE "transfer_lines" ADD CONSTRAINT "transfer_lines_shipped_qty_nonneg_chk" CHECK ("transfer_lines"."shipped_qty" >= 0);--> statement-breakpoint
ALTER TABLE "transfer_lines" ADD CONSTRAINT "transfer_lines_shipped_cost_price_nonneg_chk" CHECK ("transfer_lines"."shipped_cost_price" >= 0);--> statement-breakpoint
ALTER TABLE "transfer_lines" ADD CONSTRAINT "transfer_lines_received_qty_nonneg_chk" CHECK ("transfer_lines"."received_qty" >= 0);--> statement-breakpoint
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_value_positive_chk" CHECK ("vouchers"."value" > 0);--> statement-breakpoint
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_usage_count_nonneg_chk" CHECK ("vouchers"."usage_count" >= 0);