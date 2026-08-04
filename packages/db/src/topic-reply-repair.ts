export interface TopicReplyRepairClient {
  query(sql: string): Promise<{ rowCount?: number | null; rows?: Array<{ mismatch_count?: number | string }> }>;
}

const expectedAggregatesSql = `
  select
    t.id as topic_id,
    count(r.id)::int as expected_reply_count,
    latest.id as expected_last_reply_id,
    latest.create_at as expected_last_reply_at
  from topics t
  left join replies r on r.topic_id = t.id and r.deleted = false
  left join lateral (
    select candidate.id, candidate.create_at
    from replies candidate
    where candidate.topic_id = t.id and candidate.deleted = false
    order by candidate.create_at desc nulls last, candidate.id desc
    limit 1
  ) latest on true
  group by t.id, latest.id, latest.create_at
`;

const mismatchPredicate = `
  t.reply_count is distinct from e.expected_reply_count
  or t.last_reply_id is distinct from e.expected_last_reply_id
  or t.last_reply_at is distinct from e.expected_last_reply_at
`;

export const topicReplyRepairDryRunSql = `
  with expected as (${expectedAggregatesSql})
  select count(*)::int as mismatch_count
  from topics t
  join expected e on e.topic_id = t.id
  where ${mismatchPredicate}
`;

export const topicReplyRepairApplySql = `
  with expected as (${expectedAggregatesSql}),
  mismatched as (
    select e.*
    from topics t
    join expected e on e.topic_id = t.id
    where ${mismatchPredicate}
  )
  update topics t
  set reply_count = m.expected_reply_count,
      last_reply_id = m.expected_last_reply_id,
      last_reply_at = m.expected_last_reply_at
  from mismatched m
  where t.id = m.topic_id
`;

export async function repairTopicReplyAggregates(client: TopicReplyRepairClient, dryRun: boolean) {
  if (dryRun) {
    const result = await client.query(topicReplyRepairDryRunSql);
    return { mode: "dry-run" as const, mismatchedTopics: Number(result.rows?.[0]?.mismatch_count || 0), repairedTopics: 0 };
  }

  const result = await client.query(topicReplyRepairApplySql);
  return { mode: "apply" as const, mismatchedTopics: result.rowCount || 0, repairedTopics: result.rowCount || 0 };
}
