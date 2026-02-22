CREATE TYPE "public"."item_type" AS ENUM('raw', 'semi');--> statement-breakpoint
CREATE TABLE "itemCategories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "itemLocations" (
	"id" serial PRIMARY KEY NOT NULL,
	"itemId" integer NOT NULL,
	"locationId" integer NOT NULL,
	"isAssigned" boolean DEFAULT false NOT NULL,
	"stockAlertLevel" integer DEFAULT 0 NOT NULL,
	"allowNegativeStock" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "itemUnitConversions" (
	"id" serial PRIMARY KEY NOT NULL,
	"itemId" integer NOT NULL,
	"fromUnit" text NOT NULL,
	"toUnit" text NOT NULL,
	"multiplier" numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" "item_type" NOT NULL,
	"baseUnit" text NOT NULL,
	"categoryId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
DROP TABLE "location_materials" CASCADE;--> statement-breakpoint
DROP TABLE "material_categories" CASCADE;--> statement-breakpoint
DROP TABLE "material_uoms" CASCADE;--> statement-breakpoint
DROP TABLE "materials" CASCADE;--> statement-breakpoint
ALTER TABLE "itemLocations" ADD CONSTRAINT "itemLocations_itemId_items_id_fk" FOREIGN KEY ("itemId") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itemLocations" ADD CONSTRAINT "itemLocations_locationId_locations_id_fk" FOREIGN KEY ("locationId") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itemUnitConversions" ADD CONSTRAINT "itemUnitConversions_itemId_items_id_fk" FOREIGN KEY ("itemId") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itemUnitConversions" ADD CONSTRAINT "itemUnitConversions_fromUnit_uoms_code_fk" FOREIGN KEY ("fromUnit") REFERENCES "public"."uoms"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itemUnitConversions" ADD CONSTRAINT "itemUnitConversions_toUnit_uoms_code_fk" FOREIGN KEY ("toUnit") REFERENCES "public"."uoms"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_baseUnit_uoms_code_fk" FOREIGN KEY ("baseUnit") REFERENCES "public"."uoms"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_categoryId_itemCategories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."itemCategories"("id") ON DELETE no action ON UPDATE no action;