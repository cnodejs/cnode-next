import { useState, type ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import { cn } from "~/lib/utils";
import { markdownHeadingIdsByLine, slugifyHeading } from "~/lib/markdown-headings";

const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code || []), "className"],
    span: [...(defaultSchema.attributes?.span || []), "className"],
    pre: [...(defaultSchema.attributes?.pre || []), "className"],
    div: [...(defaultSchema.attributes?.div || []), "className"],
  },
};

interface MarkdownViewProps {
  content: string;
  className?: string;
}

export function MarkdownView({ content, className }: MarkdownViewProps) {
  const headingIdsByLine = markdownHeadingIdsByLine(content);

  function headingId(children: React.ReactNode, node: unknown, line?: number) {
    return headingIdsByLine.get(line ?? -1) ?? slugifyHeading(nodeText(children) || hastNodeText(node));
  }

  return (
    <div
      className={cn(
        "typeset typeset-docs max-w-none",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeRaw,
          [rehypeSanitize, sanitizeSchema],
          [rehypeHighlight, { detectMissing: true, ignoreMissing: true }],
        ]}
        components={{
          h2: ({ children, node, ...props }) => (
            <h2 {...props} id={headingId(children, node, node?.position?.start.line)}>
              {children}
            </h2>
          ),
          h3: ({ children, node, ...props }) => (
            <h3 {...props} id={headingId(children, node, node?.position?.start.line)}>
              {children}
            </h3>
          ),
          table: ({ children, ...props }) => (
            <div className="typeset-scroll">
              <table {...props}>{children}</table>
            </div>
          ),
          img: ({ node: _node, ...props }) => <MarkdownImage key={props.src} {...props} />,
        }}
      >
        {content || ""}
      </ReactMarkdown>
    </div>
  );
}

function MarkdownImage({ alt, src, ...props }: ComponentPropsWithoutRef<"img">) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const description = alt?.trim() || "文章图片";

  if (failed) {
    return (
      <span
        role="group"
        aria-label={`${description}加载失败`}
        className="my-2 inline-flex max-w-full flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border bg-muted px-3 py-2 text-sm text-muted-foreground"
      >
        <span className="min-w-0 break-words">图片暂时无法加载：{description}</span>
        <button
          type="button"
          className="font-medium text-foreground underline-offset-4 hover:underline"
          onClick={() => {
            setAttempt((value) => value + 1);
            setFailed(false);
          }}
        >
          重新加载
        </button>
        {src && (
          <a href={src} target="_blank" rel="noopener noreferrer" className="font-medium text-foreground underline-offset-4 hover:underline">
            打开原图
          </a>
        )}
      </span>
    );
  }

  return (
    <img
      key={attempt}
      {...props}
      src={src}
      alt={description}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      onLoad={(event) => {
        if (!event.currentTarget.naturalWidth || !event.currentTarget.naturalHeight) setFailed(true);
      }}
    />
  );
}

function nodeText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join("");
  if (node && typeof node === "object" && "props" in node) {
    return nodeText((node as { props?: { children?: React.ReactNode } }).props?.children);
  }
  return "";
}

function hastNodeText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  if ("value" in node && typeof node.value === "string") return node.value;
  if ("children" in node && Array.isArray(node.children)) return node.children.map(hastNodeText).join("");
  return "";
}
