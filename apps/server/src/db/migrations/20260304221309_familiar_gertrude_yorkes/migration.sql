ALTER TABLE "products" ADD COLUMN "basePrice" numeric(18,4) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variants" DROP COLUMN "basePrice";