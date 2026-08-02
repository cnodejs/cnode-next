import { useState } from "react";
import { useSearchParams } from "react-router";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { NativeSelect } from "./ui/native-select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Filter } from "lucide-react";

interface JobFilterBarProps {
  locations: string[];
}

const REMOTE_OPTIONS: { value: string; label: string }[] = [
  { value: "on-site", label: "坐班" },
  { value: "hybrid", label: "混合" },
  { value: "remote", label: "远程" },
];

export function JobFilterBar({ locations }: JobFilterBarProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  const location = searchParams.get("location") || "";
  const remote = searchParams.get("remote") || "";
  const salaryMin = searchParams.get("salary_min") || "";
  const tags = searchParams.get("tags") || "";
  const activeFilterCount = [location, remote, salaryMin, tags].filter(Boolean).length;

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setSearchParams(next);
  }

  function clearAll() {
    const next = new URLSearchParams();
    setSearchParams(next);
  }

  const filterControls = (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="job-location-filter" className="text-xs">地点</Label>
        <NativeSelect
          id="job-location-filter"
          value={location}
          onChange={(e) => updateParam("location", e.target.value)}
        >
          <option value="">全部</option>
          {locations.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="job-remote-filter" className="text-xs">远程</Label>
        <NativeSelect
          id="job-remote-filter"
          value={remote}
          onChange={(e) => updateParam("remote", e.target.value)}
        >
          <option value="">全部</option>
          {REMOTE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="job-salary-filter" className="text-xs">薪资下限 (K)</Label>
        <Input
          id="job-salary-filter"
          name="salary_min"
          type="number"
          value={salaryMin}
          onChange={(e) => updateParam("salary_min", e.target.value)}
          placeholder="如 30"
          className="h-9 w-full"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="job-tags-filter" className="text-xs">技术栈</Label>
        <Input
          id="job-tags-filter"
          name="tags"
          value={tags}
          onChange={(e) => updateParam("tags", e.target.value)}
          placeholder="如 Node,PostgreSQL"
          className="h-9 w-full"
        />
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden rounded-3xl bg-surface-subtle p-4 shadow-sm md:block sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <Filter className="h-4 w-4 text-primary" /> 筛选职位
            </div>
            <p className="mt-1 text-xs text-muted-foreground">按地点、办公方式、薪资和技术栈缩小结果范围</p>
          </div>
          {activeFilterCount > 0 && (
            <Button type="button" variant="ghost" size="sm" onClick={clearAll}>
              清除 {activeFilterCount} 项
            </Button>
          )}
        </div>
        {filterControls}
      </div>

      <div className="md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger render={<Button variant="secondary" size="sm" className="w-full" />}>
            <Filter className="h-4 w-4" />
            筛选
            {activeFilterCount > 0 && (
              <span className="ml-1 rounded-full bg-primary text-primary-foreground px-1.5 text-xs">
                {activeFilterCount}
              </span>
            )}
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[82vh] overflow-y-auto">
            <SheetHeader className="text-left">
              <SheetTitle>筛选招聘</SheetTitle>
            </SheetHeader>
            <div className="py-4">{filterControls}</div>
            {activeFilterCount > 0 && (
              <Button type="button" variant="ghost" className="w-full" onClick={clearAll}>
                清除全部筛选
              </Button>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
