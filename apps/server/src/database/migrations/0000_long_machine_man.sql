CREATE TYPE "public"."location_type" AS ENUM('store', 'warehouse');--> statement-breakpoint
CREATE TYPE "public"."material_type" AS ENUM('raw', 'semi');--> statement-breakpoint
CREATE TABLE "locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "location_type" NOT NULL,
	"description" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "locations_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "uoms" (
	"code" varchar(50) PRIMARY KEY NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
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
	"name" varchar(255) NOT NULL,
	"description" text,
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
CREATE TABLE "materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"sku" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" "material_type" NOT NULL,
	"categoryId" integer,
	"isActive" boolean DEFAULT true NOT NULL,
	"baseUom" varchar(50) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "materials_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"isSystem" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "roles_code_unique" UNIQUE("code"),
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_role_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"roleId" integer NOT NULL,
	"locationId" integer NOT NULL,
	"assignedAt" timestamp DEFAULT now() NOT NULL,
	"assignedBy" integer NOT NULL,
	CONSTRAINT "user_role_assignments_userId_locationId_unique" UNIQUE("userId","locationId")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"username" varchar(255) NOT NULL,
	"fullname" varchar(255) NOT NULL,
	"passwordHash" varchar(255) NOT NULL,
	"isRoot" boolean DEFAULT false NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"updatedBy" integer NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "location_materials" ADD CONSTRAINT "location_materials_locationId_locations_id_fk" FOREIGN KEY ("locationId") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_materials" ADD CONSTRAINT "location_materials_materialId_materials_id_fk" FOREIGN KEY ("materialId") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_uoms" ADD CONSTRAINT "material_uoms_materialId_materials_id_fk" FOREIGN KEY ("materialId") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_uoms" ADD CONSTRAINT "material_uoms_uom_uoms_code_fk" FOREIGN KEY ("uom") REFERENCES "public"."uoms"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_categoryId_material_categories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."material_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_baseUom_uoms_code_fk" FOREIGN KEY ("baseUom") REFERENCES "public"."uoms"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_roleId_roles_id_fk" FOREIGN KEY ("roleId") REFERENCES "public"."roles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_locationId_locations_id_fk" FOREIGN KEY ("locationId") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;