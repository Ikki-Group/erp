CREATE TABLE "uoms" (
	"code" varchar(50) PRIMARY KEY NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "material_uoms" (
	"materialId" integer NOT NULL,
	"uom" varchar(50) NOT NULL,
	"isBase" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "material_units" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "units_of_measure" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "uom_conversions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "material_units" CASCADE;--> statement-breakpoint
DROP TABLE "units_of_measure" CASCADE;--> statement-breakpoint
DROP TABLE "uom_conversions" CASCADE;--> statement-breakpoint
ALTER TABLE "material_categories" DROP CONSTRAINT "material_categories_code_unique";--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "baseUom" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "material_uoms" ADD CONSTRAINT "material_uoms_materialId_materials_id_fk" FOREIGN KEY ("materialId") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_uoms" ADD CONSTRAINT "material_uoms_uom_uoms_code_fk" FOREIGN KEY ("uom") REFERENCES "public"."uoms"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_baseUom_uoms_code_fk" FOREIGN KEY ("baseUom") REFERENCES "public"."uoms"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_categories" DROP COLUMN "code";