import assert from "node:assert/strict";
import test from "node:test";
import {
  buildActiveMail,
  buildAtNotifyMail,
  buildReplyNotifyMail,
  buildResetPassMail,
} from "../src/lib/mail-template";

const LOGO_URL = "https://static2.cnodejs.org/public/images/cnodejs_light.svg";

function assertBrandedMail(mail: { html: string; text: string }, actionLabel: string, url: string) {
  assert.match(mail.html, /<!doctype html/i);
  assert.ok(mail.html.includes(LOGO_URL));
  assert.ok(mail.html.includes("#80bd01"));
  assert.ok(mail.html.includes('role="presentation"'));
  assert.ok(mail.html.includes("max-width:600px"));
  assert.ok(mail.html.includes(actionLabel));
  assert.ok(mail.html.includes(url.replace(/&/g, "&amp;")));
  assert.ok(mail.text.includes(actionLabel));
  assert.ok(mail.text.includes(url));
  assert.equal(mail.html.includes("<script"), false);
  assert.equal(mail.html.includes("var(--"), false);
}

test("builds branded activation and password reset emails", async () => {
  const activation = await buildActiveMail("a/b c&d", "https://next.cnodejs.org///");
  const activationUrl = "https://next.cnodejs.org/active_account?key=a%2Fb%20c%26d";
  assert.equal(activation.subject, "CNode 账号激活");
  assertBrandedMail(activation, "激活账号", activationUrl);

  const reset = await buildResetPassMail("reset-key", "http://localhost:5173/");
  const resetUrl = "http://localhost:5173/reset_pass?key=reset-key";
  assert.equal(reset.subject, "CNode 密码重置");
  assertBrandedMail(reset, "重置密码", resetUrl);
});

test("builds reply and mention emails with equivalent plain text", async () => {
  const topicUrl = "https://cnodejs.org/topic/42?from=mail";
  const reply = await buildReplyNotifyMail("Node.js 流处理", "第一行\n第二行", topicUrl);
  assert.equal(reply.subject, "CNode 新回复: Node.js 流处理");
  assertBrandedMail(reply, "查看话题", topicUrl);
  assert.ok(reply.html.includes("回复摘要"));
  assert.ok(reply.text.includes("第一行\n第二行"));

  const mention = await buildAtNotifyMail("部署实践", "@alice 请看这里", topicUrl);
  assert.equal(mention.subject, "CNode @提及: 部署实践");
  assertBrandedMail(mention, "查看话题", topicUrl);
  assert.ok(mention.html.includes("提及内容"));
  assert.ok(mention.text.includes("@alice 请看这里"));
});

test("lets React escape untrusted titles, content, and attributes", async () => {
  const title = '<script>alert("title")</script> & discussion';
  const content = '<img src=x onerror="alert(1)">\n<style>body{display:none}</style>';
  const mail = await buildReplyNotifyMail(title, content, "https://cnodejs.org/topic/1?a=1&b=2");

  assert.ok(
    mail.html.includes("&lt;script&gt;alert(&quot;title&quot;)&lt;/script&gt; &amp; discussion"),
  );
  assert.ok(mail.html.includes("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"));
  assert.equal(mail.html.includes("<script>alert"), false);
  assert.equal(mail.html.includes("<img src=x"), false);
  assert.equal(mail.html.includes("<style>body"), false);
  assert.ok(mail.html.includes("a=1&amp;b=2"));
  assert.equal(mail.subject.includes("\n"), false);
  assert.ok(mail.text.includes(title));
});

test("rejects malformed and non-HTTP action URLs", async () => {
  await assert.rejects(
    buildReplyNotifyMail("topic", "reply", "javascript:alert(1)"),
    /must use HTTP\(S\)/,
  );
  await assert.rejects(
    buildAtNotifyMail("topic", "reply", "/topic/1"),
    /must be an absolute HTTP\(S\) URL/,
  );
  await assert.rejects(buildActiveMail("key", "file:///tmp/site"), /must use HTTP\(S\)/);
});

test("truncates long content and keeps fluid wrapping styles", async () => {
  const longTitle = "标题".repeat(120);
  const longContent = "内容".repeat(400);
  const longUrl = `https://cnodejs.org/topic/1?value=${"x".repeat(500)}`;
  const mail = await buildReplyNotifyMail(longTitle, longContent, longUrl);

  assert.ok(mail.subject.endsWith("..."));
  assert.ok(mail.text.includes("..."));
  assert.ok(mail.html.includes("overflow-wrap:anywhere"));
  assert.ok(mail.html.includes("word-break:break-all"));
  assert.ok(mail.html.includes("width:100%"));
  assert.equal(mail.html.includes("<link"), false);
  assert.equal(mail.html.includes("javascript:"), false);
});
