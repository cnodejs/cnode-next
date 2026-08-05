import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";

const STEPS = [
  {
    title: "临时使用",
    description: "单次安装时指定镜像源，不影响全局配置",
    command: "npm install react --registry=https://registry.npmmirror.com",
  },
  {
    title: "全局配置",
    description: "将默认 registry 指向 npmmirror，之后安装自动走镜像",
    command: "npm config set registry https://registry.npmmirror.com",
  },
  {
    title: "验证配置",
    description: "确认当前 registry 是否为镜像地址",
    command: "npm config get registry",
  },
];

const REGISTRY_URL = "https://registry.npmmirror.com";

function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <div className="flex items-center gap-1 rounded-lg border bg-muted p-1 pl-3">
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-xs text-foreground">
        {command}
      </code>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="size-7 shrink-0 p-0"
        onClick={copy}
        aria-label="复制命令"
      >
        {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
      </Button>
    </div>
  );
}

export function RegistryGuide() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>使用 npmmirror 镜像</CardTitle>
        <CardDescription>
          通过国内镜像源加速 npm 安装，官方镜像地址：
          <a
            href={REGISTRY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 inline-flex items-center gap-0.5 font-mono text-xs text-primary hover:underline"
          >
            {REGISTRY_URL}
            <ExternalLink className="size-3" />
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {STEPS.map((step, index) => (
          <div key={step.title} className="flex flex-col gap-1.5">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-xs text-muted-foreground">{index + 1}.</span>
              <h3 className="text-sm font-medium">{step.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{step.description}</p>
            <CopyCommand command={step.command} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
