import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, Link, RouterProvider, useNavigate } from "react-router";
import { describe, expect, it } from "vite-plus/test";
import { UnsavedChangesDialog, useUnsavedChanges } from "~/hooks/use-unsaved-changes";
import { useState } from "react";

function Draft() {
  const [value, setValue] = useState("");
  const navigate = useNavigate();
  const { blocker, allowNavigation } = useUnsavedChanges(value !== "");
  return (
    <>
      <label htmlFor="draft">草稿</label>
      <input id="draft" value={value} onChange={(event) => setValue(event.target.value)} />
      <Link to="/elsewhere">离开页面</Link>
      <button
        type="button"
        onClick={() => {
          allowNavigation();
          navigate("/saved");
        }}
      >
        保存成功
      </button>
      <UnsavedChangesDialog blocker={blocker} />
    </>
  );
}

function renderDraft() {
  const router = createMemoryRouter(
    [
      { path: "/draft", element: <Draft /> },
      { path: "/elsewhere", element: <h1>其他页面</h1> },
      { path: "/saved", element: <h1>已保存</h1> },
    ],
    { initialEntries: ["/draft"] },
  );
  return render(<RouterProvider router={router} />);
}

describe("未保存内容保护", () => {
  it("blocks internal navigation and retains the draft when cancelled", async () => {
    const user = userEvent.setup();
    renderDraft();
    const input = screen.getByLabelText("草稿");
    await user.type(input, "未保存内容");
    await user.click(screen.getByRole("link", { name: "离开页面" }));

    expect(screen.getByRole("alertdialog", { name: "放弃未保存的内容？" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "继续编辑" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(input).toHaveValue("未保存内容");
  });

  it("allows explicit discard and successful-save navigation", async () => {
    const user = userEvent.setup();
    const { unmount } = renderDraft();
    await user.type(screen.getByLabelText("草稿"), "待放弃");
    await user.click(screen.getByRole("link", { name: "离开页面" }));
    await user.click(screen.getByRole("button", { name: "放弃并离开" }));
    expect(await screen.findByRole("heading", { name: "其他页面" })).toBeInTheDocument();
    unmount();

    renderDraft();
    await user.type(screen.getByLabelText("草稿"), "已保存内容");
    await user.click(screen.getByRole("button", { name: "保存成功" }));
    expect(await screen.findByRole("heading", { name: "已保存" })).toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("registers a browser unload warning only while dirty", async () => {
    const user = userEvent.setup();
    renderDraft();
    const cleanEvent = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(cleanEvent);
    expect(cleanEvent.defaultPrevented).toBe(false);

    await user.type(screen.getByLabelText("草稿"), "草稿");
    const dirtyEvent = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(dirtyEvent);
    expect(dirtyEvent.defaultPrevented).toBe(true);
  });
});
