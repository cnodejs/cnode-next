import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vite-plus/test";
import { PublishingRulesCard, TopicTabInfoCard } from "~/components/TopicTabInfo";
import { buildHomeTabs } from "~/routes/_index";

const configuredTabs = [
  { key: "good", label: "精华", visible: true, sort_order: 1, scope: "public" as const },
  { key: "job", label: "招聘", visible: true, sort_order: 90, scope: "public" as const },
  { key: "share", label: "分享", visible: true, sort_order: 10, scope: "public" as const },
  { key: "dev", label: "开发", visible: true, sort_order: 0, scope: "admin" as const },
  { key: "test", label: "测试", visible: true, sort_order: 200, scope: "admin" as const },
  { key: "life", label: "生活", visible: true, sort_order: 70, scope: "public" as const },
];

describe("community tabs", () => {
  it("pins all and good while hiding unsupported and admin tabs from the public", () => {
    expect(buildHomeTabs(configuredTabs, false).map(({ key }) => key)).toEqual([
      "all",
      "share",
      "life",
      "job",
      "good",
    ]);
  });

  it("places dev immediately before good for admins", () => {
    expect(buildHomeTabs(configuredTabs, true).map(({ key }) => key)).toEqual([
      "all",
      "share",
      "life",
      "job",
      "dev",
      "good",
    ]);
  });

  it("renders hard publishing rules separately from tab guidance", () => {
    const { container } = render(
      <MemoryRouter>
        <PublishingRulesCard />
        <TopicTabInfoCard tab="event" />
      </MemoryRouter>,
    );
    const titles = Array.from(container.querySelectorAll('[data-slot="card-title"]')).map(
      (node) => node.textContent,
    );
    expect(titles).toEqual(["发布规范", "活动"]);
    expect(screen.getByRole("link", { name: "查看完整社区规则" })).toHaveAttribute(
      "href",
      "/about#discussion",
    );
    expect(screen.getByText("保持合法与友善")).toBeInTheDocument();
    expect(screen.getByText("保护敏感信息")).toBeInTheDocument();
    expect(screen.getByText("标注来源与关系")).toBeInTheDocument();
    expect(screen.getByText("板块范围")).toBeInTheDocument();
    expect(screen.getByText("内容边界")).toBeInTheDocument();
    expect(screen.getByText(/正文必须说明时间/)).toBeInTheDocument();
  });
});
