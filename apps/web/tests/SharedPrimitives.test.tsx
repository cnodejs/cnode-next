import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Command, CommandEmpty, CommandInput, CommandList } from "~/components/ui/command";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "~/components/ui/empty";
import { NativeSelect } from "~/components/ui/native-select";
import { Pagination } from "~/components/Pagination";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";

function renderWithRouter(element: React.ReactNode) {
  const router = createMemoryRouter([{ path: "/", element }], { initialEntries: ["/"] });
  return render(<RouterProvider router={router} />);
}

describe("shared primitives", () => {
  it("submits native select, textarea and radio values", async () => {
    const operator = userEvent.setup();
    const submit = vi.fn((event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      return {
        tab: formData.get("tab"),
        note: formData.get("note"),
        visibility: formData.get("visibility"),
      };
    });

    render(
      <form onSubmit={submit}>
        <label htmlFor="tab">分类</label>
        <NativeSelect id="tab" name="tab" defaultValue="share">
          <option value="share">分享</option>
          <option value="ask">问答</option>
        </NativeSelect>
        <label htmlFor="note">说明</label>
        <Textarea id="note" name="note" defaultValue="hello" />
        <RadioGroup name="visibility" defaultValue="public" aria-label="可见性">
          <label className="flex items-center gap-2">
            <RadioGroupItem value="public" />公开
          </label>
          <label className="flex items-center gap-2">
            <RadioGroupItem value="private" />私有
          </label>
        </RadioGroup>
        <button type="submit">提交</button>
      </form>,
    );

    await operator.click(screen.getByRole("button", { name: "提交" }));

    expect(submit.mock.results[0]?.value).toEqual({ tab: "share", note: "hello", visibility: "public" });
  });

  it("submits the selected Base Select value through a native form", async () => {
    const operator = userEvent.setup();
    const submit = vi.fn((event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      return new FormData(event.currentTarget).get("tab");
    });

    render(
      <form onSubmit={submit}>
        <label htmlFor="topic-tab">分类</label>
        <Select name="tab" defaultValue="share">
          <SelectTrigger id="topic-tab">
            <SelectValue>{(value) => ({ share: "分享", ask: "问答", job: "招聘" })[value as string] ?? value}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="share">分享</SelectItem>
            <SelectItem value="ask">问答</SelectItem>
            <SelectItem value="job" disabled>招聘（需要授权）</SelectItem>
          </SelectContent>
        </Select>
        <button type="submit">提交</button>
      </form>,
    );

    await operator.click(screen.getByRole("button", { name: "提交" }));

    expect(submit.mock.results[0]?.value).toBe("share");
    expect(screen.getByRole("combobox", { name: "分类" })).toHaveTextContent("分享");
  });

  it("sets alert live-region semantics by variant", () => {
    render(
      <>
        <Alert variant="status" live="polite">
          <AlertTitle>已保存</AlertTitle>
          <AlertDescription>设置已经保存。</AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <AlertTitle>保存失败</AlertTitle>
        </Alert>
      </>,
    );

    expect(screen.getByRole("status")).toHaveAccessibleName("");
    expect(screen.getByRole("alert")).toHaveTextContent("保存失败");
  });

  it("keeps domain pagination URL generation and current-page semantics", () => {
    renderWithRouter(
      <Pagination page={3} total={100} limit={10} basePath="/topics" searchParams={{ tab: "share" }} />,
    );

    expect(screen.getByRole("navigation", { name: "分页导航" })).toBeInTheDocument();
    expect(screen.getByRole("link", { current: "page" })).toHaveTextContent("3");
    expect(screen.getByRole("link", { name: "← 上一页" })).toHaveAttribute("href", "/topics?tab=share&page=2");
  });

  it("renders branded empty and command empty states", () => {
    render(
      <>
        <Empty>
          <EmptyHeader>
            <EmptyTitle>暂无结果</EmptyTitle>
            <EmptyDescription>调整筛选条件后重试。</EmptyDescription>
          </EmptyHeader>
        </Empty>
        <Command>
          <CommandInput value="missing" onValueChange={() => {}} />
          <CommandList>
            <CommandEmpty>没有匹配项</CommandEmpty>
          </CommandList>
        </Command>
      </>,
    );

    expect(screen.getByText("暂无结果")).toBeInTheDocument();
    expect(screen.getByText("没有匹配项")).toBeInTheDocument();
  });

  it("restores focus and constrains long alert dialogs", async () => {
    const operator = userEvent.setup();
    render(
      <AlertDialog>
        <AlertDialogTrigger>删除话题</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>确认删除话题</AlertDialogTitle>
          <AlertDialogDescription>{"不可恢复。".repeat(200)}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    );

    const trigger = screen.getByRole("button", { name: "删除话题" });
    await operator.click(trigger);
    const dialog = screen.getByRole("alertdialog", { name: "确认删除话题" });
    expect(dialog).toHaveClass("max-h-[calc(100dvh-2rem)]", "overscroll-contain");

    await operator.click(screen.getByRole("button", { name: "取消" }));
    expect(trigger).toHaveFocus();
  });
});
