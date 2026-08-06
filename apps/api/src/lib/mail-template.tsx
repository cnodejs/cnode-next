import { render } from "@react-email/render";
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "react-email";
import type { CSSProperties } from "react";

const CNODE_LOGO_LIGHT_PATH = "/cnodejs_light.svg";
const DEFAULT_WEB_BASE_URL = "http://localhost:5173";
const SUMMARY_LIMIT = 600;
const TITLE_LIMIT = 160;

export interface MailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface LayoutProps {
  title: string;
  intro: string;
  actionLabel: string;
  actionUrl: string;
  detailLabel?: string;
  detail?: string;
  logoUrl?: string;
}

const styles: Record<string, CSSProperties> = {
  body: {
    backgroundColor: "#f3f5f4",
    color: "#263238",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', Arial, sans-serif",
    margin: 0,
    padding: "32px 16px",
  },
  button: {
    backgroundColor: "#80bd01",
    borderRadius: "10px",
    color: "#17251f",
    display: "inline-block",
    fontSize: "15px",
    fontWeight: 700,
    lineHeight: 1.2,
    padding: "13px 22px",
    textDecoration: "none",
  },
  buttonSection: { padding: "8px 32px 16px" },
  container: {
    backgroundColor: "#ffffff",
    border: "1px solid #dfe5e1",
    borderRadius: "18px",
    boxShadow: "0 12px 32px rgba(28, 45, 36, 0.08)",
    maxWidth: "600px",
    overflow: "hidden",
    width: "100%",
  },
  detail: {
    backgroundColor: "#f4f8ec",
    borderLeft: "4px solid #80bd01",
    borderRadius: "0 10px 10px 0",
    color: "#263238",
    fontSize: "14px",
    lineHeight: 1.75,
    margin: 0,
    overflowWrap: "anywhere",
    padding: "16px 18px",
    whiteSpace: "pre-line",
    wordBreak: "break-word",
  },
  detailLabel: {
    color: "#617076",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    margin: "0 0 8px",
    textTransform: "uppercase",
  },
  detailSection: { padding: "0 32px 24px" },
  fallbackLabel: {
    color: "#7b8782",
    fontSize: "12px",
    lineHeight: 1.6,
    margin: "0 0 6px",
  },
  footer: {
    backgroundColor: "#f8faf9",
    borderRadius: "0 0 18px 18px",
    borderTop: "1px solid #e7ece9",
    color: "#7b8782",
    fontSize: "12px",
    lineHeight: 1.6,
    padding: "18px 32px",
  },
  header: {
    backgroundColor: "#17251f",
    borderRadius: "18px 18px 0 0",
    padding: "24px 32px",
  },
  heading: {
    color: "#17251f",
    fontSize: "26px",
    lineHeight: 1.35,
    margin: 0,
    overflowWrap: "anywhere",
    wordBreak: "break-word",
  },
  intro: {
    color: "#53615b",
    fontSize: "15px",
    lineHeight: 1.8,
    margin: "16px 0 0",
    overflowWrap: "anywhere",
    wordBreak: "break-word",
  },
  link: {
    color: "#527b00",
    fontSize: "12px",
    lineHeight: 1.6,
    overflowWrap: "anywhere",
    textDecoration: "underline",
    wordBreak: "break-all",
  },
  linkSection: { padding: "8px 32px 32px" },
  logo: { border: 0, display: "block", height: "auto", maxWidth: "100%", width: "120px" },
  main: { padding: "32px 32px 16px" },
  marker: {
    color: "#80bd01",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    margin: "0 0 10px",
  },
  tagline: {
    color: "#d9e5df",
    fontSize: "13px",
    lineHeight: 1.4,
    margin: 0,
    paddingLeft: "14px",
  },
};

function CNodeEmailLayout({
  title,
  intro,
  actionLabel,
  actionUrl,
  detailLabel,
  detail,
  logoUrl,
}: LayoutProps) {
  return (
    <Html lang="zh-CN" dir="ltr">
      <Head />
      <Preview>{`${title} - CNode`}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Row>
              <Column>
                <Img
                  src={logoUrl || absoluteWebUrl(CNODE_LOGO_LIGHT_PATH)}
                  width="120"
                  alt="CNode"
                  style={styles.logo}
                />
              </Column>
              <Column style={styles.tagline}>Node.js 中文技术社区</Column>
            </Row>
          </Section>
          <Section style={styles.main}>
            <Text style={styles.marker}>CNODE NOTIFICATION</Text>
            <Heading as="h1" style={styles.heading}>
              {title}
            </Heading>
            <Text style={styles.intro}>{intro}</Text>
          </Section>
          {detail ? (
            <Section style={styles.detailSection}>
              <Text style={styles.detailLabel}>{detailLabel || "内容摘要"}</Text>
              <Text style={styles.detail}>{detail}</Text>
            </Section>
          ) : null}
          <Section style={styles.buttonSection}>
            <Button href={actionUrl} style={styles.button}>
              {actionLabel}
            </Button>
          </Section>
          <Section style={styles.linkSection}>
            <Text style={styles.fallbackLabel}>如果按钮无法打开，请复制以下链接到浏览器：</Text>
            <Link href={actionUrl} style={styles.link}>
              {actionUrl}
            </Link>
          </Section>
          <Section style={styles.footer}>此邮件由 CNode Next 自动发送，请勿直接回复。</Section>
        </Container>
      </Body>
    </Html>
  );
}

function safeHttpUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new TypeError("Email action URL must be an absolute HTTP(S) URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new TypeError("Email action URL must use HTTP(S)");
  }
  return url.toString();
}

function absoluteWebUrl(path: string, webBaseUrl?: string) {
  const baseUrl = safeHttpUrl(
    webBaseUrl || process.env.CNODE_WEB_BASE_URL || DEFAULT_WEB_BASE_URL,
  ).replace(/\/+$/, "");
  return safeHttpUrl(`${baseUrl}${path.startsWith("/") ? path : `/${path}`}`);
}

function normalizeText(value: string) {
  return value.replace(/\r\n?/g, "\n").trim();
}

function truncate(value: string, limit: number) {
  const characters = Array.from(normalizeText(value));
  return characters.length > limit
    ? `${characters.slice(0, limit).join("")}...`
    : characters.join("");
}

function subjectText(value: string) {
  return truncate(value.replace(/[\r\n]+/g, " "), TITLE_LIMIT);
}

async function renderMail(options: LayoutProps) {
  return render(<CNodeEmailLayout {...options} />);
}

function authUrl(path: string, key: string, webBaseUrl?: string) {
  return safeHttpUrl(`${absoluteWebUrl(path, webBaseUrl)}?key=${encodeURIComponent(key)}`);
}

async function buildAuthMail(options: LayoutProps & { subject: string }): Promise<MailTemplate> {
  const html = await renderMail(options);
  const text = `CNode - ${options.title}\n\n${options.intro}\n\n${options.actionLabel}:\n${options.actionUrl}\n\n此邮件由 CNode Next 自动发送，请勿直接回复。`;
  return { subject: options.subject, html, text };
}

export async function buildActiveMail(key: string, webBaseUrl?: string): Promise<MailTemplate> {
  const actionUrl = authUrl("/active_account", key, webBaseUrl);
  return buildAuthMail({
    subject: "CNode 账号激活",
    title: "激活你的 CNode 账号",
    intro: "欢迎加入 CNode。请点击下方按钮完成账号激活，然后即可登录社区。",
    actionLabel: "激活账号",
    actionUrl,
    logoUrl: absoluteWebUrl(CNODE_LOGO_LIGHT_PATH, webBaseUrl),
  });
}

export async function buildResetPassMail(key: string, webBaseUrl?: string): Promise<MailTemplate> {
  const actionUrl = authUrl("/reset_pass", key, webBaseUrl);
  return buildAuthMail({
    subject: "CNode 密码重置",
    title: "重置你的 CNode 密码",
    intro:
      "我们收到了你的密码重置请求。请点击下方按钮继续设置新密码；如果并非你本人操作，可以忽略此邮件。",
    actionLabel: "重置密码",
    actionUrl,
    logoUrl: absoluteWebUrl(CNODE_LOGO_LIGHT_PATH, webBaseUrl),
  });
}

async function buildCommunityMail(options: {
  kind: "reply" | "mention";
  topicTitle: string;
  replyContent: string;
  topicUrl: string;
}): Promise<MailTemplate> {
  const topicTitle = truncate(options.topicTitle, TITLE_LIMIT);
  const detail = truncate(options.replyContent, SUMMARY_LIMIT);
  const actionUrl = safeHttpUrl(options.topicUrl);
  const isReply = options.kind === "reply";
  const title = isReply ? "你的话题有了新回复" : "你在话题中被提及";
  const intro = isReply
    ? `话题《${topicTitle}》收到了新回复。`
    : `你在话题《${topicTitle}》中被 @提及。`;
  const detailLabel = isReply ? "回复摘要" : "提及内容";
  const subjectPrefix = isReply ? "CNode 新回复" : "CNode @提及";
  const html = await renderMail({
    title,
    intro,
    actionLabel: "查看话题",
    actionUrl,
    detailLabel,
    detail,
  });
  const text = `CNode - ${title}\n\n话题：${topicTitle}\n\n${detailLabel}：\n${detail}\n\n查看话题：\n${actionUrl}\n\n此邮件由 CNode Next 自动发送，请勿直接回复。`;
  return { subject: `${subjectPrefix}: ${subjectText(options.topicTitle)}`, html, text };
}

export function buildReplyNotifyMail(topicTitle: string, replyContent: string, topicUrl: string) {
  return buildCommunityMail({ kind: "reply", topicTitle, replyContent, topicUrl });
}

export function buildAtNotifyMail(topicTitle: string, replyContent: string, topicUrl: string) {
  return buildCommunityMail({ kind: "mention", topicTitle, replyContent, topicUrl });
}
