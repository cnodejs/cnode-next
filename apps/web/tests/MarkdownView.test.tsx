import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("renders a lazy image without leaking the Markdown AST node", () => {
    render(<MarkdownView content="![diagram](https://example.com/diagram.png)" />);

    const image = screen.getByRole("img", { name: "diagram" });
    expect(image).toHaveAttribute("src", "https://example.com/diagram.png");
    expect(image).toHaveAttribute("loading", "lazy");
    expect(image).not.toHaveAttribute("node");
  });

  it("shows a compact fallback with a safe original link after failure", () => {
    render(<MarkdownView content="![architecture](https://example.com/missing.png)" />);
    fireEvent.error(screen.getByRole("img", { name: "architecture" }));

    expect(screen.getByRole("group", { name: "architecture加载失败" })).toHaveTextContent("图片暂时无法加载：architecture");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "打开原图" })).toHaveAttribute("href", "https://example.com/missing.png");
    expect(screen.getByRole("link", { name: "打开原图" })).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: "打开原图" })).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("retries only after a manual action and can recover", async () => {
    const user = userEvent.setup();
    render(<MarkdownView content="![diagram](https://example.com/missing.png)" />);
    const firstImage = screen.getByRole("img", { name: "diagram" });
    fireEvent.error(firstImage);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "重新加载" }));
    const retriedImage = screen.getByRole("img", { name: "diagram" });
    expect(retriedImage).not.toBe(firstImage);
    Object.defineProperties(retriedImage, {
      naturalWidth: { value: 100 },
      naturalHeight: { value: 100 },
    });
    fireEvent.load(retriedImage);
    expect(screen.queryByText(/图片暂时无法加载/)).not.toBeInTheDocument();
  });

  it("resets failure state when the image source changes", () => {
    const { rerender } = render(
      <MarkdownView content="![diagram](https://example.com/old.png)" />,
    );
    fireEvent.error(screen.getByRole("img", { name: "diagram" }));

    rerender(<MarkdownView content="![diagram](https://example.com/new.png)" />);

    expect(screen.queryByText(/图片暂时无法加载/)).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "diagram" })).toHaveAttribute(
      "src",
      "https://example.com/new.png",
    );
  });

  it("uses the fallback when an image loads without valid dimensions", () => {
    render(<MarkdownView content="![empty](https://example.com/empty.png)" />);
    fireEvent.load(screen.getByRole("img", { name: "empty" }));

    expect(screen.getByRole("group", { name: "empty加载失败" })).toBeInTheDocument();
  });

  it("uses a useful fallback for missing alt and keeps unsafe image URLs sanitized", () => {
    const { container } = render(<MarkdownView content={'![](https://example.com/image.png)\n\n<img src="javascript:alert(1)" alt="unsafe">'} />);
    const image = screen.getByRole("img", { name: "文章图片" });
    fireEvent.error(image);

    expect(screen.getByText("图片暂时无法加载：文章图片")).toBeInTheDocument();
    expect(container.querySelector('img[src^="javascript:"]')).not.toBeInTheDocument();
    expect(container.querySelector('a[href^="javascript:"]')).not.toBeInTheDocument();
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
