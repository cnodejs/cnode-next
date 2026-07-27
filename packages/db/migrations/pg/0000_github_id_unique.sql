DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM users
    WHERE github_id IS NOT NULL
    GROUP BY github_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'duplicate non-null users.github_id values must be resolved before migration';
  END IF;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_github_id_unique" ON "users" ("github_id");
