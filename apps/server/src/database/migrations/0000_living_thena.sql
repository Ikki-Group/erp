CREATE SCHEMA "ikki-dev";
--> statement-breakpoint
CREATE TABLE "ikki-dev"."locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"address" text DEFAULT '',
	"city" varchar(100) DEFAULT '',
	"province" varchar(100) DEFAULT '',
	"postalCode" varchar(20) DEFAULT '',
	"phone" varchar(50) DEFAULT '',
	"email" varchar(255) DEFAULT '',
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "locations_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ikki-dev"."roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"permissionCodes" jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ikki-dev"."userRoleAssignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"roleId" uuid NOT NULL,
	"locationId" uuid,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ikki-dev"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fullName" varchar(255) NOT NULL,
	"username" varchar(50) NOT NULL,
	"email" varchar(255) NOT NULL,
	"passwordHash" varchar(255) NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"lastLoginAt" timestamp with time zone,
	"deletedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "ikki-dev"."userRoleAssignments" ADD CONSTRAINT "userRoleAssignments_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "ikki-dev"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ikki-dev"."userRoleAssignments" ADD CONSTRAINT "userRoleAssignments_roleId_roles_id_fk" FOREIGN KEY ("roleId") REFERENCES "ikki-dev"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ikki-dev"."userRoleAssignments" ADD CONSTRAINT "userRoleAssignments_locationId_locations_id_fk" FOREIGN KEY ("locationId") REFERENCES "ikki-dev"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_user_role_location" ON "ikki-dev"."userRoleAssignments" USING btree ("userId","roleId","locationId");