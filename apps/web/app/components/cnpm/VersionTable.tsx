import { Link } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { formatBytes, getVersionTags, sortVersions } from "~/lib/registry/parse";
import type { RegistryManifest } from "~/lib/registry/types";

function formatDate(value: number | string | undefined) {
  if (value === undefined || value === null || value === "") return "-";
  const numeric = typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;
  const date = new Date(numeric);
  if (Number.isNaN(date.getTime())) return "-";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function VersionTable({ manifest, version }: { manifest: RegistryManifest; version: string }) {
  const versions = sortVersions(manifest.versions);
  const tags = getVersionTags(manifest);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>版本</TableHead>
          <TableHead>标签</TableHead>
          <TableHead>发布时间</TableHead>
          <TableHead>大小</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {versions.map((item) => (
          <TableRow key={item.version} className={item.version === version ? "bg-muted/40" : undefined}>
            <TableCell>
              <Link
                to={`/cnpm/pkg/${manifest.name}?version=${encodeURIComponent(item.version)}`}
                className="font-mono text-foreground hover:text-primary"
              >
                {item.version}
              </Link>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {tags[item.version]?.map((tag) => (
                  <Badge key={tag} variant={tag === "latest" ? "default" : "secondary"}>
                    {tag}
                  </Badge>
                ))}
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(item.publish_time ?? item._cnpmcore_publish_time)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatBytes(item.dist?.size ?? item.dist?.unpackedSize)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
