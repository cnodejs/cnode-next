CREATE INDEX IF NOT EXISTS "replies_active_topic_order_idx"
ON "replies" USING btree ("topic_id", "create_at", "id")
WHERE "deleted" = false;
