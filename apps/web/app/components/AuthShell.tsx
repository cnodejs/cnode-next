import { Link } from "react-router";
import { CNodeLogo } from "./CNodeLogo";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid w-full overflow-hidden rounded-3xl bg-card shadow-floating lg:grid-cols-[1fr_28rem]">
      <section className="relative hidden min-h-[560px] flex-col justify-between bg-cnode-ink p-10 text-white lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(128,189,1,0.28),transparent_34%),radial-gradient(circle_at_85%_70%,rgba(128,189,1,0.16),transparent_32%)]" />
        <div className="relative flex flex-col gap-10">
          <CNodeLogo className="[&_span:first-child]:bg-transparent [&_img]:brightness-0 [&_img]:invert" />
          <div>
            <p className="text-sm font-semibold tracking-[0.2em] text-cnode-green">{eyebrow}</p>
            <div className="mt-4 max-w-md text-4xl font-bold tracking-tight">{title}</div>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/70">{description}</p>
          </div>
        </div>
        <div className="relative grid gap-3 text-sm text-white/78">
          <div className="rounded-2xl bg-white/6 p-4">
            技术问题、实践分享、招聘信息汇聚在同一个社区上下文里。
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Metric value="15k+" label="历史话题" />
            <Metric value="Node.js" label="中文社区" />
            <Metric value="Markdown" label="友好写作" />
          </div>
        </div>
      </section>
      <section className="bg-surface-subtle p-4 sm:p-8 lg:p-10">
        <div className="mb-6 flex items-center justify-between lg:hidden">
          <CNodeLogo />
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
            返回首页
          </Link>
        </div>
        <div className="mb-6 lg:hidden">
          <p className="text-xs font-semibold tracking-[0.2em] text-primary">{eyebrow}</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground lg:sr-only">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <div className="rounded-2xl bg-card p-5 shadow-card sm:p-6">{children}</div>
      </section>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white/6 p-3">
      <div className="font-semibold text-white">{value}</div>
      <div className="mt-1 text-xs text-white/56">{label}</div>
    </div>
  );
}
