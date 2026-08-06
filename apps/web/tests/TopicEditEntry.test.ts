import { describe, expect, it } from "vite-plus/test";
import { canEditTopic } from "~/routes/topic.$tid";

const topic = {
  id: "42",
  author: { loginname: "alice" },
};

describe("topic edit entry permission", () => {
  it("allows the topic author to see the edit entry", () => {
    expect(canEditTopic(topic, { loginname: "alice", is_admin: false })).toBe(true);
  });

  it("allows admins to see the edit entry for another user's topic", () => {
    expect(canEditTopic(topic, { loginname: "admin", is_admin: true })).toBe(true);
  });

  it("hides the edit entry from non-authors and anonymous users", () => {
    expect(canEditTopic(topic, { loginname: "bob", is_admin: false })).toBe(false);
    expect(canEditTopic(topic, null)).toBe(false);
  });
});
