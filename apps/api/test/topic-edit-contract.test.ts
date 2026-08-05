import { describe, expect, test } from "vite-plus/test";
import { mdrenderQuerySchema, updateTopicBodySchema } from "@cnode/shared";
import { renderMarkdown } from "../src/lib/markdown";

describe("topic edit contract", () => {
  test("mdrender=false preserves raw Markdown instead of rendered HTML", () => {
    const content = "## Title\n\n[link](/topic/1)";
    const { mdrender } = mdrenderQuerySchema.parse({ mdrender: "false" });

    expect(renderMarkdown(content, mdrender)).toBe(content);
    expect(renderMarkdown(content, true)).toContain("<h2>");
  });

  test("topic update accepts normal topics and job topics with job metadata", () => {
    expect(
      updateTopicBodySchema.parse({
        topic_id: "42",
        title: "A useful topic title",
        tab: "share",
        content: "raw **Markdown**",
      }),
    ).toMatchObject({ topic_id: "42", tab: "share", content: "raw **Markdown**" });

    expect(
      updateTopicBodySchema.parse({
        topic_id: "43",
        title: "A useful job topic",
        tab: "job",
        content: "job **Markdown**",
        job_meta: {
          company: "CNode",
          position: "Node.js Engineer",
          location: "Remote",
          remote: "remote",
          contact: "jobs@example.com",
        },
      }),
    ).toMatchObject({ topic_id: "43", tab: "job", job_meta: { company: "CNode" } });
  });
});
