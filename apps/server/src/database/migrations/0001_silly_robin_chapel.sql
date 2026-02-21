CREATE TABLE "user_role_locations" (
	"userId" integer NOT NULL,
	"roleId" integer NOT NULL,
	"locationId" integer NOT NULL,
	"isDefault" boolean DEFAULT false NOT NULL,
	CONSTRAINT "user_role_locations_userId_locationId_pk" PRIMARY KEY("userId","locationId")
);
--> statement-breakpoint
DROP TABLE "user_role_assignments" CASCADE;--> statement-breakpoint
ALTER TABLE "user_role_locations" ADD CONSTRAINT "user_role_locations_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role_locations" ADD CONSTRAINT "user_role_locations_roleId_roles_id_fk" FOREIGN KEY ("roleId") REFERENCES "public"."roles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role_locations" ADD CONSTRAINT "user_role_locations_locationId_locations_id_fk" FOREIGN KEY ("locationId") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;