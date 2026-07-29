import { expect, test } from "vitest";
import { parseAdminTopicFilters } from "../src/lib/admin-governance";

test("admin topic filters parse supported values", () => {
  const filters = parseAdminTopicFilters({
    q: "  hello ",
    tab: "ask",
    visibility: "deleted",
    flag: "good",
    date_field: "last_reply_at",
    date_from: "2026-07-01",
    date_to: "2026-07-30",
    sort: "reply_count_desc",
  });

  expect(filters.q).toBe("hello");
  expect(filters.tab).toBe("ask");
  expect(filters.visibility).toBe("deleted");
  expect(filters.flag).toBe("good");
  expect(filters.dateField).toBe("last_reply_at");
  expect(filters.sort).toBe("reply_count_desc");
  expect(filters.dateFrom?.toISOString().startsWith("2026-07-01")).toBe(true);
  expect(filters.dateTo?.getHours()).toBe(23);
  expect(filters.dateTo?.getMinutes()).toBe(59);
});

test("admin topic filters fall back for unsupported enum values", () => {
  const filters = parseAdminTopicFilters({
    tab: "all",
    visibility: "published",
    flag: "sticky",
    date_field: "deleted_at",
    date_from: "not-a-date",
    date_to: "not-a-date",
    sort: "title_asc",
  });

  expect(filters.tab).toBe("");
  expect(filters.visibility).toBe("all");
  expect(filters.flag).toBe("all");
  expect(filters.dateField).toBe("create_at");
  expect(filters.dateFrom).toBeNull();
  expect(filters.dateTo).toBeNull();
  expect(filters.sort).toBe("create_at_desc");
});
