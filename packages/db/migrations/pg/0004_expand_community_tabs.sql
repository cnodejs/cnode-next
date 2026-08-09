DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "topics"
    WHERE lower(btrim("tab")) = 'test'
  ) THEN
    RAISE EXCEPTION 'cannot retire test tab while matching topics exist';
  END IF;
END
$$;
--> statement-breakpoint
INSERT INTO "tabs" ("key", "label", "visible", "sort_order", "scope")
VALUES
  ('share', '分享', true, 10, 'public'),
  ('ask', '问答', true, 20, 'public'),
  ('tech', '技术', true, 30, 'public'),
  ('ai', 'AI', true, 40, 'public'),
  ('ideas', '创意', true, 50, 'public'),
  ('career', '职场', true, 60, 'public'),
  ('life', '生活', true, 70, 'public'),
  ('event', '活动', true, 80, 'public'),
  ('job', '招聘', true, 90, 'public'),
  ('dev', '开发', true, 100, 'admin'),
  ('good', '精华', true, 110, 'public')
ON CONFLICT ("key") DO UPDATE SET
  "label" = EXCLUDED."label",
  "sort_order" = EXCLUDED."sort_order",
  "scope" = EXCLUDED."scope",
  "update_at" = now();
--> statement-breakpoint
DELETE FROM "tabs" WHERE "key" = 'test';
