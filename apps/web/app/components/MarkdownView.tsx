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
          img: ({ alt, ...props }) => <img alt={alt || ""} loading="lazy" decoding="async" {...props} />,
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

function hastNodeText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  if ("value" in node && typeof node.value === "string") return node.value;
  if ("children" in node && Array.isArray(node.children)) return node.children.map(hastNodeText).join("");
  return "";
}
