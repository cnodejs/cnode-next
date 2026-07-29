import { useState } from "react";
import { useSearchParams } from "react-router";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
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

  const controlClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

  const filterControls = (
    <div className="grid gap-3 md:grid-cols-[minmax(8rem,1fr)_minmax(8rem,1fr)_8rem_minmax(13rem,1.4fr)_6rem] md:items-end">
      <div className="space-y-1.5">
        <Label className="text-xs">地点</Label>
        <select
          value={location}
          onChange={(e) => updateParam("location", e.target.value)}
          className={controlClass}
        >
          <option value="">全部</option>
          {locations.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">远程</Label>
        <select
          value={remote}
          onChange={(e) => updateParam("remote", e.target.value)}
          className={controlClass}
        >
          <option value="">全部</option>
          {REMOTE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">薪资下限 (K)</Label>
        <Input
          type="number"
          value={salaryMin}
          onChange={(e) => updateParam("salary_min", e.target.value)}
          placeholder="如 30"
          className="h-10 w-full"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">技术栈</Label>
        <Input
          value={tags}
          onChange={(e) => updateParam("tags", e.target.value)}
          placeholder="如 Node,PostgreSQL"
          className="h-10 w-full"
        />
      </div>

      <Button type="button" variant="ghost" className="h-10 w-full" onClick={clearAll}>
        清除筛选
      </Button>
    </div>
  );

  return (
    <>
      <div className="hidden rounded-xl border border-border bg-card p-3 shadow-sm md:block">
        {filterControls}
      </div>

      <div className="md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <Filter className="h-4 w-4" />
              筛选
              {(location || remote || salaryMin || tags) && (
                <span className="ml-1 rounded-full bg-primary text-primary-foreground px-1.5 text-xs">
                  {[location, remote, salaryMin, tags].filter(Boolean).length}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[82vh] overflow-y-auto">
            <SheetHeader className="text-left">
              <SheetTitle>筛选招聘</SheetTitle>
            </SheetHeader>
            <div className="py-4">{filterControls}</div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
