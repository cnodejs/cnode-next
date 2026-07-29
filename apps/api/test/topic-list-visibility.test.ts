import { expect, test } from "vitest";
import { buildTopicListQuery, shouldIncludeInternalTabsInTopicList } from "../src/routes/topic";

test("public all topic list excludes internal tabs for admins too", () => {
  expect(shouldIncludeInternalTabsInTopicList(undefined, true)).toBe(false);
  expect(shouldIncludeInternalTabsInTopicList("all", true)).toBe(false);
  expect(shouldIncludeInternalTabsInTopicList("share", true)).toBe(false);
});

test("internal tabs are only available when explicitly selected by admins", () => {
  expect(shouldIncludeInternalTabsInTopicList("dev", true)).toBe(true);
  expect(shouldIncludeInternalTabsInTopicList("test", true)).toBe(true);
  expect(shouldIncludeInternalTabsInTopicList("dev", false)).toBe(false);
});

test("topic list query keeps all and normal tab filters outside internal tabs", () => {
  expect(buildTopicListQuery(undefined, false)).toMatchObject({ excludeTabs: ["job"], publicVisible: true, includeInternalTabs: false });
  expect(buildTopicListQuery("all", true)).toMatchObject({ excludeTabs: ["job"], publicVisible: true, includeInternalTabs: false });
  expect(buildTopicListQuery("share", true)).toMatchObject({ tab: "share", publicVisible: true, includeInternalTabs: false });
  expect(buildTopicListQuery("ask", false)).toMatchObject({ tab: "ask", publicVisible: true, includeInternalTabs: false });
  expect(buildTopicListQuery("good", true)).toMatchObject({ good: 1, publicVisible: true, includeInternalTabs: false });
});

test("topic list query only allows explicit internal tabs for admins", () => {
  expect(buildTopicListQuery("dev", false)).toBeNull();
  expect(buildTopicListQuery("test", false)).toBeNull();
  expect(buildTopicListQuery("dev", true)).toMatchObject({ tab: "dev", publicVisible: true, includeInternalTabs: true });
  expect(buildTopicListQuery("test", true)).toMatchObject({ tab: "test", publicVisible: true, includeInternalTabs: true });
});
