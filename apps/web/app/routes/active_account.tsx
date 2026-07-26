import { Layout } from "~/components/Layout";
import { FormPage } from "~/components/PageShell";
import { Card, CardContent } from "~/components/ui/card";
import { apiFetch } from "~/lib/api-client";
import { useSearchParams, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { CheckCircle, XCircle } from "lucide-react";

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
      <FormPage>
        <Card className="text-center">
          <CardContent className="py-12">
            {status === "loading" && <p className="text-muted-foreground">正在激活账号...</p>}
            {status === "success" && (
              <>
                <CheckCircle className="mx-auto mb-2 h-8 w-8 text-primary" />
                <p className="mb-2 text-primary">{message}</p>
                <p className="text-sm text-muted-foreground">即将跳转到登录页...</p>
              </>
            )}
            {status === "error" && (
              <>
                <XCircle className="mx-auto mb-2 h-8 w-8 text-destructive" />
                <p className="mb-4 text-destructive">{message}</p>
                <a href="/signin" className="text-sm text-primary hover:underline">
                  返回登录
                </a>
              </>
            )}
          </CardContent>
        </Card>
      </FormPage>
    </Layout>
  );
}
