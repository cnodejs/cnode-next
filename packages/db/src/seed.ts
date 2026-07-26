import { createDb } from "./client";
import { users, topics, replies, sensitiveWords } from "./schema/index";
import bcryptjs from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const defaultSensitiveWords = [
  { word: "科学上网", category: "circumvention" },
  { word: "VPN", category: "circumvention" },
  { word: "机场", category: "circumvention" },
  { word: "翻墙", category: "circumvention" },
];

async function seed() {
  const db = createDb() as any;

  const adminPass = await bcryptjs.hash("admin123", 10);
  const userPass = await bcryptjs.hash("user1234", 10);

  await db.delete(users);
  await db.delete(topics);
  await db.delete(replies);

  const admin = await db
    .insert(users)
    .values({
      loginname: "admin",
      pass: adminPass,
      email: "admin@cnodejs.org",
      avatar: "",
      active: 1,
      score: 100,
      topicCount: 0,
      replyCount: 0,
      accessToken: uuidv4(),
    })
    .returning()
    .get();

  console.log("seed: created admin user, id=", admin?.id);

  const user = await db
    .insert(users)
    .values({
      loginname: "testuser",
      pass: userPass,
      email: "test@cnodejs.org",
      avatar: "",
      active: 1,
      score: 15,
      topicCount: 1,
      replyCount: 2,
      accessToken: uuidv4(),
    })
    .returning()
    .get();

  console.log("seed: created testuser, id=", user?.id);

  const topic = await db
    .insert(topics)
    .values({
      title: "欢迎使用 cnode-next",
      content: "这是一个测试话题,支持 **Markdown** 和 @提及。",
      authorId: admin!.id,
      tab: "share",
      top: 1,
      good: 1,
    })
    .returning()
    .get();

  console.log("seed: created topic, id=", topic?.id);

  const reply = await db
    .insert(replies)
    .values({
      content: "测试回复 @admin 你好!",
      topicId: topic!.id,
      authorId: user!.id,
    })
    .returning()
    .get();

  console.log("seed: created reply, id=", reply?.id);

  for (const item of defaultSensitiveWords) {
    await db
      .insert(sensitiveWords)
      .values({ ...item, createAt: new Date().toISOString() })
      .onConflictDoNothing();
  }

  console.log("seed: ensured default sensitive words, count=", defaultSensitiveWords.length);

  console.log("seed: done");
  process.exit(0);
}

seed().catch((err) => {
  console.error("seed error:", err);
  process.exit(1);
});
