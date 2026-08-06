import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { NativeSelect } from "./ui/native-select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { uploadJobLogo } from "~/lib/upload-client";
import { Image as ImageIcon, Loader2, X } from "lucide-react";

export interface JobMetaFormValue {
  company: string;
  company_logo?: string | null;
  position: string;
  location: string;
  remote: "on-site" | "hybrid" | "remote";
  salary_min?: number | null;
  salary_max?: number | null;
  experience?: string;
  tech_tags?: string[];
  contact: string;
}

interface JobMetaFormProps {
  value: JobMetaFormValue;
  onChange: (value: JobMetaFormValue) => void;
}

const REMOTE_OPTIONS: { value: JobMetaFormValue["remote"]; label: string }[] = [
  { value: "on-site", label: "坐班" },
  { value: "hybrid", label: "混合" },
  { value: "remote", label: "远程" },
];

export function JobMetaForm({ value, onChange }: JobMetaFormProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [tagInput, setTagInput] = useState("");

  function update<K extends keyof JobMetaFormValue>(key: K, v: JobMetaFormValue[K]) {
    onChange({ ...value, [key]: v });
  }

  async function handleLogoUpload(file: File) {
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);
    try {
      const result = await uploadJobLogo(file);
      update("company_logo", result.url);
      setUploadSuccess(true);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "图片上传失败");
    } finally {
      setUploading(false);
    }
  }

  function addTag() {
    const tag = tagInput.trim();
    if (!tag) return;
    const tags = value.tech_tags || [];
    if (!tags.includes(tag)) {
      update("tech_tags", [...tags, tag]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    const tags = value.tech_tags || [];
    update(
      "tech_tags",
      tags.filter((t) => t !== tag),
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>招聘信息</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="company">公司 *</Label>
          <Input
            id="company"
            name="company"
            autoComplete="organization"
            value={value.company}
            onChange={(e) => update("company", e.target.value)}
            placeholder="公司名称"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="company-logo-upload">公司 Logo</Label>
          <div className="flex items-center gap-3">
            {value.company_logo ? (
              <div className="relative">
                <img
                  src={value.company_logo}
                  alt="公司 logo"
                  className="size-12 rounded-md object-cover"
                />
                <button
                  type="button"
                  onClick={() => update("company_logo", null)}
                  className="absolute -right-1 -top-1 rounded-full bg-destructive text-destructive-foreground p-0.5"
                  aria-label="移除 logo"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="flex size-12 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <ImageIcon className="h-5 w-5" />
              </div>
            )}
            <input
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
              className="hidden"
              id="company-logo-upload"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleLogoUpload(file);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => document.getElementById("company-logo-upload")?.click()}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> 上传中
                </>
              ) : (
                "上传 Logo"
              )}
            </Button>
          </div>
          {uploadError && (
            <p role="alert" className="text-xs text-destructive">
              {uploadError}
            </p>
          )}
          {uploadSuccess && (
            <p role="status" className="text-xs text-muted-foreground">
              公司 Logo 上传成功
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="position">职位类别 *</Label>
          <Input
            id="position"
            name="position"
            autoComplete="organization-title"
            value={value.position}
            onChange={(e) => update("position", e.target.value)}
            placeholder="如：Node.js 后端工程师"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="location">地点 *</Label>
            <Input
              id="location"
              name="location"
              autoComplete="address-level2"
              value={value.location}
              onChange={(e) => update("location", e.target.value)}
              placeholder="如：上海"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="remote">远程模式 *</Label>
            <NativeSelect
              id="remote"
              name="remote"
              value={value.remote}
              onChange={(e) => update("remote", e.target.value as JobMetaFormValue["remote"])}
            >
              {REMOTE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="salary_min">薪资下限 (K)</Label>
            <Input
              id="salary_min"
              name="salary_min"
              type="number"
              value={value.salary_min ?? ""}
              onChange={(e) => update("salary_min", e.target.value ? Number(e.target.value) : null)}
              placeholder="如：20"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="salary_max">薪资上限 (K)</Label>
            <Input
              id="salary_max"
              name="salary_max"
              type="number"
              value={value.salary_max ?? ""}
              onChange={(e) => update("salary_max", e.target.value ? Number(e.target.value) : null)}
              placeholder="如：40"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="experience">经验要求</Label>
          <Input
            id="experience"
            name="experience"
            value={value.experience ?? ""}
            onChange={(e) => update("experience", e.target.value || undefined)}
            placeholder="如：3-5 年"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="tech-tags">技术栈</Label>
          <div className="flex gap-2">
            <Input
              id="tech-tags"
              name="tech_tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="输入后回车添加"
            />
            <Button type="button" variant="outline" size="sm" onClick={addTag}>
              添加
            </Button>
          </div>
          {value.tech_tags && value.tech_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {value.tech_tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`移除 ${tag}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="contact">联系方式 *</Label>
          <Input
            id="contact"
            name="contact"
            autoComplete="email"
            value={value.contact}
            onChange={(e) => update("contact", e.target.value)}
            placeholder="邮箱 / 链接 / 微信号"
          />
        </div>
      </CardContent>
    </Card>
  );
}
