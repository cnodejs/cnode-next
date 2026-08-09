import { describe, expect, it } from "vite-plus/test";
import {
  createTopicBodySchema,
  topicListQuerySchema,
  topicTabDefinitions,
  topicTabKeys,
  updateTopicBodySchema,
  writableTopicTabKeys,
} from "@cnode/shared";

const expectedKeys = [
  "share",
  "ask",
  "tech",
  "ai",
  "ideas",
  "career",
  "life",
  "event",
  "job",
  "dev",
  "good",
];

describe("topic tab contract", () => {
  it("keeps the registry ordered and excludes the retired test tab", () => {
    expect(topicTabKeys).toEqual(expectedKeys);
    expect(topicTabDefinitions.map(({ key }) => key)).toEqual(expectedKeys);
    expect(topicTabKeys).not.toContain("test");
  });

  it.each(writableTopicTabKeys)("accepts writable tab %s", (tab) => {
    const job_meta =
      tab === "job"
        ? {
            company: "CNode",
            position: "Node.js Engineer",
            location: "Remote",
            remote: "remote" as const,
            contact: "jobs@example.com",
          }
        : undefined;
    expect(
      createTopicBodySchema.safeParse({
        title: "Valid topic title",
        tab,
        content: "content",
        job_meta,
      }).success,
    ).toBe(true);
    expect(
      updateTopicBodySchema.safeParse({
        topic_id: "1",
        title: "Valid topic title",
        tab,
        content: "content",
        job_meta,
      }).success,
    ).toBe(true);
  });

  it.each(["all", "good", "dev", "test"])("rejects non-writable tab %s", (tab) => {
    expect(
      createTopicBodySchema.safeParse({ title: "Valid topic title", tab, content: "content" })
        .success,
    ).toBe(false);
  });

  it("accepts registered list tabs and rejects retired or unknown keys", () => {
    for (const tab of ["all", ...expectedKeys]) {
      expect(topicListQuerySchema.safeParse({ tab }).success).toBe(true);
    }
    expect(topicListQuerySchema.safeParse({ tab: "test" }).success).toBe(false);
    expect(topicListQuerySchema.safeParse({ tab: "unknown" }).success).toBe(false);
  });
});
