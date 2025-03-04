ALTER TABLE "projects" ADD COLUMN "rewriteUrl" text;--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "forwarded" boolean DEFAULT false NOT NULL;