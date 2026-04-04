CREATE TABLE "employees" (
	"id" serial PRIMARY KEY,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"jobTitle" text,
	"department" text,
	"userId" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" serial PRIMARY KEY,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"address" text,
	"taxId" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"deleted_by" integer,
	"sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX "employees_code_idx" ON "employees" ("code") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE UNIQUE INDEX "suppliers_code_idx" ON "suppliers" ("code") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE UNIQUE INDEX "suppliers_name_idx" ON "suppliers" ("name") WHERE ("deleted_at" is null);--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL;