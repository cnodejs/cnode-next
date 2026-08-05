const topicActions = new Set(["top", "good", "mute", "delete"]);
const topicVisibilityValues = new Set(["all", "normal", "muted", "deleted"]);
const topicFlagValues = new Set(["all", "top", "good", "locked", "archived"]);
const topicDateFieldValues = new Set(["create_at", "update_at", "last_reply_at"]);
const topicSortValues = new Set([
  "create_at_desc",
  "update_at_desc",
  "last_reply_at_desc",
  "reply_count_desc",
  "visit_count_desc",
  "collect_count_desc",
]);

export type AdminTopicFilters = {
  q: string;
  tab: string;
  visibility: "all" | "normal" | "muted" | "deleted";
  flag: "all" | "top" | "good" | "locked" | "archived";
  dateField: "create_at" | "update_at" | "last_reply_at";
  dateFrom: Date | null;
  dateTo: Date | null;
  sort:
    | "create_at_desc"
    | "update_at_desc"
    | "last_reply_at_desc"
    | "reply_count_desc"
    | "visit_count_desc"
    | "collect_count_desc";
};

function parseDateBound(value: string | null | undefined, endOfDay = false) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    date.setHours(23, 59, 59, 999);
  }
  return date;
}

function enumValue<T extends string>(
  value: string | null | undefined,
  allowed: Set<string>,
  fallback: T,
): T {
  return value && allowed.has(value) ? (value as T) : fallback;
}

export function parseAdminTopicFilters(
  query: Record<string, string | null | undefined>,
): AdminTopicFilters {
  return {
    q: query.q?.trim() || "",
    tab: query.tab && query.tab !== "all" ? query.tab.trim() : "",
    visibility: enumValue(query.visibility, topicVisibilityValues, "all"),
    flag: enumValue(query.flag, topicFlagValues, "all"),
    dateField: enumValue(query.date_field, topicDateFieldValues, "create_at"),
    dateFrom: parseDateBound(query.date_from),
    dateTo: parseDateBound(query.date_to, true),
    sort: enumValue(query.sort, topicSortValues, "create_at_desc"),
  };
}

export function canRunTopicAction(action: string, isAdmin: boolean, isMod: boolean) {
  if (!topicActions.has(action)) return false;
  return isMod || isAdmin;
}

export function canRunPermanentTopicDelete(isAdmin: boolean) {
  return isAdmin;
}

export function canRunJobBulkModerationAction(action: string, isAdmin: boolean) {
  return isAdmin && action === "confirm";
}

export function normalizePermanentTopicDeleteIds(body: any) {
  return Array.isArray(body?.ids)
    ? body.ids
        .map(Number)
        .filter((id: number) => id > 0)
        .slice(0, 20)
    : [Number(body?.id || body?.topic_id || 0)].filter((id) => id > 0);
}
