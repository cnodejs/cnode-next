import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { appLog, errorType } from "../telemetry/logger";
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
      appLog("mail.skipped", "INFO", { outcome: "skipped" });
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

export type MailFailureStage = "template" | "smtp";

export class MailDeliveryError extends Error {
  constructor(
    readonly stage: MailFailureStage,
    options?: ErrorOptions,
  ) {
    super(`Mail ${stage} failed`, options);
    this.name = "MailDeliveryError";
  }
}

export async function sendMail(data: MailData) {
  let t: Transporter | null;
  try {
    t = getTransporter();
  } catch (error) {
    appLog("mail.send.failed", "ERROR", {
      outcome: "failed",
      "mail.stage": "smtp",
      "error.type": errorType(error),
    });
    throw new MailDeliveryError("smtp", { cause: error });
  }
  if (!t) return;

  const from = process.env.SMTP_FROM || data.from;
  const fromName = process.env.SMTP_FROM_NAME || "CNode";
  const fromHeader = `"${fromName}" <${from}>`;

  for (let i = 1; i <= 5; i++) {
    try {
      await t.sendMail({ ...data, from: fromHeader });
      appLog("mail.sent", "INFO", { outcome: "sent", attempt: i });
      return;
    } catch (err) {
      appLog("mail.send.failed", "ERROR", {
        outcome: "failed",
        attempt: i,
        "mail.stage": "smtp",
        "error.type": errorType(err),
      });
      if (i === 5) throw new MailDeliveryError("smtp", { cause: err });
    }
  }
}

async function buildAndSend(to: string, build: () => Promise<Omit<MailData, "from" | "to">>) {
  let content: Omit<MailData, "from" | "to">;
  try {
    content = await build();
  } catch (error) {
    appLog("mail.template.failed", "ERROR", {
      outcome: "failed",
      "mail.stage": "template",
      "error.type": errorType(error),
    });
    throw new MailDeliveryError("template", { cause: error });
  }
  await sendMail({ from: "cnode@localhost", to, ...content });
}

export async function sendActiveMail(email: string, key: string) {
  await buildAndSend(email, () => buildActiveMail(key));
}

export async function sendResetPassMail(email: string, key: string) {
  await buildAndSend(email, () => buildResetPassMail(key));
}

export async function sendReplyNotifyMail(
  email: string,
  topicTitle: string,
  replyContent: string,
  topicUrl: string,
) {
  await buildAndSend(email, () => buildReplyNotifyMail(topicTitle, replyContent, topicUrl));
}

export async function sendAtNotifyMail(
  email: string,
  topicTitle: string,
  replyContent: string,
  topicUrl: string,
) {
  await buildAndSend(email, () => buildAtNotifyMail(topicTitle, replyContent, topicUrl));
}
