import { Download, ExternalLink, GitFork, Globe, Package as PackageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { DownloadCard } from "./DownloadCard";
import { MaintainersCard } from "./MaintainersCard";
import { formatBytes, repoUrl, safeExternalUrl } from "~/lib/registry/parse";
import type { RegistryManifest } from "~/lib/registry/types";

export function PkgSidebar({ manifest, version }: { manifest: RegistryManifest; version: string }) {
  const repo = repoUrl(manifest.repository);
  const dist = manifest.versions?.[version]?.dist;
  const links: Array<{ label: string; href?: string; icon: React.ReactNode } | null> = [
    { label: "仓库", href: repo, icon: <GitFork className="size-4 shrink-0" /> },
    { label: "主页", href: safeExternalUrl(manifest.homepage), icon: <Globe className="size-4 shrink-0" /> },
    { label: "npmjs.com", href: `https://www.npmjs.com/package/${manifest.name}`, icon: <PackageIcon className="size-4 shrink-0" /> },
    { label: "unpkg", href: `https://unpkg.com/${manifest.name}@${version}`, icon: <ExternalLink className="size-4 shrink-0" /> },
    dist?.tarball
      ? {
          label: `tarball${dist.size !== undefined ? ` · ${formatBytes(dist.size)}` : ""}`,
          href: safeExternalUrl(dist.tarball),
          icon: <Download className="size-4 shrink-0" />,
        }
      : null,
  ];
  const visibleLinks = links.filter(
    (link): link is { label: string; href: string; icon: React.ReactNode } => Boolean(link && link.href),
  );

  return (
    <div className="flex flex-col gap-5">
      <DownloadCard pkgName={manifest.name} />
      {manifest.maintainers && manifest.maintainers.length > 0 && (
        <MaintainersCard maintainers={manifest.maintainers} />
      )}
      <Card>
        <CardHeader>
          <CardTitle>资源信息</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {visibleLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex min-w-0 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              {link.icon}
              <span className="min-w-0 flex-1 truncate">{link.label}</span>
              <ExternalLink className="size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
            </a>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
