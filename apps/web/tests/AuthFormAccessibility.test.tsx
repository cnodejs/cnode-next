import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import ResetPass from "~/routes/reset_pass";
import SearchPass from "~/routes/search_pass";
import Signin from "~/routes/signin";
import Signup from "~/routes/signup";

vi.mock("~/components/Layout", () => ({
  Layout: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("~/components/TurnstileWidget", () => ({
  TurnstileWidget: () => <div aria-label="人机验证" />,
  getTurnstileToken: () => "",
}));

function renderRoute(element: React.ReactNode, entry = "/") {
  return render(<MemoryRouter initialEntries={[entry]}>{element}</MemoryRouter>);
}

describe("认证表单字段语义", () => {
  it("identifies sign-in fields and focuses the first invalid field", async () => {
    const user = userEvent.setup();
    renderRoute(<Signin />, "/signin");

    const identity = screen.getByLabelText("用户名 / 邮箱");
    const password = screen.getByLabelText("密码");
    expect(identity).toHaveAttribute("name", "name");
    expect(identity).toHaveAttribute("autocomplete", "username");
    expect(identity).toHaveAttribute("spellcheck", "false");
    expect(password).toHaveAttribute("type", "password");
    expect(password).toHaveAttribute("autocomplete", "current-password");

    await user.click(screen.getByRole("button", { name: "登录" }));
    await waitFor(() => expect(identity).toHaveFocus());
    expect(identity).toHaveAttribute("aria-invalid", "true");
  });

  it("uses registration and recovery autocomplete purposes", () => {
    const { unmount } = renderRoute(
      <Signup {...({ loaderData: { allowSignup: true } } as any)} />,
      "/signup",
    );
    expect(screen.getByLabelText("用户名")).toHaveAttribute("autocomplete", "username");
    expect(screen.getByLabelText("密码")).toHaveAttribute("autocomplete", "new-password");
    expect(screen.getByLabelText("确认密码")).toHaveAttribute("autocomplete", "new-password");
    expect(screen.getByLabelText("邮箱")).toHaveAttribute("autocomplete", "email");
    unmount();

    renderRoute(<SearchPass />, "/search_pass");
    const email = screen.getByLabelText("注册邮箱");
    expect(email).toHaveAttribute("name", "email");
    expect(email).toHaveAttribute("type", "email");
    expect(email).toHaveAttribute("autocomplete", "email");
  });

  it("labels reset credentials as a new password", () => {
    renderRoute(<ResetPass />, "/reset_pass?key=test-key");
    const password = screen.getByLabelText("新密码");
    expect(password).toHaveAttribute("name", "new-password");
    expect(password).toHaveAttribute("type", "password");
    expect(password).toHaveAttribute("autocomplete", "new-password");
    expect(password).toHaveAttribute("aria-describedby", "new-password-help new-password-error");
  });
});
