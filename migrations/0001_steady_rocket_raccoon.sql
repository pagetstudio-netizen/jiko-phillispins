ALTER TABLE "deposits" ADD COLUMN "screenshot_data" text;--> statement-breakpoint
ALTER TABLE "deposits" ADD COLUMN "sender_number" text;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD COLUMN "cloudpay_order_id" text;