import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import {
  buildActiveMail,
  buildAtNotifyMail,
  buildReplyNotifyMail,
  buildResetPassMail,
} from "./mail-template";

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  if (!host) {
    const message = "[mail] SMTP_HOST not set";
    if (process.env.CNODE_ENV === "development") {
      console.log(`${message}, skipping email in development`);
      return null;
    }
    throw new Error(message);
  }

  const port = Number(process.env.SMTP_PORT) || 25;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  transporter = nodemailer.createTransport({
    host,
    port,
    auth: user ? { user, pass } : undefined,
    ignoreTLS: true,
  } as any);

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
  await sendMail({
    from: "cnode@localhost",
    to: email,
    ...(await buildActiveMail(key)),
  });
}

export async function sendResetPassMail(email: string, key: string) {
  await sendMail({
    from: "cnode@localhost",
    to: email,
    ...(await buildResetPassMail(key)),
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
    ...(await buildReplyNotifyMail(topicTitle, replyContent, topicUrl)),
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
    ...(await buildAtNotifyMail(topicTitle, replyContent, topicUrl)),
  });
}
