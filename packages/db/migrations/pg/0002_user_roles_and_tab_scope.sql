CREATE TABLE IF NOT EXISTS "user_roles" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "role" text NOT NULL,
  "granted_by" integer,
  "reason" text,
  "create_at" timestamp DEFAULT now(),
  "update_at" timestamp DEFAULT now(),
  "revoked_at" timestamp,
  CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "user_roles_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_roles_active_unique" ON "user_roles" ("user_id", "role") WHERE "revoked_at" IS NULL;
--> statement-breakpoint
ALTER TABLE "tabs" ADD COLUMN IF NOT EXISTS "scope" text DEFAULT 'public';
--> statement-breakpoint
UPDATE "tabs" SET "scope" = 'public' WHERE "scope" IS NULL;
--> statement-breakpoint
INSERT INTO "tabs" ("key", "label", "visible", "sort_order", "scope")
VALUES
  ('dev', '开发', true, 90, 'admin'),
  ('test', '测试', true, 91, 'admin')
ON CONFLICT ("key") DO UPDATE SET
  "label" = EXCLUDED."label",
  "sort_order" = EXCLUDED."sort_order",
  "scope" = 'admin',
  "update_at" = now();
