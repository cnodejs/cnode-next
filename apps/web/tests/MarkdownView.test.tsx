import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { MarkdownView } from "~/components/MarkdownView";

const complexMarkdown = `
## 中英文 Mixed heading

- unordered
  1. nested ordered
  2. second
- loose item

  > quote in list

  \`\`\`ts
  const message = "long content";
  \`\`\`

1. ordered
2. second

- [x] completed
- [ ] pending

| Name | A very long value |
| --- | --- |
| CNode | https://example.com/a/very/long/path/that/must/not-expand/the-page |

![CNode image](https://example.com/image.png)
`;

describe("MarkdownView", () => {
  it("uses one Typeset preset for complex Markdown", () => {
    const { container } = render(<MarkdownView content={complexMarkdown} />);
    const surface = container.firstElementChild;

    expect(surface).toHaveClass("typeset", "typeset-docs");
    expect(surface).not.toHaveClass("markdown-body");
    expect(screen.getAllByRole("list").length).toBeGreaterThanOrEqual(4);
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
    expect(screen.getByRole("img", { name: "CNode image" })).toHaveAttribute("loading", "lazy");
    expect(container.querySelector(".typeset-scroll > table")).toBeInTheDocument();
  });

  it("keeps nested blocks inside their list item", () => {
    const { container } = render(<MarkdownView content={complexMarkdown} />);
    const looseItem = screen.getByText("loose item").closest("li");

    expect(looseItem).not.toBeNull();
    expect(within(looseItem!).getByText("quote in list")).toBeInTheDocument();
    expect(looseItem!.querySelector("pre code")).toHaveTextContent('const message = "long content";');
    expect(container.querySelector("ol")).toBeInTheDocument();
  });

  it("keeps the sanitized renderer pipeline", () => {
    const { container } = render(
      <MarkdownView content={'<script>alert("x")</script>\n\n[unsafe](javascript:alert(1))'} />,
    );

    expect(container.querySelector("script")).not.toBeInTheDocument();
    expect(screen.getByText("unsafe")).not.toHaveAttribute("href", expect.stringContaining("javascript:"));
  });

  it("keeps duplicate heading ids deterministic across SSR renders", () => {
    const content = "## 重复标题\r\n\r\n正文\r\n\r\n## 重复标题";
    const first = renderToString(<MarkdownView content={content} />);
    const second = renderToString(<MarkdownView content={content} />);

    expect(second).toBe(first);
    expect(first).toContain('id="重复标题"');
    expect(first).toContain('id="重复标题-2"');
  });

  it("assigns semantic ids to persisted HTML headings", () => {
    const html = renderToString(
      <MarkdownView content={'<h2 id="legacy">创建数据库</h2>\r\n<h2>编写接口</h2>\r\n<h2>创建数据库</h2>'} />,
    );

    expect(html).toContain('id="创建数据库"');
    expect(html).toContain('id="编写接口"');
    expect(html).toContain('id="创建数据库-2"');
    expect(html).not.toContain('id="legacy"');
  });
});
