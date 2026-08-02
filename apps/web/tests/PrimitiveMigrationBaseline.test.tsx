import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { useRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

describe("primitive migration baseline", () => {
  it("composes a Button with one semantic link", () => {
    render(
      <Button render={<a href="/about" />}>
        关于
      </Button>,
    );

    const link = screen.getByRole("link", { name: "关于" });
    expect(link).toHaveAttribute("href", "/about");
    expect(link.closest("button")).toBeNull();
    expect(screen.queryByRole("button", { name: "关于" })).not.toBeInTheDocument();
  });

  it("activates a menu action once with the keyboard", async () => {
    const operator = userEvent.setup();
    const action = vi.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>管理</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={action}>置顶话题</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    screen.getByRole("button", { name: "管理" }).focus();
    await operator.keyboard("{Enter}");
    await operator.keyboard("{Enter}");

    expect(action).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menuitem", { name: "置顶话题" })).not.toBeInTheDocument();
  });

  it("returns focus to the trigger after a dialog closes", async () => {
    const operator = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger>打开确认</DialogTrigger>
        <DialogContent>
          <DialogTitle>确认操作</DialogTitle>
          <DialogClose>取消</DialogClose>
        </DialogContent>
      </Dialog>,
    );

    const trigger = screen.getByRole("button", { name: "打开确认" });
    await operator.click(trigger);
    expect(screen.getByRole("dialog", { name: "确认操作" })).toBeInTheDocument();
    await operator.click(screen.getByRole("button", { name: "取消" }));

    expect(trigger).toHaveFocus();
  });

  it("cancels a pending controlled dialog close and restores explicit final focus", async () => {
    const operator = userEvent.setup();

    function ControlledDialog() {
      const [open, setOpen] = useState(false);
      const [pending, setPending] = useState(true);
      const triggerRef = useRef<HTMLButtonElement>(null);

      return (
        <>
          <button ref={triggerRef} type="button" onClick={() => setOpen(true)}>
            打开受控确认
          </button>
          <Dialog
            open={open}
            onOpenChange={(nextOpen, eventDetails) => {
              if (!nextOpen && pending) {
                eventDetails.cancel();
                return;
              }
              setOpen(nextOpen);
            }}
          >
            <DialogContent finalFocus={triggerRef}>
              <DialogTitle>受控确认</DialogTitle>
              <button type="button" onClick={() => setPending(false)}>
                完成请求
              </button>
              <DialogClose>关闭</DialogClose>
            </DialogContent>
          </Dialog>
        </>
      );
    }

    render(<ControlledDialog />);
    const trigger = screen.getByRole("button", { name: "打开受控确认" });
    await operator.click(trigger);
    await operator.keyboard("{Escape}");
    expect(screen.getByRole("dialog", { name: "受控确认" })).toBeInTheDocument();

    await operator.click(screen.getByRole("button", { name: "完成请求" }));
    await operator.click(screen.getByRole("button", { name: "关闭" }));
    expect(trigger).toHaveFocus();
  });

  it("submits the checked Checkbox value through a native form", async () => {
    const operator = userEvent.setup();
    const submit = vi.fn((event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      return new FormData(event.currentTarget).get("selected");
    });
    render(
      <form onSubmit={submit}>
        <Checkbox name="selected" value="topic-1" aria-label="选择话题" />
        <button type="submit">提交</button>
      </form>,
    );

    await operator.click(screen.getByRole("checkbox", { name: "选择话题" }));
    await operator.click(screen.getByRole("button", { name: "提交" }));

    expect(screen.getByRole("checkbox", { name: "选择话题" })).toBeChecked();
    expect(submit.mock.results[0]?.value).toBe("topic-1");
  });

  it("automatically activates Tabs while navigating with arrow keys", async () => {
    const operator = userEvent.setup();
    render(
      <Tabs defaultValue="topics">
        <TabsList aria-label="用户内容">
          <TabsTrigger value="topics">话题</TabsTrigger>
          <TabsTrigger value="replies">回复</TabsTrigger>
        </TabsList>
        <TabsContent value="topics">话题内容</TabsContent>
        <TabsContent value="replies">回复内容</TabsContent>
      </Tabs>,
    );

    const topics = screen.getByRole("tab", { name: "话题" });
    topics.focus();
    await operator.keyboard("{ArrowRight}");

    expect(screen.getByRole("tab", { name: "回复" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("回复内容");
  });

  it("renders deterministic primitive structure during SSR", () => {
    const html = renderToString(
      <div>
        <Button render={<a href="/about" />}>
          关于
        </Button>
        <Checkbox name="selected" aria-label="选择话题" />
      </div>,
    );

    expect(html).toContain('href="/about"');
    expect(html).toContain('role="checkbox"');
    expect(html).not.toContain("undefined");
  });
});
