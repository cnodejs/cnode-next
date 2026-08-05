import { Link } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import type { RegistryManifest } from "~/lib/registry/types";

type DepGroup = {
  key: "dependencies" | "devDependencies" | "optionalDependencies" | "peerDependencies";
  label: string;
};

const GROUPS: DepGroup[] = [
  { key: "dependencies", label: "dependencies" },
  { key: "devDependencies", label: "devDependencies" },
  { key: "optionalDependencies", label: "optionalDependencies" },
  { key: "peerDependencies", label: "peerDependencies" },
];

export function DepsView({ manifest, version }: { manifest: RegistryManifest; version: string }) {
  const versionData = manifest.versions?.[version];
  if (!versionData) {
    return <p className="text-sm text-muted-foreground">该版本没有依赖信息</p>;
  }

  const groups = GROUPS.filter((group) => {
    const deps = versionData[group.key];
    return deps && Object.keys(deps).length > 0;
  });

  if (groups.length === 0) {
    return <p className="text-sm text-muted-foreground">该版本没有任何依赖</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => {
        const deps = versionData[group.key]!;
        const entries = Object.entries(deps).sort(([a], [b]) => a.localeCompare(b));
        return (
          <div key={group.key} className="flex flex-col gap-2">
            <h3 className="font-mono text-sm font-medium text-muted-foreground">
              {group.label}
              <span className="ml-2 text-muted-foreground/70">{entries.length}</span>
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>版本范围</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map(([pkg, spec]) => (
                  <TableRow key={pkg}>
                    <TableCell>
                      <Link
                        to={`/cnpm/pkg/${pkg}?version=${encodeURIComponent(spec)}`}
                        className="text-foreground hover:text-primary"
                      >
                        {pkg}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">{spec}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );
      })}
    </div>
  );
}
