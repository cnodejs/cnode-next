import type { RegistryManifest, RegistryVersion } from "./types";

export const PACKAGE_TABS = ["home", "versions", "files", "deps", "trends"] as const;
export type PkgTab = (typeof PACKAGE_TABS)[number];

export interface ParsedPkgRoute {
  name?: string;
  tab: PkgTab;
}

export function repoUrl(repository: RegistryManifest["repository"]) {
  if (!repository) return undefined;
  const url = typeof repository === "string" ? repository : repository.url;
  if (!url) return undefined;
  if (/^git(\+ssh|\+https?)?:\/\//.test(url)) {
    const rest = url.replace(/^git(\+ssh|\+https?)?:\/\//, "").replace(/^[^@]+@/, "");
    return `https://${rest}`.replace(/\.git$/, "");
  }
  if (/^git@github\.com:(.+)$/.test(url)) {
    return `https://github.com/${url.replace(/^git@github\.com:/, "").replace(/\.git$/, "")}`;
  }
  if (url.startsWith("http")) return url.replace(/\.git$/, "");
  return undefined;
}

export function parsePkgPath(rest: string | undefined): ParsedPkgRoute {
  if (!rest) {
    return { tab: "home" };
  }
  const segments = rest.split("/").filter(Boolean);
  if (segments.length === 0) {
    return { tab: "home" };
  }

  let name: string;
  let tail: string[];
  if (segments[0].startsWith("@")) {
    if (segments.length < 2) {
      return { tab: "home" };
    }
    name = `${segments[0]}/${segments[1]}`;
    tail = segments.slice(2);
  } else {
    name = segments[0];
    tail = segments.slice(1);
  }

  const tab = tail[0] && (PACKAGE_TABS as readonly string[]).includes(tail[0]) ? (tail[0] as PkgTab) : "home";
  return { name, tab };
}

export function isScopedPkg(name: string) {
  return name.startsWith("@");
}

export function normalizeVersionSpec(spec: string | undefined) {
  if (!spec || spec === "*") return "latest";
  return spec;
}

export function getVersionTags(manifest: RegistryManifest): Record<string, string[]> {
  const tagsMap = manifest["dist-tags"] || {};
  const result: Record<string, string[]> = {};
  for (const [tag, version] of Object.entries(tagsMap)) {
    if (!result[version]) result[version] = [];
    result[version].push(tag);
  }
  return result;
}

function toTimestamp(value: unknown): number {
  if (typeof value === "string") {
    if (/^\d+$/.test(value)) return Number(value) || 0;
    const ts = Date.parse(value);
    return Number.isNaN(ts) ? 0 : ts;
  }
  return Number(value) || 0;
}

export function sortVersions(versions: Record<string, RegistryVersion>): RegistryVersion[] {
  return Object.values(versions || {}).sort((a, b) => {
    const ta = toTimestamp(a.publish_time ?? a._cnpmcore_publish_time);
    const tb = toTimestamp(b.publish_time ?? b._cnpmcore_publish_time);
    return tb - ta;
  });
}

export function formatBytes(bytes: number | undefined) {
  if (bytes === undefined || bytes === null || Number.isNaN(bytes)) return "-";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, Math.min(index, units.length - 1));
  const decimals = index === 0 || Number.isInteger(value) ? 0 : 1;
  return `${value.toFixed(decimals)} ${units[Math.min(index, units.length - 1)]}`;
}

export function formatCompactNumber(value: number | undefined) {
  if (value === undefined || Number.isNaN(value)) return "-";
  const compact = (scale: number, suffix: string) => {
    const text = (value / scale).toFixed(1).replace(/\.0$/, "");
    return `${text}${suffix}`;
  };
  if (value >= 1_000_000_000) return compact(1_000_000_000, "b");
  if (value >= 1_000_000) return compact(1_000_000, "m");
  if (value >= 1_000) return compact(1_000, "k");
  return String(value);
}
