CREATE TABLE "ikki-dev"."locationMaterials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"locationId" uuid NOT NULL,
	"materialId" uuid NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ikki-dev"."materialUoms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"materialId" uuid NOT NULL,
	"uomId" uuid NOT NULL,
	"conversionFactor" numeric(15, 6) NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ikki-dev"."materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(20) NOT NULL,
	"description" text,
	"baseUomId" uuid NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "materials_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ikki-dev"."uoms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"symbol" varchar(10),
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uoms_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "ikki-dev"."locationMaterials" ADD CONSTRAINT "locationMaterials_locationId_locations_id_fk" FOREIGN KEY ("locationId") REFERENCES "ikki-dev"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ikki-dev"."locationMaterials" ADD CONSTRAINT "locationMaterials_materialId_materials_id_fk" FOREIGN KEY ("materialId") REFERENCES "ikki-dev"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ikki-dev"."materialUoms" ADD CONSTRAINT "materialUoms_materialId_materials_id_fk" FOREIGN KEY ("materialId") REFERENCES "ikki-dev"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ikki-dev"."materialUoms" ADD CONSTRAINT "materialUoms_uomId_uoms_id_fk" FOREIGN KEY ("uomId") REFERENCES "ikki-dev"."uoms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ikki-dev"."materials" ADD CONSTRAINT "materials_baseUomId_uoms_id_fk" FOREIGN KEY ("baseUomId") REFERENCES "ikki-dev"."uoms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_location_material" ON "ikki-dev"."locationMaterials" USING btree ("locationId","materialId");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_material_uom" ON "ikki-dev"."materialUoms" USING btree ("materialId","uomId");