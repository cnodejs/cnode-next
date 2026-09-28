import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import { MailDeliveryError, sendActiveMail } from "../src/lib/mail";

const originalEnvironment = { ...process.env };
let output = "";

beforeEach(() => {
  output = "";
  process.env.CNODE_ENV = "production";
  vi.spyOn(process.stdout, "write").mockImplementation(((chunk: string | Uint8Array) => {
    output += String(chunk);
    return true;
  }) as typeof process.stdout.write);
});

afterEach(() => {
  vi.restoreAllMocks();
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnvironment)) delete process.env[key];
  }
  Object.assign(process.env, originalEnvironment);
});

describe("mail failure boundaries", () => {
  test("classifies template errors without logging mail content", async () => {
    process.env.CNODE_WEB_BASE_URL = "file:///invalid";
    await expect(sendActiveMail("private@example.com", "private-key")).rejects.toEqual(
      expect.objectContaining<Partial<MailDeliveryError>>({
        name: "MailDeliveryError",
        stage: "template",
      }),
    );
    expect(output).toContain('"event_name":"mail.template.failed"');
    expect(output).toContain('"mail.stage":"template"');
    expect(output).not.toContain("private@example.com");
    expect(output).not.toContain("private-key");
  });

  test("classifies missing SMTP as a send-stage error", async () => {
    process.env.CNODE_WEB_BASE_URL = "https://example.com";
    delete process.env.SMTP_HOST;
    await expect(sendActiveMail("private@example.com", "private-key")).rejects.toEqual(
      expect.objectContaining<Partial<MailDeliveryError>>({
        name: "MailDeliveryError",
        stage: "smtp",
      }),
    );
    expect(output).toContain('"event_name":"mail.send.failed"');
    expect(output).toContain('"mail.stage":"smtp"');
    expect(output).not.toContain("private@example.com");
    expect(output).not.toContain("private-key");
  });
});
