CREATE TABLE "ikki-dev"."location_materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"locationId" uuid NOT NULL,
	"materialId" uuid NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ikki-dev"."material_uoms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"materialId" uuid NOT NULL,
	"uomId" uuid NOT NULL,
	"conversionFactor" numeric(15, 6) NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ikki-dev"."user_role_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"roleId" uuid NOT NULL,
	"locationId" uuid,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "ikki-dev"."locationMaterials" CASCADE;--> statement-breakpoint
DROP TABLE "ikki-dev"."materialUoms" CASCADE;--> statement-breakpoint
DROP TABLE "ikki-dev"."userRoleAssignments" CASCADE;--> statement-breakpoint
ALTER TABLE "ikki-dev"."location_materials" ADD CONSTRAINT "location_materials_locationId_locations_id_fk" FOREIGN KEY ("locationId") REFERENCES "ikki-dev"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ikki-dev"."location_materials" ADD CONSTRAINT "location_materials_materialId_materials_id_fk" FOREIGN KEY ("materialId") REFERENCES "ikki-dev"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ikki-dev"."material_uoms" ADD CONSTRAINT "material_uoms_materialId_materials_id_fk" FOREIGN KEY ("materialId") REFERENCES "ikki-dev"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ikki-dev"."material_uoms" ADD CONSTRAINT "material_uoms_uomId_uoms_id_fk" FOREIGN KEY ("uomId") REFERENCES "ikki-dev"."uoms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ikki-dev"."user_role_assignments" ADD CONSTRAINT "user_role_assignments_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "ikki-dev"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ikki-dev"."user_role_assignments" ADD CONSTRAINT "user_role_assignments_roleId_roles_id_fk" FOREIGN KEY ("roleId") REFERENCES "ikki-dev"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ikki-dev"."user_role_assignments" ADD CONSTRAINT "user_role_assignments_locationId_locations_id_fk" FOREIGN KEY ("locationId") REFERENCES "ikki-dev"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_location_material" ON "ikki-dev"."location_materials" USING btree ("locationId","materialId");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_material_uom" ON "ikki-dev"."material_uoms" USING btree ("materialId","uomId");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_user_role_location" ON "ikki-dev"."user_role_assignments" USING btree ("userId","roleId","locationId");