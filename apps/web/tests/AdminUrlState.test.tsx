import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it, vi } from "vite-plus/test";
import AdminBans from "~/routes/admin/bans";
import AdminSettings from "~/routes/admin/settings";

vi.mock("~/components/AdminLayout", () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => children,
}));

const config = {
  allow_signup: true,
  new_user_min_hours: 24,
  new_user_min_replies: 3,
  rate_topic: 1000,
  rate_reply: 1000,
};

describe("后台 URL 状态", () => {
  it("writes the selected settings tab to the URL", async () => {
    const router = createMemoryRouter(
      [
        {
          path: "/admin/settings",
          element: <AdminSettings loaderData={{ config, tab: "registration" }} />,
        },
      ],
      { initialEntries: ["/admin/settings?source=audit"] },
    );
    render(<RouterProvider router={router} />);

    await userEvent.click(screen.getByRole("tab", { name: "限流配置" }));
    await waitFor(() => expect(router.state.location.search).toBe("?source=audit&tab=rate"));
  });

  it("writes bans tabs to the URL while resetting incompatible paging state", async () => {
    const router = createMemoryRouter(
      [
        {
          path: "/admin/bans",
          element: (
            <AdminBans
              loaderData={{
                bannedUsers: [],
                bannedUsersTotal: 0,
                bannedIps: [],
                bannedIpsTotal: 0,
                page: 3,
                limit: 50,
                tab: "users",
                userStatus: "muted",
              }}
            />
          ),
        },
      ],
      { initialEntries: ["/admin/bans?tab=users&status=muted&page=3&limit=50"] },
    );
    render(<RouterProvider router={router} />);

    await userEvent.click(screen.getByRole("tab", { name: "IP 封禁" }));
    await waitFor(() => expect(router.state.location.search).toBe("?tab=ips&limit=50"));
  });
});
