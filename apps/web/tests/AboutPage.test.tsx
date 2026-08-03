import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import About from "~/routes/about";

vi.mock("~/components/Layout", () => ({
  Layout: ({ children }: { children: React.ReactNode }) => children,
}));

function renderAbout() {
  return render(
    <MemoryRouter initialEntries={["/about"]}>
      <About />
    </MemoryRouter>,
  );
}

describe("About 合并内容页", () => {
  it("contains community, guide, cooperation, client and FAQ sections with stable anchors", () => {
    const { container } = renderAbout();

    expect(screen.getByRole("heading", { name: "关于 CNode" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "参与指南" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "讨论与内容规范" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "社区合作" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "社区客户端" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "常见问题" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Node.js 专业中文社区" })).toHaveClass("text-2xl", "sm:text-3xl");
    expect(container.querySelector("#guide")).toBeInTheDocument();
    expect(container.querySelector("#discussion")).toBeInTheDocument();
    expect(container.querySelector("#cooperation")).toBeInTheDocument();
    expect(container.querySelector("#client")).toBeInTheDocument();
    expect(container.querySelector("#faq")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "发布话题" })).toHaveAttribute("href", "/topic/create");
    expect(screen.getAllByRole("link", { name: "参与指南" })[0]).toHaveAttribute("href", "#guide");
    expect(container.querySelector('[href="/getstart"]')).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "查看客户端项目" })).toHaveAttribute(
      "href",
      "https://github.com/soliury/noder-react-native/blob/master/README.md",
    );
    const faq = container.querySelector("#faq")!;
    expect(faq.querySelector(".divide-y")).not.toBeInTheDocument();
    expect(faq.querySelectorAll("dl")).toHaveLength(2);
  });

  it("keeps all section navigation available at a mobile viewport", () => {
    window.innerWidth = 375;
    window.dispatchEvent(new Event("resize"));
    renderAbout();

    const navigation = screen.getByRole("navigation", { name: "关于页面导航" });
    expect(within(navigation).getByRole("link", { name: "社区介绍" })).toHaveAttribute("href", "#community");
    expect(within(navigation).getByRole("link", { name: "讨论规范" })).toHaveAttribute("href", "#discussion");
    expect(within(navigation).getByRole("link", { name: "社区合作" })).toHaveAttribute("href", "#cooperation");
    expect(within(navigation).getByRole("link", { name: "社区客户端" })).toHaveAttribute("href", "#client");
    expect(within(navigation).getByRole("link", { name: "常见问题" })).toHaveAttribute("href", "#faq");
  });
});
