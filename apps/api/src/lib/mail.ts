import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type SMTPTransport from "nodemailer/smtp-transport";

let transporter: Transporter<SMTPTransport.SMTPTransport> | null = null;

function getTransporter(): Transporter<SMTPTransport.SMTPTransport> | null {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  if (!host) {
    console.log("[mail] SMTP_HOST not set, skipping email");
    return null;
  }

  const port = Number(process.env.SMTP_PORT) || 25;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  transporter = nodemailer.createTransport({
    host,
    port,
    auth: user ? { user, pass } : undefined,
    ignoreTLS: true,
  } as SMTPTransport.Options);

  return transporter;
}

interface MailData {
  from: string;
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export async function sendMail(data: MailData) {
  const t = getTransporter();
  if (!t) return;

  const from = process.env.SMTP_FROM || data.from;
  const fromName = process.env.SMTP_FROM_NAME || "CNode";
  const fromHeader = `"${fromName}" <${from}>`;

  for (let i = 1; i <= 5; i++) {
    try {
      await t.sendMail({ ...data, from: fromHeader });
      console.log(`[mail] sent to ${data.to}, subject: ${data.subject}`);
      return;
    } catch (err) {
      console.error(`[mail] send error attempt ${i}/5:`, err);
      if (i === 5) throw err;
    }
  }
}

export async function sendActiveMail(email: string, key: string) {
  const host = process.env.APP_API_BASE_URL || "http://localhost:3001";
  const url = `${host}/auth/local/active_account?key=${key}`;

  await sendMail({
    from: "cnode@localhost",
    to: email,
    subject: "CNode 账号激活",
    text: `请点击以下链接激活你的账号: ${url}`,
    html: `<p>请点击以下链接激活你的账号:</p><p><a href="${url}">${url}</a></p>`,
  });
}

export async function sendResetPassMail(email: string, key: string) {
  const host = process.env.APP_API_BASE_URL || "http://localhost:3001";
  const url = `${host}/reset_pass?key=${key}`;

  await sendMail({
    from: "cnode@localhost",
    to: email,
    subject: "CNode 密码重置",
    text: `请点击以下链接重置密码: ${url}`,
    html: `<p>请点击以下链接重置密码:</p><p><a href="${url}">${url}</a></p>`,
  });
}

export async function sendReplyNotifyMail(
  email: string,
  topicTitle: string,
  replyContent: string,
  topicUrl: string,
) {
  await sendMail({
    from: "cnode@localhost",
    to: email,
    subject: `CNode 新回复: ${topicTitle}`,
    html: `
      <p>你的话题 <a href="${topicUrl}">${topicTitle}</a> 有新回复:</p>
      <blockquote>${replyContent}</blockquote>
      <p><a href="${topicUrl}">查看话题</a></p>
    `,
  });
}

export async function sendAtNotifyMail(
  email: string,
  topicTitle: string,
  replyContent: string,
  topicUrl: string,
) {
  await sendMail({
    from: "cnode@localhost",
    to: email,
    subject: `CNode @提及: ${topicTitle}`,
    html: `
      <p>你在话题 <a href="${topicUrl}">${topicTitle}</a> 中被 @提及:</p>
      <blockquote>${replyContent}</blockquote>
      <p><a href="${topicUrl}">查看话题</a></p>
    `,
  });
}
