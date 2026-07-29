import { createDb } from "./client";
import { users, topics, replies, sensitiveWords, tabs, zones } from "./schema/index";
import { sql } from "drizzle-orm";
import bcryptjs from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { loadRootEnv } from "./load-env";

loadRootEnv();

const defaultSensitiveWords = [
  { word: "科学上网", category: "circumvention" },
  { word: "VPN", category: "circumvention" },
  { word: "机场", category: "circumvention" },
  { word: "翻墙", category: "circumvention" },
];

async function seed() {
  const db = createDb() as any;

  const existingUsers = await db.select({ id: users.id }).from(users).limit(1);

  if (existingUsers.length === 0) {
    const adminPass = await bcryptjs.hash("admin123", 10);
    const userPass = await bcryptjs.hash("user1234", 10);

    const [admin] = await db
      .insert(users)
      .values({
        loginname: "admin",
        pass: adminPass,
        email: "admin@cnodejs.org",
        avatar: "",
        active: true,
        score: 100,
        topicCount: 0,
        replyCount: 0,
        accessToken: uuidv4(),
      })
      .returning();

    console.log("seed: created admin user, id=", admin?.id);

    const [user] = await db
      .insert(users)
      .values({
        loginname: "testuser",
        pass: userPass,
        email: "test@cnodejs.org",
        avatar: "",
        active: true,
        score: 15,
        topicCount: 1,
        replyCount: 2,
        accessToken: uuidv4(),
      })
      .returning();

    console.log("seed: created testuser, id=", user?.id);

    const [topic] = await db
      .insert(topics)
      .values({
        title: "欢迎使用 cnode-next",
        content: "这是一个测试话题,支持 **Markdown** 和 @提及。",
        authorId: admin!.id,
        tab: "share",
        top: true,
        good: true,
      })
      .returning();

    console.log("seed: created topic, id=", topic?.id);

    const [reply] = await db
      .insert(replies)
      .values({
        content: "测试回复 @admin 你好!",
        topicId: topic!.id,
        authorId: user!.id,
      })
      .returning();

    console.log("seed: created reply, id=", reply?.id);
  } else {
    console.log("seed: existing users found; skipped demo users/topics/replies");
  }

  for (const item of defaultSensitiveWords) {
    await db
      .insert(sensitiveWords)
      .values({ ...item, createAt: new Date() })
      .onConflictDoNothing();
  }

  console.log("seed: ensured default sensitive words, count=", defaultSensitiveWords.length);

  await db
    .insert(tabs)
    .values([
      { key: "share", label: "分享", visible: true, sortOrder: 1 },
      { key: "ask", label: "问答", visible: true, sortOrder: 2 },
      { key: "job", label: "招聘", visible: true, sortOrder: 3 },
      { key: "good", label: "精华", visible: true, sortOrder: 4 },
    ])
    .onConflictDoUpdate({
      target: tabs.key,
      set: {
        label: sql`excluded.label`,
        sortOrder: sql`excluded.sort_order`,
        updateAt: new Date(),
      },
    });
  console.log("seed: ensured tabs (visible values preserved on existing rows)");

  await db
    .insert(zones)
    .values([
      { slug: "jobs", name: "招聘", description: "Node.js 招聘信息专区", icon: "briefcase", visible: false, sortOrder: 1 },
    ])
    .onConflictDoUpdate({
      target: zones.slug,
      set: {
        name: sql`excluded.name`,
        description: sql`excluded.description`,
        icon: sql`excluded.icon`,
        sortOrder: sql`excluded.sort_order`,
        updateAt: new Date(),
      },
    });
  console.log("seed: ensured zones (visible values preserved on existing rows)");

  console.log("seed: done");
  process.exit(0);
}

seed().catch((err) => {
  console.error("seed error:", err);
  process.exit(1);
});
