ALTER TYPE "purchase_order_status" ADD VALUE 'pending_approval' BEFORE 'open';--> statement-breakpoint
ALTER TYPE "purchase_order_status" ADD VALUE 'approved' BEFORE 'open';--> statement-breakpoint
ALTER TYPE "purchase_order_status" ADD VALUE 'rejected' BEFORE 'open';