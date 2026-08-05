import { Layout } from "~/components/Layout";
import { AccountPage, PageHeader } from "~/components/PageShell";
import { apiFetch } from "~/lib/api-client";
import { useSearchParams, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "~/components/ui/empty";
import { Button } from "~/components/ui/button";

export function meta() {
  return [{ title: "账号激活 · CNode" }];
}

export default function ActiveAccount() {
  const [params] = useSearchParams();
  const key = params.get("key") || "";
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!key) {
      setStatus("error");
      setMessage("无效的激活链接");
      return;
    }

    apiFetch<{ success: boolean; message?: string; error_msg?: string }>(
      `/api/v1/auth/local/active_account?key=${encodeURIComponent(key)}`,
    )
      .then((res) => {
        if (res.success) {
          setStatus("success");
          setMessage(res.message || "账号已激活");
          setTimeout(() => navigate("/signin"), 3000);
        } else {
          setStatus("error");
          setMessage(res.error_msg || "激活失败");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("网络错误");
      });
  }, [key]);

  return (
    <Layout>
      <AccountPage>
        <PageHeader
          breadcrumbs={[{ label: "首页", to: "/" }, { label: "账号激活" }]}
          title="账号激活"
          description="验证激活链接并启用你的社区账号。"
        />
        <Empty>
          {status === "loading" && <p className="text-muted-foreground">正在激活账号...</p>}
          {status === "success" && (
            <EmptyHeader>
              <EmptyTitle>{message}</EmptyTitle>
              <EmptyDescription>即将跳转到登录页...</EmptyDescription>
            </EmptyHeader>
          )}
          {status === "error" && (
            <>
              <EmptyHeader>
                <EmptyTitle>{message}</EmptyTitle>
              </EmptyHeader>
              <EmptyContent>
                <Button render={<a href="/signin" />} variant="outline">
                  返回登录
                </Button>
              </EmptyContent>
            </>
          )}
        </Empty>
      </AccountPage>
    </Layout>
  );
}
