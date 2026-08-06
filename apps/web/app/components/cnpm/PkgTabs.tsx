import { useNavigate } from "react-router";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import type { PkgTab } from "~/lib/registry/parse";

const TABS: Array<{ key: PkgTab; label: string }> = [
  { key: "home", label: "首页" },
  { key: "versions", label: "版本" },
  { key: "files", label: "文件" },
  { key: "deps", label: "依赖" },
  { key: "trends", label: "趋势" },
];

export function PkgTabs({
  name,
  active,
  version,
}: {
  name: string;
  active: PkgTab;
  version?: string;
}) {
  const navigate = useNavigate();
  const versionQuery = version ? `?version=${encodeURIComponent(version)}` : "";

  const handleChange = (value: string | number) => {
    const tab = String(value) as PkgTab;
    void navigate(
      tab === "home"
        ? `/cnpm/pkg/${name}${versionQuery}`
        : `/cnpm/pkg/${name}/${tab}${versionQuery}`,
    );
  };

  return (
    <Tabs value={active} onValueChange={handleChange}>
      <TabsList
        className="w-full max-w-full justify-start overflow-x-auto"
        aria-label="包信息分类"
      >
        {TABS.map((tab) => (
          <TabsTrigger key={tab.key} value={tab.key} className="flex-none">
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
