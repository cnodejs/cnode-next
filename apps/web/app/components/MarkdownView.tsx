import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import { cn } from "~/lib/utils";
import { slugifyHeading } from "~/lib/markdown-headings";

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
  const headingCounts = new Map<string, number>();

  function headingId(children: React.ReactNode) {
    const text = nodeText(children);
    const base = slugifyHeading(text);
    const count = headingCounts.get(base) || 0;
    headingCounts.set(base, count + 1);
    return count ? `${base}-${count + 1}` : base;
  }

  return (
    <div
      className={cn(
        "prose prose-sm max-w-none break-words",
        "prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary",
        "prose-strong:text-foreground prose-code:text-foreground prose-code:bg-muted prose-code:rounded prose-code:px-1 prose-code:py-0.5",
        "prose-pre:bg-muted prose-pre:text-foreground",
        "prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground",
        "prose-ul:text-muted-foreground prose-ol:text-muted-foreground",
        "prose-table:border-border prose-th:text-foreground prose-td:text-muted-foreground",
        "prose-hr:border-border",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          [rehypeSanitize, sanitizeSchema],
          [rehypeHighlight, { detectMissing: true, ignoreMissing: true }],
        ]}
        components={{
          h2: ({ children, ...props }) => (
            <h2 id={headingId(children)} {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 id={headingId(children)} {...props}>
              {children}
            </h3>
          ),
        }}
      >
        {content || ""}
      </ReactMarkdown>
    </div>
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
