CREATE TYPE "public"."item_type" AS ENUM('raw', 'semi');--> statement-breakpoint
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
CREATE TABLE "materialCategories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(255),
	"sku" varchar(255) NOT NULL,
	"categoryId" integer,
	"baseUomId" integer NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "materialUoms" (
	"isBase" boolean DEFAULT false NOT NULL,
	"materialId" integer NOT NULL,
	"uomId" integer NOT NULL,
	"conversionFactor" numeric(18, 6) NOT NULL,
	CONSTRAINT "materialUoms_materialId_uomId_pk" PRIMARY KEY("materialId","uomId"),
	CONSTRAINT "uom_base" UNIQUE("materialId","isBase")
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
CREATE TABLE "uoms" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(255) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"createdBy" integer NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"updatedBy" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_assignments" (
	"userId" integer NOT NULL,
	"roleId" integer NOT NULL,
	"locationId" integer NOT NULL,
	"isDefault" boolean DEFAULT false NOT NULL,
	CONSTRAINT "user_assignments_userId_roleId_locationId_pk" PRIMARY KEY("userId","roleId","locationId")
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"userId" integer NOT NULL,
	"token" varchar(255) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp NOT NULL,
	CONSTRAINT "user_sessions_token_unique" UNIQUE("token")
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
ALTER TABLE "materials" ADD CONSTRAINT "materials_categoryId_materialCategories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."materialCategories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_baseUomId_uoms_id_fk" FOREIGN KEY ("baseUomId") REFERENCES "public"."uoms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materialUoms" ADD CONSTRAINT "materialUoms_materialId_materials_id_fk" FOREIGN KEY ("materialId") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materialUoms" ADD CONSTRAINT "materialUoms_uomId_uoms_id_fk" FOREIGN KEY ("uomId") REFERENCES "public"."uoms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_assignments" ADD CONSTRAINT "user_assignments_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_assignments" ADD CONSTRAINT "user_assignments_roleId_roles_id_fk" FOREIGN KEY ("roleId") REFERENCES "public"."roles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_assignments" ADD CONSTRAINT "user_assignments_locationId_locations_id_fk" FOREIGN KEY ("locationId") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "material_category_name" ON "materialCategories" USING btree (lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "material_name" ON "materials" USING btree (lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "material_sku" ON "materials" USING btree (lower("sku"));--> statement-breakpoint
CREATE UNIQUE INDEX "uom_code" ON "uoms" USING btree (lower("code"));