DROP INDEX "stock_opnames_location_active_uniq";--> statement-breakpoint
ALTER TABLE "transfer_lines" ADD COLUMN "shipped_cost_price" numeric(18, 6);--> statement-breakpoint
CREATE UNIQUE INDEX "stock_opnames_location_active_uniq" ON "stock_opnames" USING btree ("location_id") WHERE "stock_opnames"."status" = 'draft';