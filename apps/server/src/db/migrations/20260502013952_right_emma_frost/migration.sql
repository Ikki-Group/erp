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
CREATE INDEX "stock_transfer_items_transfer_idx" ON "stock_transfer_items" ("transferId");--> statement-breakpoint
CREATE INDEX "stock_transfer_items_material_idx" ON "stock_transfer_items" ("materialId");--> statement-breakpoint
CREATE INDEX "stock_transfers_source_idx" ON "stock_transfers" ("sourceLocationId");--> statement-breakpoint
CREATE INDEX "stock_transfers_destination_idx" ON "stock_transfers" ("destinationLocationId");--> statement-breakpoint
CREATE INDEX "stock_transfers_status_idx" ON "stock_transfers" ("status");--> statement-breakpoint
CREATE INDEX "stock_transfers_date_idx" ON "stock_transfers" ("transfer_date");--> statement-breakpoint
ALTER TABLE "stock_transfer_items" ADD CONSTRAINT "stock_transfer_items_transferId_stock_transfers_id_fkey" FOREIGN KEY ("transferId") REFERENCES "stock_transfers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "stock_transfer_items" ADD CONSTRAINT "stock_transfer_items_materialId_materials_id_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_sourceLocationId_locations_id_fkey" FOREIGN KEY ("sourceLocationId") REFERENCES "locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_destinationLocationId_locations_id_fkey" FOREIGN KEY ("destinationLocationId") REFERENCES "locations"("id") ON DELETE RESTRICT;