import { describe, expect, it } from "vitest";
import { previousPageAfterRemoval } from "~/lib/post-mutation-navigation";

describe("治理后分页上下文", () => {
  it("preserves filters while moving an emptied page backward", () => {
    expect(previousPageAfterRemoval({
      pathname: "/admin/topics",
      search: "?q=node&visibility=deleted&page=3&sort=update_at_desc",
      page: 3,
      currentItemCount: 2,
      removedCount: 2,
    })).toBe("/admin/topics?q=node&visibility=deleted&page=2&sort=update_at_desc");
  });

  it("stays on the current URL when results remain or already on page one", () => {
    expect(previousPageAfterRemoval({ pathname: "/admin/users", search: "?q=a&page=2", page: 2, currentItemCount: 4, removedCount: 1 })).toBeNull();
    expect(previousPageAfterRemoval({ pathname: "/admin/users", search: "?q=a&page=1", page: 1, currentItemCount: 1, removedCount: 1 })).toBeNull();
  });
});
