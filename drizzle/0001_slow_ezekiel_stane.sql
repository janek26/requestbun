CREATE TABLE "requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"projectId" uuid NOT NULL,
	"method" text NOT NULL,
	"query" jsonb,
	"headers" jsonb,
	"body" jsonb,
	"ip" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "requests_projectId_idx" ON "requests" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX "requests_timestamp_idx" ON "requests" USING btree ("timestamp");