import { useCallback, useState } from "react";
import { useSearchParams } from "react-router";
import { ChevronDown, ChevronRight, File as FileIcon, Folder } from "lucide-react";
import { getDir, getFileContent, useRegistryQuery } from "~/lib/registry/client";
import type { RegistryFile } from "~/lib/registry/types";
import { cn } from "~/lib/utils";
import { Skeleton } from "~/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyTitle } from "~/components/ui/empty";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import hljs from "highlight.js/lib/common";

export function FilesView({ pkgName, spec }: { pkgName: string; spec: string }) {
  const [params, setParams] = useSearchParams();
  const selectedPath = params.get("path") || "";
  const [dirChildren, setDirChildren] = useState<Record<string, RegistryFile[]>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [dirLoading, setDirLoading] = useState<Record<string, boolean>>({});
  const [dirError, setDirError] = useState<string | null>(null);

  const {
    data: root,
    error: rootError,
    loading: rootLoading,
    retry,
  } = useRegistryQuery(() => getDir(pkgName, spec, ""), [pkgName, spec]);

  const loadDir = useCallback(
    async (path: string) => {
      if (dirChildren[path] || dirLoading[path]) return;
      setDirLoading((prev) => ({ ...prev, [path]: true }));
      setDirError(null);
      try {
        const res = await getDir(pkgName, spec, path);
        setDirChildren((prev) => ({ ...prev, [path]: res.files || [] }));
      } catch (err) {
        setDirChildren((prev) => ({ ...prev, [path]: [] }));
        setDirError(err instanceof Error ? err.message : "目录加载失败");
      } finally {
        setDirLoading((prev) => ({ ...prev, [path]: false }));
      }
    },
    [pkgName, spec, dirChildren, dirLoading],
  );

  const toggleDir = useCallback(
    (path: string) => {
      setExpanded((prev) => {
        const next = !prev[path];
        if (next) void loadDir(path);
        return { ...prev, [path]: next };
      });
    },
    [loadDir],
  );

  const selectFile = useCallback(
    (path: string) => {
      const next = new URLSearchParams(params);
      if (path) next.set("path", path);
      else next.delete("path");
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

  if (rootLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-[16rem_minmax(0,1fr)]">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (rootError) {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex items-center justify-between gap-3">
          产物预览失败
          <Button type="button" variant="outline" size="sm" onClick={retry}>
            重试
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!root?.files || root.files.length === 0) {
    return (
      <Empty>
        <EmptyTitle>没有文件</EmptyTitle>
        <EmptyDescription>该版本没有可浏览的文件</EmptyDescription>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row">
      <div className="max-h-[70vh] w-full overflow-auto rounded-lg border bg-muted/30 p-2 md:max-w-sm">
        <FileNode
          entries={root.files}
          depth={0}
          selectedPath={selectedPath}
          onSelect={selectFile}
          onToggleDir={toggleDir}
          dirChildren={dirChildren}
          expanded={expanded}
          dirLoading={dirLoading}
        />
      </div>
      <div className="min-w-0 flex-1">
        {selectedPath ? (
          <FileViewer pkgName={pkgName} spec={spec} path={selectedPath} />
        ) : (
          <div className="flex h-full min-h-48 items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">选择一个文件查看内容</p>
          </div>
        )}
      </div>
      {dirError && (
        <p className="sr-only" role="status">
          {dirError}
        </p>
      )}
    </div>
  );
}

function FileNode({
  entries,
  depth,
  selectedPath,
  onSelect,
  onToggleDir,
  dirChildren,
  expanded,
  dirLoading,
}: {
  entries: RegistryFile[];
  depth: number;
  selectedPath: string;
  onSelect: (path: string) => void;
  onToggleDir: (path: string) => void;
  dirChildren: Record<string, RegistryFile[]>;
  expanded: Record<string, boolean>;
  dirLoading: Record<string, boolean>;
}) {
  const sorted = [...entries].sort((a, b) => {
    if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
    return a.path.localeCompare(b.path);
  });

  return (
    <ul className="flex flex-col">
      {sorted.map((entry) => {
        if (entry.type === "directory") {
          const isExpanded = !!expanded[entry.path];
          const children = dirChildren[entry.path] ?? entry.files ?? [];
          const isLoading = !!dirLoading[entry.path];
          return (
            <li key={entry.path}>
              <button
                type="button"
                onClick={() => onToggleDir(entry.path)}
                aria-expanded={isExpanded}
                className="flex w-full items-center gap-1 rounded-md px-2 py-1 text-left text-sm text-foreground transition-colors hover:bg-accent"
                style={{ paddingLeft: depth * 12 + 8 }}
              >
                {isLoading ? (
                  <span className="size-3.5" />
                ) : isExpanded ? (
                  <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                )}
                <Folder className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{basename(entry.path)}</span>
              </button>
              {isExpanded && children.length > 0 && (
                <FileNode
                  entries={children}
                  depth={depth + 1}
                  selectedPath={selectedPath}
                  onSelect={onSelect}
                  onToggleDir={onToggleDir}
                  dirChildren={dirChildren}
                  expanded={expanded}
                  dirLoading={dirLoading}
                />
              )}
            </li>
          );
        }
        const isSelected = entry.path === selectedPath;
        return (
          <li key={entry.path}>
            <button
              type="button"
              onClick={() => onSelect(entry.path)}
              className={cn(
                "flex w-full items-center gap-1 rounded-md px-2 py-1 text-left text-sm transition-colors",
                isSelected
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
              style={{ paddingLeft: depth * 12 + 8 }}
            >
              <FileIcon className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{basename(entry.path)}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function FileViewer({ pkgName, spec, path }: { pkgName: string; spec: string; path: string }) {
  const { data: content, error, loading, retry } = useRegistryQuery(
    () => getFileContent(pkgName, spec, path),
    [pkgName, spec, path],
  );

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex items-center justify-between gap-3">
          文件加载失败
          <Button type="button" variant="outline" size="sm" onClick={retry}>
            重试
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-h-[70vh] overflow-auto rounded-lg border bg-muted/30">
      <pre className="p-4 text-xs leading-5">
        <code
          className="hljs font-mono"
          dangerouslySetInnerHTML={{ __html: highlighted(content || "") }}
        />
      </pre>
    </div>
  );
}

function highlighted(code: string) {
  try {
    return hljs.highlightAuto(code).value;
  } catch {
    return escapeHtml(code);
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function basename(path: string) {
  const normalized = path.replace(/\/+$/, "");
  const index = normalized.lastIndexOf("/");
  return index >= 0 ? normalized.slice(index + 1) : normalized;
}
