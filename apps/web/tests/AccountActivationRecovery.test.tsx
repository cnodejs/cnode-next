import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider, useLocation } from "react-router";
import { beforeEach, describe, expect, test, vi } from "vite-plus/test";
import GithubNew from "~/routes/auth.github.new";
import ResendActivation from "~/routes/resend_activation";
import Signin from "~/routes/signin";
import Signup from "~/routes/signup";

const { apiFetch } = vi.hoisted(() => ({ apiFetch: vi.fn() }));

vi.mock("~/lib/api-client", () => ({ apiFetch }));
vi.mock("~/components/Layout", () => ({
  Layout: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("~/components/TurnstileWidget", () => ({
  TurnstileWidget: () => <div aria-label="人机验证" />,
  getTurnstileToken: () => "turnstile-token",
}));

function Location() {
  return <div data-testid="location">{useLocation().pathname + useLocation().search}</div>;
}

function renderWithRoutes(
  element: React.ReactNode,
  entry: string,
  loader?: (args: { request: Request }) => null,
) {
  const router = createMemoryRouter(
    [
      {
        path: "*",
        loader,
        element: (
          <>
            {element}
            <Location />
          </>
        ),
      },
    ],
    { initialEntries: [entry] },
  );
  return { ...render(<RouterProvider router={router} />), router };
}

beforeEach(() => apiFetch.mockReset());

describe("account activation recovery", () => {
  test("submits credentials, preserves inputs on failure, and announces the error", async () => {
    apiFetch.mockResolvedValueOnce({
      success: false,
      error_code: "activation_email_failed",
      error_msg: "激活邮件发送失败，请稍后重试",
    });
    const user = userEvent.setup();
    renderWithRoutes(<ResendActivation />, "/resend_activation?name=alice");

    const name = screen.getByLabelText("用户名 / 邮箱");
    const password = screen.getByLabelText("密码");
    expect(name).toHaveValue("alice");
    await user.type(password, "password123");
    await user.click(screen.getByRole("button", { name: "重新发送激活邮件" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("激活邮件发送失败"));
    expect(name).toHaveValue("alice");
    expect(password).toHaveValue("password123");
    expect(apiFetch).toHaveBeenCalledWith(
      "/api/v1/auth/local/resend_activation",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "alice",
          pass: "password123",
          turnstileToken: "turnstile-token",
        }),
      }),
    );
  });

  test("disables duplicate submission while a request is pending", async () => {
    apiFetch.mockReturnValueOnce(new Promise(() => undefined));
    const user = userEvent.setup();
    renderWithRoutes(<ResendActivation />, "/resend_activation");
    await user.type(screen.getByLabelText("用户名 / 邮箱"), "alice");
    await user.type(screen.getByLabelText("密码"), "password123");
    await user.keyboard("{Enter}");

    const button = screen.getByRole("button", { name: "发送中..." });
    expect(button).toBeDisabled();
    expect(button.closest("form")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status")).toHaveTextContent("正在发送激活邮件");
  });

  test("announces a successful generic response as status", async () => {
    apiFetch.mockResolvedValueOnce({ success: true, message: "请求已处理，请检查邮箱" });
    const user = userEvent.setup();
    renderWithRoutes(<ResendActivation />, "/resend_activation");
    await user.type(screen.getByLabelText("用户名 / 邮箱"), "alice");
    await user.type(screen.getByLabelText("密码"), "password123");
    await user.keyboard("{Enter}");

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("请求已处理，请检查邮箱"),
    );
  });

  test("routes inactive local login to recovery with the entered account", async () => {
    apiFetch.mockResolvedValueOnce({ success: false, error_code: "account_inactive" });
    const user = userEvent.setup();
    renderWithRoutes(<Signin />, "/signin");
    await user.type(screen.getByLabelText("用户名 / 邮箱"), "alice@example.com");
    await user.type(screen.getByLabelText("密码"), "password123");
    await user.click(screen.getByRole("button", { name: "登录" }));

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/resend_activation?name=alice%40example.com",
      ),
    );
  });

  test("revalidates auth data before returning home after local login", async () => {
    apiFetch.mockResolvedValueOnce({ success: true });
    const loadedPaths: string[] = [];
    const loader = vi.fn(({ request }: { request: Request }) => {
      loadedPaths.push(new URL(request.url).pathname);
      return null;
    });
    const user = userEvent.setup();
    renderWithRoutes(<Signin />, "/signin", loader);
    await waitFor(() => expect(loader).toHaveBeenCalledTimes(1));

    await user.type(await screen.findByLabelText("用户名 / 邮箱"), "alice");
    await user.type(await screen.findByLabelText("密码"), "password123");
    await user.click(await screen.findByRole("button", { name: "登录" }));

    await waitFor(() => expect(loadedPaths).toEqual(["/signin", "/signin", "/"]));
    expect(screen.getByTestId("location")).toHaveTextContent("/");
  });

  test("routes partial signup success to recovery", async () => {
    apiFetch.mockResolvedValueOnce({
      success: false,
      error_code: "account_created_email_failed",
    });
    const user = userEvent.setup();
    renderWithRoutes(<Signup {...({ loaderData: { allowSignup: true } } as any)} />, "/signup");
    await user.type(screen.getByLabelText("用户名"), "alice");
    await user.type(screen.getByLabelText("密码"), "password123");
    await user.type(screen.getByLabelText("确认密码"), "password123");
    await user.type(screen.getByLabelText("邮箱"), "alice@example.com");
    await user.click(screen.getByRole("button", { name: "注册" }));

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent("/resend_activation?name=alice"),
    );
  });

  test("routes inactive GitHub linking to recovery", async () => {
    apiFetch.mockResolvedValueOnce({ success: false, error_code: "account_inactive" });
    const user = userEvent.setup();
    renderWithRoutes(
      <GithubNew
        {...({
          loaderData: {
            profile: { loginname: "github-user", email: "alice@example.com", email_exists: true },
          },
        } as any)}
      />,
      "/auth/github/new",
    );
    await user.type(screen.getByLabelText("用户名"), "alice");
    await user.type(screen.getByLabelText("密码"), "password123");
    await user.click(screen.getByRole("button", { name: "关联并登录" }));

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent("/resend_activation?name=alice"),
    );
  });

  test("revalidates auth data before returning home after GitHub login", async () => {
    apiFetch.mockResolvedValueOnce({ success: true });
    const loadedPaths: string[] = [];
    const loader = vi.fn(({ request }: { request: Request }) => {
      loadedPaths.push(new URL(request.url).pathname);
      return null;
    });
    const user = userEvent.setup();
    renderWithRoutes(
      <GithubNew
        {...({
          loaderData: {
            profile: { loginname: "github-user", email: "alice@example.com", email_exists: false },
          },
        } as any)}
      />,
      "/auth/github/new",
      loader,
    );
    await waitFor(() => expect(loader).toHaveBeenCalledTimes(1));

    await user.click(await screen.findByRole("button", { name: "注册并登录" }));

    await waitFor(() =>
      expect(loadedPaths).toEqual(["/auth/github/new", "/auth/github/new", "/"]),
    );
    expect(screen.getByTestId("location")).toHaveTextContent("/");
  });
});
