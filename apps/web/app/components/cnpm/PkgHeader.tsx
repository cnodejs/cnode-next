import { useState } from "react";
import { Check, Copy, ExternalLink, GitFork, Globe, Package as PackageIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { sortVersions, getVersionTags, type PkgTab } from "~/lib/registry/parse";
import type { RegistryManifest } from "~/lib/registry/types";
import { PkgTabs } from "./PkgTabs";

function repoUrl(repository: RegistryManifest["repository"]) {
  if (!repository) return undefined;
  const url = typeof repository === "string" ? repository : repository.url;
  if (!url) return undefined;
  if (/^git(\+ssh)?:\/\//.test(url)) {
    return url.replace(/^git(\+ssh)?:\/\//, "https://").replace(/\.git$/, "");
  }
  if (/^git@github\.com:(.+)$/.test(url)) {
    return `https://github.com/${url.replace(/^git@github\.com:/, "").replace(/\.git$/, "")}`;
  }
  if (url.startsWith("http")) return url.replace(/\.git$/, "");
  return undefined;
}

export function PkgHeader({
  manifest,
  version,
  active,
  onVersionChange,
}: {
  manifest: RegistryManifest;
  version: string;
  active: PkgTab;
  onVersionChange: (version: string) => void;
}) {
  const versions = sortVersions(manifest.versions);
  const tags = getVersionTags(manifest);
  const [copied, setCopied] = useState(false);
  const installCommand = `npm install ${manifest.name}@${version}`;
  const repo = repoUrl(manifest.repository);

  const handleVersionChange = (value: string | null) => {
    if (value) onVersionChange(value);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(installCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
            <PackageIcon className="size-5" />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {manifest.name}
                <span className="ml-2 font-mono text-lg text-muted-foreground">{version}</span>
              </h1>
              {tags[version]?.length ? (
                <Badge variant="secondary" className="font-mono">
                  {tags[version].join(", ")}
                </Badge>
              ) : null}
            </div>
            {manifest.description && (
              <p className="max-w-2xl text-sm text-muted-foreground">{manifest.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {manifest.license && (
                <Badge variant="outline">{manifest.license}</Badge>
              )}
              {repo && (
                <a
                  href={repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
                >
                  <GitFork className="size-3.5" /> 源码
                </a>
              )}
              {manifest.homepage && (
                <a
                  href={manifest.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
                >
                  <Globe className="size-3.5" /> 主页
                  <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
          <Select value={version} onValueChange={handleVersionChange}>
            <SelectTrigger aria-label="选择版本" size="sm" className="min-w-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              className="max-h-80 w-fit max-w-[calc(100vw-2rem)]"
              align="end"
              alignItemWithTrigger={false}
            >
              {versions.map((item) => (
                <SelectItem key={item.version} value={item.version}>
                  <span className="font-mono">{item.version}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={copy}>
            {copied ? (
              <Check data-icon="inline-start" />
            ) : (
              <Copy data-icon="inline-start" />
            )}
            {copied ? "已复制" : installCommand}
          </Button>
        </div>
      </div>
      <PkgTabs name={manifest.name} active={active} version={version} />
    </div>
  );
}
