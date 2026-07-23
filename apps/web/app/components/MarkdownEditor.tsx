import { useState } from "react";
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
} from "lucide-react";

interface MarkdownEditorProps {
  value?: string;
  initialValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export function MarkdownEditor({
  value: valueProp,
  initialValue = "",
  onChange,
  placeholder,
}: MarkdownEditorProps) {
  const [internalValue, setInternalValue] = useState(initialValue);
  const value = valueProp ?? internalValue;
  const [showPreview, setShowPreview] = useState(false);

  const handleChange = (v: string) => {
    setInternalValue(v);
    onChange?.(v);
  };

  const toolbar = [
    { icon: Bold, title: "加粗", wrap: "**" },
    { icon: Italic, title: "斜体", wrap: "*" },
    { icon: LinkIcon, title: "链接", wrap: "[](url)" },
    { icon: Code, title: "代码", wrap: "`" },
    { icon: ImageIcon, title: "图片", wrap: "![](url)" },
  ];

  function insert(wrap: string) {
    const textarea = document.getElementById("md-editor") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);
    const newValue =
      value.substring(0, start) +
      wrap +
      selected +
      (wrap.includes("]") ? "" : wrap) +
      value.substring(end);
    handleChange(newValue);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + wrap.length, start + wrap.length + selected.length);
    }, 0);
  }

  return (
    <div className="rounded-md border border-input bg-background">
      <div className="flex items-center gap-1 border-b border-border px-2 py-1">
        {toolbar.map((btn) => (
          <Button
            key={btn.title}
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => insert(btn.wrap)}
            title={btn.title}
          >
            <btn.icon className="h-4 w-4" />
          </Button>
        ))}
        <div className="flex-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7"
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? (
            <>
              <Pencil className="h-3 w-3" /> 编辑
            </>
          ) : (
            <>
              <Eye className="h-3 w-3" /> 预览
            </>
          )}
        </Button>
      </div>
      {showPreview ? (
        <div className="p-3 min-h-[120px]">
          <MarkdownView content={value || placeholder || "预览"} />
        </div>
      ) : (
        <textarea
          id="md-editor"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder || "支持 Markdown 格式"}
          className="w-full p-3 min-h-[120px] bg-transparent focus:outline-none resize-y text-sm rounded-md"
        />
      )}
    </div>
  );
}
