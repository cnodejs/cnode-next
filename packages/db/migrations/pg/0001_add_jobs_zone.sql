CREATE TABLE IF NOT EXISTS "job_meta" (
	"topic_id" integer PRIMARY KEY NOT NULL,
	"company" text NOT NULL,
	"company_logo" text,
	"position" text NOT NULL,
	"location" text NOT NULL,
	"remote" text NOT NULL,
	"salary_min" integer,
	"salary_max" integer,
	"experience" text,
	"tech_tags" text[],
	"contact" text NOT NULL,
	"create_at" timestamp DEFAULT now(),
	"update_at" timestamp DEFAULT now(),
	CONSTRAINT "job_meta_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
DO $$
BEGIN
	IF to_regclass('public.tabs') IS NULL AND to_regclass('public.community_tabs') IS NOT NULL THEN
		ALTER TABLE "community_tabs" RENAME TO "tabs";
	END IF;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tabs" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"visible" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"create_at" timestamp DEFAULT now(),
	"update_at" timestamp DEFAULT now(),
	CONSTRAINT "tabs_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "zones" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"visible" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"create_at" timestamp DEFAULT now(),
	"update_at" timestamp DEFAULT now(),
	CONSTRAINT "zones_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
INSERT INTO "tabs" ("key", "label", "visible", "sort_order")
VALUES
	('share', '分享', true, 1),
	('ask', '问答', true, 2),
	('job', '招聘', true, 3),
	('good', '精华', true, 4)
ON CONFLICT ("key") DO UPDATE SET
	"label" = EXCLUDED."label",
	"sort_order" = EXCLUDED."sort_order",
	"update_at" = now();
--> statement-breakpoint
INSERT INTO "zones" ("slug", "name", "description", "icon", "visible", "sort_order")
VALUES ('jobs', '招聘', 'Node.js 招聘信息专区', 'briefcase', false, 1)
ON CONFLICT ("slug") DO UPDATE SET
	"name" = EXCLUDED."name",
	"description" = EXCLUDED."description",
	"icon" = EXCLUDED."icon",
	"sort_order" = EXCLUDED."sort_order",
	"update_at" = now();
