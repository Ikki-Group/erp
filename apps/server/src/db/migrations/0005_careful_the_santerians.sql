ALTER TABLE "user_assignments" DROP CONSTRAINT "user_assignments_location_id_locations_id_fk";
--> statement-breakpoint
ALTER TABLE "user_assignments" ADD CONSTRAINT "user_assignments_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;