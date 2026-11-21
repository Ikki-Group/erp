DROP INDEX "audit_logs_timestamp_idx";--> statement-breakpoint
DROP INDEX "stock_movements_material_location_created_idx";--> statement-breakpoint
CREATE INDEX "audit_logs_timestamp_id_idx" ON "audit_logs" USING btree ("timestamp","id");--> statement-breakpoint
CREATE INDEX "orders_location_ordered_id_idx" ON "orders" USING btree ("location_id","ordered_at","id");--> statement-breakpoint
CREATE INDEX "stock_movements_material_location_created_id_idx" ON "stock_movements" USING btree ("material_id","location_id","created_at","id");