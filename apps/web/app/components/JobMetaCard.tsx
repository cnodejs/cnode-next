import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { getAvatarFallback } from "~/lib/brand";
import { MapPin, Wifi, DollarSign, Briefcase, Mail, ExternalLink, Copy } from "lucide-react";

export interface JobMetaCardData {
  company: string;
  company_logo: string | null | undefined;
  position: string;
  location: string;
  remote: string;
  salary_min: number | null | undefined;
  salary_max: number | null | undefined;
  experience: string | null | undefined;
  tech_tags: string[];
  contact: string;
}

const REMOTE_LABEL: Record<string, string> = {
  "on-site": "坐班",
  hybrid: "混合",
  remote: "远程",
};

function formatSalary(min?: number | null, max?: number | null): string {
  const hasMin = min !== null && min !== undefined;
  const hasMax = max !== null && max !== undefined;
  if (!hasMin && !hasMax) return "面议";
  if (hasMin && hasMax) return `${min}-${max}K`;
  if (hasMin) return `${min}K+`;
  return `≤${max}K`;
}

function isEmail(s: string): boolean {
  return s.includes("@");
}

function isUrl(s: string): boolean {
  return /^https?:\/\//i.test(s);
}

export function JobMetaCard({ meta }: { meta: JobMetaCardData }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleCta() {
    if (isEmail(meta.contact)) {
      window.location.href = `mailto:${meta.contact}`;
    } else if (isUrl(meta.contact)) {
      window.open(meta.contact, "_blank", "noopener,noreferrer");
    } else {
      setSheetOpen(true);
    }
  }

  async function copyContact() {
    try {
      await navigator.clipboard.writeText(meta.contact);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  const CtaIcon = isEmail(meta.contact) ? Mail : isUrl(meta.contact) ? ExternalLink : Copy;
  const ctaLabel = "立即投递";

  return (
    <div className="rounded-xl border border-cnode-green/20 bg-cnode-soft/50 p-4">
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12 shrink-0 rounded-lg border border-border">
          {meta.company_logo ? (
            <AvatarImage src={meta.company_logo} alt={meta.company} />
          ) : (
            <AvatarFallback className="rounded-lg">
              {getAvatarFallback(meta.company)}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{meta.company}</p>
          <p className="text-xs text-muted-foreground">{meta.position}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge icon={MapPin} text={meta.location} />
        <Badge icon={Wifi} text={REMOTE_LABEL[meta.remote] || meta.remote} />
        <Badge icon={DollarSign} text={formatSalary(meta.salary_min, meta.salary_max)} />
        {meta.experience && <Badge icon={Briefcase} text={meta.experience} />}
      </div>

      {meta.tech_tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {meta.tech_tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4">
        <Button type="button" size="sm" onClick={handleCta}>
          <CtaIcon className="h-4 w-4" />
          {ctaLabel}
          {isUrl(meta.contact) && <ExternalLink className="h-3 w-3" />}
        </Button>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom">
          <SheetHeader className="text-left">
            <SheetTitle>联系方式</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-subtle p-3">
              <span className="min-w-0 flex-1 text-sm font-medium text-foreground">
                {meta.contact}
              </span>
              <Button type="button" variant="outline" size="sm" onClick={copyContact}>
                <Copy className="h-4 w-4" />
                {copied ? "已复制" : "复制"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Badge({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-md bg-background px-1.5 py-0.5 text-xs text-cnode-ink ring-1 ring-cnode-green/15">
      <Icon className="h-3 w-3" />
      {text}
    </span>
  );
}
