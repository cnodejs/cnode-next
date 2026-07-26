const apiBase = process.env.APP_API_BASE_URL || "http://localhost:3001";

function required(name: string, value: unknown) {
  if (value === undefined || value === null) {
    throw new Error(`missing ${name}`);
  }
}

async function getJson(path: string) {
  const response = await fetch(`${apiBase}${path}`);
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }
  return response.json() as Promise<any>;
}

async function verifyTopics() {
  const json = await getJson("/api/v1/topics?limit=1&tab=all");
  required("topics.success", json.success);
  if (!Array.isArray(json.data)) throw new Error("topics.data must be an array");
  const topic = json.data[0];
  required("topics.data[0]", topic);
  for (const key of ["id", "author_id", "title", "content", "last_reply_at", "reply_count", "visit_count", "create_at", "author"]) {
    required(`topics.data[0].${key}`, topic[key]);
  }
  required("topics.data[0].author.loginname", topic.author.loginname);
  return topic;
}

async function verifyTopic(id: string) {
  const json = await getJson(`/api/v1/topic/${id}`);
  required("topic.success", json.success);
  required("topic.data", json.data);
  for (const key of ["id", "author_id", "title", "content", "replies", "author", "is_collect"]) {
    required(`topic.data.${key}`, json.data[key]);
  }
  if (!Array.isArray(json.data.replies)) throw new Error("topic.data.replies must be an array");
}

async function verifyUser(loginname: string) {
  const json = await getJson(`/api/v1/user/${encodeURIComponent(loginname)}`);
  required("user.success", json.success);
  required("user.data", json.data);
  for (const key of ["loginname", "avatar_url", "create_at", "score", "recent_topics", "recent_replies"]) {
    required(`user.data.${key}`, json.data[key]);
  }
  if (!Array.isArray(json.data.recent_topics)) throw new Error("user.data.recent_topics must be an array");
  if (!Array.isArray(json.data.recent_replies)) throw new Error("user.data.recent_replies must be an array");
}

async function verifyMessageCount() {
  const token = process.env.API_ACCESS_TOKEN;
  if (!token) {
    console.log("skip message/count: API_ACCESS_TOKEN not set");
    return;
  }
  const json = await getJson(`/api/v1/message/count?accesstoken=${encodeURIComponent(token)}`);
  required("message.count.success", json.success);
  if (typeof json.data !== "number") throw new Error("message.count.data must be a number");
}

async function main() {
  const topic = await verifyTopics();
  await verifyTopic(String(topic.id));
  await verifyUser(topic.author.loginname);
  await verifyMessageCount();
  console.log("api contract smoke passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
