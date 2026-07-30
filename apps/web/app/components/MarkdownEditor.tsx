import { useRef, useState, type ClipboardEvent, type DragEvent } from "react";
import { MarkdownView } from "./MarkdownView";
import { Button } from "./ui/button";
import {
  Bold,
  Italic,
  Link as LinkIcon,
  Code,
  Image as ImageIcon,
  Eye,
  Pencil,
  Columns2,
  List,
  Loader2,
  Quote,
  Upload,
} from "lucide-react";
import { uploadEditorImage } from "~/lib/upload-client";
import { cn } from "~/lib/utils";

type EditorMode = "edit" | "preview" | "split";

interface MarkdownEditorProps {
  value?: string;
  initialValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export function MarkdownEditor({
  value: valueProp,
  initialValue = "",
  onChange,
  placeholder,
  minHeight = 160,
}: MarkdownEditorProps) {
  const [internalValue, setInternalValue] = useState(initialValue);
  const value = valueProp ?? internalValue;
  const [mode, setMode] = useState<EditorMode>("edit");
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (v: string) => {
    setInternalValue(v);
    onChange?.(v);
  };

  function updateValue(newValue: string, selectionStart?: number, selectionEnd?: number) {
    handleChange(newValue);
    window.setTimeout(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      if (selectionStart !== undefined && selectionEnd !== undefined) {
        textarea.setSelectionRange(selectionStart, selectionEnd);
      }
    }, 0);
  }

  function insertInline(before: string, after = before, fallback = "") {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || fallback;
    const newValue =
      value.slice(0, start) +
      before +
      selected +
      after +
      value.slice(end);
    updateValue(newValue, start + before.length, start + before.length + selected.length);
  }

  function insertLink() {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || "链接文字";
    const markdown = `[${selected}](url)`;
    updateValue(value.slice(0, start) + markdown + value.slice(end), start + 1, start + 1 + selected.length);
  }

  function insertImagePlaceholder() {
    insertImageMarkdown("图片描述", "url");
  }

  function insertImageMarkdown(alt: string, url: string) {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? value.length;
    const end = textarea?.selectionEnd ?? value.length;
    const markdown = `![${alt}](${url})`;
    const prefix = start > 0 && !value.slice(0, start).endsWith("\n") ? "\n" : "";
    const suffix = value.slice(end).startsWith("\n") ? "" : "\n";
    const inserted = `${prefix}${markdown}${suffix}`;
    const cursor = start + inserted.length;
    updateValue(value.slice(0, start) + inserted + value.slice(end), cursor, cursor);
  }

  function insertLinePrefix(prefix: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const selected = value.slice(lineStart, end);
    const replacement = selected
      .split("\n")
      .map((line) => (line.startsWith(prefix) ? line : `${prefix}${line || "内容"}`))
      .join("\n");
    updateValue(value.slice(0, lineStart) + replacement + value.slice(end), lineStart, lineStart + replacement.length);
  }

  async function uploadFiles(files: FileList | File[]) {
    const image = Array.from(files).find((file) => file.type.startsWith("image/"));
    if (!image) return;
    setUploading(true);
    setUploadError(null);
    try {
      const result = await uploadEditorImage(image);
      insertImageMarkdown(result.filename.replace(/\.[^.]+$/, "") || "image", result.url);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "图片上传失败");
    } finally {
      setUploading(false);
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const files = Array.from(event.clipboardData.files).filter((file) => file.type.startsWith("image/"));
    if (!files.length) return;
    event.preventDefault();
    void uploadFiles(files);
  }

  function handleDrop(event: DragEvent<HTMLTextAreaElement>) {
    const files = Array.from(event.dataTransfer.files).filter((file) => file.type.startsWith("image/"));
    setIsDragging(false);
    if (!files.length) return;
    event.preventDefault();
    void uploadFiles(files);
  }

  const toolbar = [
    { icon: Bold, title: "加粗", action: () => insertInline("**", "**", "粗体") },
    { icon: Italic, title: "斜体", action: () => insertInline("*", "*", "斜体") },
    { icon: LinkIcon, title: "链接", action: insertLink },
    { icon: Code, title: "代码", action: () => insertInline("`", "`", "code") },
    { icon: Quote, title: "引用", action: () => insertLinePrefix("> ") },
    { icon: List, title: "列表", action: () => insertLinePrefix("- ") },
    { icon: ImageIcon, title: "图片占位", action: insertImagePlaceholder },
    { icon: Upload, title: "上传图片", action: () => fileInputRef.current?.click() },
  ];

  const previewContent = value || "暂无内容可预览";
  const textarea = (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => handleChange(e.target.value)}
      onPaste={handlePaste}
      onDrop={handleDrop}
      onDragOver={(event) => {
        if (Array.from(event.dataTransfer.items).some((item) => item.type.startsWith("image/"))) {
          event.preventDefault();
          setIsDragging(true);
        }
      }}
      onDragLeave={() => setIsDragging(false)}
      placeholder={placeholder || "支持 Markdown 格式"}
      aria-label={placeholder || "支持 Markdown 格式"}
      style={{ minHeight }}
      className={cn(
        "w-full bg-transparent p-3 text-sm outline-none resize-y rounded-md",
        isDragging && "bg-cnode-soft/70 ring-2 ring-cnode-green",
      )}
    />
  );
  const preview = (
    <div className="min-h-[inherit] p-3">
      <MarkdownView content={previewContent} />
    </div>
  );

  return (
    <div className="rounded-md border border-input bg-background">
      <div className="flex flex-wrap items-center gap-1 border-b border-border px-2 py-1">
        {toolbar.map((btn) => (
          <Button
            key={btn.title}
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={btn.action}
            disabled={uploading}
            title={btn.title}
            aria-label={btn.title}
          >
            <btn.icon className="h-4 w-4" />
          </Button>
        ))}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
          aria-label="上传图片文件"
          className="hidden"
          onChange={(event) => {
            if (event.currentTarget.files) void uploadFiles(event.currentTarget.files);
            event.currentTarget.value = "";
          }}
        />
        <div className="flex-1" />
        {uploading ? (
          <span className="inline-flex items-center gap-1 px-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> 上传中
          </span>
        ) : null}
        <div className="flex items-center gap-1" role="group" aria-label="编辑器视图">
          <Button type="button" variant={mode === "edit" ? "secondary" : "ghost"} size="sm" className="h-7" onClick={() => setMode("edit")}>
            <Pencil className="h-3 w-3" /> 编辑
          </Button>
          <Button type="button" variant={mode === "preview" ? "secondary" : "ghost"} size="sm" className="h-7" onClick={() => setMode("preview")}>
            <Eye className="h-3 w-3" /> 预览
          </Button>
          <Button type="button" variant={mode === "split" ? "secondary" : "ghost"} size="sm" className="hidden h-7 sm:inline-flex" onClick={() => setMode("split")}>
            <Columns2 className="h-3 w-3" /> 双栏
          </Button>
        </div>
      </div>
      {uploadError ? <div className="border-b border-border px-3 py-2 text-xs text-destructive">{uploadError}</div> : null}
      {mode === "preview" ? preview : null}
      {mode === "edit" ? textarea : null}
      {mode === "split" ? (
        <div className="grid min-h-[inherit] sm:grid-cols-2">
          <div className="border-b border-border sm:border-b-0 sm:border-r">{textarea}</div>
          <div className="max-h-[70vh] overflow-auto">{preview}</div>
        </div>
      ) : null}
    </div>
  );
}
