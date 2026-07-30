import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MarkdownEditor } from "~/components/MarkdownEditor";

vi.mock("~/lib/upload-client", () => ({
  uploadEditorImage: vi.fn(),
}));

describe("MarkdownEditor", () => {
  it("supports edit, preview and split modes with shared MarkdownView rendering", async () => {
    render(<MarkdownEditor initialValue={"## 标题\n\n这是一段 **Markdown**。"} />);

    expect(screen.getByRole("textbox", { name: "支持 Markdown 格式" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "预览" }));
    expect(screen.queryByRole("textbox", { name: "支持 Markdown 格式" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("标题");
    expect(screen.getByText("Markdown").tagName).toBe("STRONG");

    await userEvent.click(screen.getByRole("button", { name: "双栏" }));
    expect(screen.getByRole("textbox", { name: "支持 Markdown 格式" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("标题");

    await userEvent.click(screen.getByRole("button", { name: "编辑" }));
    expect(screen.getByRole("textbox", { name: "支持 Markdown 格式" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
  });

  it("inserts Markdown around the current selection", async () => {
    const onChange = vi.fn();
    render(<MarkdownEditor value="hello world" onChange={onChange} />);
    const textarea = screen.getByRole("textbox", { name: "支持 Markdown 格式" }) as HTMLTextAreaElement;

    textarea.focus();
    textarea.setSelectionRange(6, 11);
    await userEvent.click(screen.getByRole("button", { name: "加粗" }));

    expect(onChange).toHaveBeenLastCalledWith("hello **world**");
  });

  it("uploads selected images and inserts image Markdown", async () => {
    const { uploadEditorImage } = await import("~/lib/upload-client");
    vi.mocked(uploadEditorImage).mockResolvedValue({
      filename: "avatar.png",
      url: "https://static.cnodejs.org/cnode-next/uploads/avatar.png",
    });
    const onChange = vi.fn();
    render(<MarkdownEditor value="正文" onChange={onChange} />);
    const file = new File(["png"], "avatar.png", { type: "image/png" });
    expect(screen.getByLabelText("上传图片文件")).toHaveAttribute("accept", expect.stringContaining("image/svg+xml"));

    await userEvent.upload(screen.getByLabelText("上传图片文件"), file);

    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith(
        "![avatar](https://static.cnodejs.org/cnode-next/uploads/avatar.png)\n正文",
      );
    });
  });
});
