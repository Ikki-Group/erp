CREATE TYPE "public"."material_type" AS ENUM('raw', 'semi');--> statement-breakpoint
CREATE TABLE "location_materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"locationId" integer NOT NULL,
	"materialId" integer NOT NULL,
	"stockAlertThreshold" numeric(20, 6) DEFAULT '0',
	"weightedAvgCost" numeric(20, 6) DEFAULT '0',
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "location_materials_locationId_materialId_unique" UNIQUE("locationId","materialId")
);
--> statement-breakpoint
CREATE TABLE "material_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "material_categories_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "material_units" (
	"id" serial PRIMARY KEY NOT NULL,
	"materialId" integer NOT NULL,
	"uomId" integer NOT NULL,
	"isBaseUnit" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "material_units_materialId_uomId_unique" UNIQUE("materialId","uomId")
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"sku" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" "material_type" NOT NULL,
	"categoryId" integer,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "materials_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "units_of_measure" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"symbol" varchar(20) NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "units_of_measure_code_unique" UNIQUE("code"),
	CONSTRAINT "units_of_measure_symbol_unique" UNIQUE("symbol")
);
--> statement-breakpoint
CREATE TABLE "uom_conversions" (
	"id" serial PRIMARY KEY NOT NULL,
	"fromUomId" integer NOT NULL,
	"toUomId" integer NOT NULL,
	"conversionFactor" numeric(20, 6) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "uom_conversions_fromUomId_toUomId_unique" UNIQUE("fromUomId","toUomId")
);
--> statement-breakpoint
ALTER TABLE "location_materials" ADD CONSTRAINT "location_materials_locationId_locations_id_fk" FOREIGN KEY ("locationId") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_materials" ADD CONSTRAINT "location_materials_materialId_materials_id_fk" FOREIGN KEY ("materialId") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_units" ADD CONSTRAINT "material_units_materialId_materials_id_fk" FOREIGN KEY ("materialId") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_units" ADD CONSTRAINT "material_units_uomId_units_of_measure_id_fk" FOREIGN KEY ("uomId") REFERENCES "public"."units_of_measure"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_categoryId_material_categories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."material_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uom_conversions" ADD CONSTRAINT "uom_conversions_fromUomId_units_of_measure_id_fk" FOREIGN KEY ("fromUomId") REFERENCES "public"."units_of_measure"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uom_conversions" ADD CONSTRAINT "uom_conversions_toUomId_units_of_measure_id_fk" FOREIGN KEY ("toUomId") REFERENCES "public"."units_of_measure"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_locationId_locations_id_fk" FOREIGN KEY ("locationId") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;