import { Pool } from "pg";
import { parsePostgresConfig } from "@cnode/shared";
import { loadRootEnv } from "../../../scripts/env";

loadRootEnv({ cwd: import.meta.dirname });

const pool = new Pool(parsePostgresConfig());

try {
  const result = await pool.query<{
    duplicate_groups: string;
    affected_users: string;
  }>(`
    SELECT
      COUNT(*)::text AS duplicate_groups,
      COALESCE(SUM(user_count), 0)::text AS affected_users
    FROM (
      SELECT COUNT(*) AS user_count
      FROM users
      WHERE github_id IS NOT NULL
      GROUP BY github_id
      HAVING COUNT(*) > 1
    ) duplicates
  `);
  const duplicateGroups = Number(result.rows[0]?.duplicate_groups || 0);
  const affectedUsers = Number(result.rows[0]?.affected_users || 0);

  if (duplicateGroups > 0) {
    console.error(
      `GitHub ID uniqueness preflight failed: ${duplicateGroups} duplicate groups affect ${affectedUsers} users.`,
    );
    process.exitCode = 1;
  } else {
    console.log("GitHub ID uniqueness preflight passed: no duplicate non-null IDs.");
  }
} finally {
  await pool.end();
}
