import { expect, test } from "vitest";
import {
  buildActiveMail,
  buildAtNotifyMail,
  buildReplyNotifyMail,
  buildResetPassMail,
} from "../src/lib/mail-template";

function assertBrandedMail(mail: { html: string; text: string }, actionLabel: string, url: string, logoUrl = "http://localhost:5173/cnodejs_light.svg") {
  expect(mail.html).toMatch(/<!doctype html/i);
  expect(mail.html).toContain(logoUrl);
  expect(mail.html).toContain("#80bd01");
  expect(mail.html).toContain('role="presentation"');
  expect(mail.html).toContain("max-width:600px");
  expect(mail.html).toContain(actionLabel);
  expect(mail.html).toContain(url.replace(/&/g, "&amp;"));
  expect(mail.text).toContain(actionLabel);
  expect(mail.text).toContain(url);
  expect(mail.html.includes("<script")).toBe(false);
  expect(mail.html.includes("var(--")).toBe(false);
}

test("builds branded activation and password reset emails", async () => {
  const activation = await buildActiveMail("a/b c&d", "https://next.cnodejs.org///");
  const activationUrl = "https://next.cnodejs.org/active_account?key=a%2Fb%20c%26d";
  expect(activation.subject).toBe("CNode 账号激活");
  assertBrandedMail(activation, "激活账号", activationUrl, "https://next.cnodejs.org/cnodejs_light.svg");

  const reset = await buildResetPassMail("reset-key", "http://localhost:5173/");
  const resetUrl = "http://localhost:5173/reset_pass?key=reset-key";
  expect(reset.subject).toBe("CNode 密码重置");
  assertBrandedMail(reset, "重置密码", resetUrl);
});

test("builds reply and mention emails with equivalent plain text", async () => {
  const topicUrl = "https://cnodejs.org/topic/42?from=mail";
  const reply = await buildReplyNotifyMail("Node.js 流处理", "第一行\n第二行", topicUrl);
  expect(reply.subject).toBe("CNode 新回复: Node.js 流处理");
  assertBrandedMail(reply, "查看话题", topicUrl);
  expect(reply.html).toContain("回复摘要");
  expect(reply.text).toContain("第一行\n第二行");

  const mention = await buildAtNotifyMail("部署实践", "@alice 请看这里", topicUrl);
  expect(mention.subject).toBe("CNode @提及: 部署实践");
  assertBrandedMail(mention, "查看话题", topicUrl);
  expect(mention.html).toContain("提及内容");
  expect(mention.text).toContain("@alice 请看这里");
});

test("lets React escape untrusted titles, content, and attributes", async () => {
  const title = '<script>alert("title")</script> & discussion';
  const content = '<img src=x onerror="alert(1)">\n<style>body{display:none}</style>';
  const mail = await buildReplyNotifyMail(title, content, "https://cnodejs.org/topic/1?a=1&b=2");

  expect(mail.html).toContain("&lt;script&gt;alert(&quot;title&quot;)&lt;/script&gt; &amp; discussion");
  expect(mail.html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  expect(mail.html.includes("<script>alert")).toBe(false);
  expect(mail.html.includes("<img src=x")).toBe(false);
  expect(mail.html.includes("<style>body")).toBe(false);
  expect(mail.html).toContain("a=1&amp;b=2");
  expect(mail.subject.includes("\n")).toBe(false);
  expect(mail.text).toContain(title);
});

test("rejects malformed and non-HTTP action URLs", async () => {
  await expect(buildReplyNotifyMail("topic", "reply", "javascript:alert(1)")).rejects.toThrow(/must use HTTP\(S\)/);
  await expect(buildAtNotifyMail("topic", "reply", "/topic/1")).rejects.toThrow(/must be an absolute HTTP\(S\) URL/);
  await expect(buildActiveMail("key", "file:///tmp/site")).rejects.toThrow(/must use HTTP\(S\)/);
});

test("truncates long content and keeps fluid wrapping styles", async () => {
  const longTitle = "标题".repeat(120);
  const longContent = "内容".repeat(400);
  const longUrl = `https://cnodejs.org/topic/1?value=${"x".repeat(500)}`;
  const mail = await buildReplyNotifyMail(longTitle, longContent, longUrl);

  expect(mail.subject.endsWith("...")).toBe(true);
  expect(mail.text).toContain("...");
  expect(mail.html).toContain("overflow-wrap:anywhere");
  expect(mail.html).toContain("word-break:break-all");
  expect(mail.html).toContain("width:100%");
  expect(mail.html.includes("<link")).toBe(false);
  expect(mail.html.includes("javascript:")).toBe(false);
});
