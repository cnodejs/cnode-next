import {
  buildActiveMail,
  buildAtNotifyMail,
  buildReplyNotifyMail,
  buildResetPassMail,
} from "../src/lib/mail-template";

const templates = await Promise.all([
  buildActiveMail("smoke-key", "https://example.com"),
  buildResetPassMail("smoke-key", "https://example.com"),
  buildReplyNotifyMail("Smoke topic", "Smoke reply", "https://example.com/topic/1"),
  buildAtNotifyMail("Smoke topic", "Smoke mention", "https://example.com/topic/1"),
]);

if (templates.some((template) => !template.subject || !template.html || !template.text)) {
  throw new Error("Mail template smoke failed");
}
