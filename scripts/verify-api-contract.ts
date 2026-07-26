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

async function postJson(path: string, body: Record<string, unknown> = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}: ${JSON.stringify(json)}`);
  }
  return json as any;
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
  for (const reply of json.data.replies) {
    if (!Array.isArray(reply.ups)) throw new Error("topic.data.replies[].ups must be an array");
    if (typeof reply.is_uped !== "boolean") throw new Error("topic.data.replies[].is_uped must be boolean");
  }
  return json.data;
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

async function verifyWritePaths(topic: any) {
  const token = process.env.API_ACCESS_TOKEN;
  if (!token || process.env.API_WRITE_SMOKE !== "1") {
    console.log("skip write smoke: set API_WRITE_SMOKE=1 and API_ACCESS_TOKEN to enable");
    return;
  }

  const topicId = process.env.API_TEST_TOPIC_ID || String(topic.id);
  const topicJson = await getJson(`/api/v1/topic/${topicId}?accesstoken=${encodeURIComponent(token)}&mdrender=false`);
  required("write.topic.success", topicJson.success);
  const topicData = topicJson.data;

  const updateTopic = await postJson("/api/v1/topics/update", {
    accesstoken: token,
    topic_id: String(topicData.id),
    title: topicData.title,
    tab: topicData.tab || "share",
    content: topicData.content,
  });
  required("write.topics.update.success", updateTopic.success);

  const collectPath = topicData.is_collect ? "/api/v1/topic_collect/de_collect" : "/api/v1/topic_collect/collect";
  const restoreCollectPath = topicData.is_collect ? "/api/v1/topic_collect/collect" : "/api/v1/topic_collect/de_collect";
  const collect = await postJson(collectPath, { accesstoken: token, topic_id: String(topicData.id) });
  required("write.topic_collect.toggle.success", collect.success);
  const restoreCollect = await postJson(restoreCollectPath, { accesstoken: token, topic_id: String(topicData.id) });
  required("write.topic_collect.restore.success", restoreCollect.success);

  const replyId = process.env.API_TEST_REPLY_ID || topicData.replies?.[0]?.id;
  if (!replyId) {
    console.log("skip reply edit/up smoke: no API_TEST_REPLY_ID and topic has no replies");
    return;
  }

  const replyJson = await getJson(`/api/v1/reply/${replyId}?accesstoken=${encodeURIComponent(token)}`);
  if (replyJson.success) {
    const editReply = await postJson(`/api/v1/reply/${replyId}/edit`, {
      accesstoken: token,
      content: replyJson.data.content,
    });
    required("write.reply.edit.success", editReply.success);
  } else {
    console.log("skip reply edit smoke: token user cannot edit selected reply");
  }

  const up = await postJson(`/api/v1/reply/${replyId}/ups`, { accesstoken: token });
  if (up.success) {
    const down = await postJson(`/api/v1/reply/${replyId}/ups`, { accesstoken: token });
    required("write.reply.ups.restore.success", down.success);
  } else {
    console.log(`skip reply ups restore: ${up.error_msg || "up failed"}`);
  }
}

async function main() {
  const topic = await verifyTopics();
  const fullTopic = await verifyTopic(String(topic.id));
  await verifyUser(topic.author.loginname);
  await verifyMessageCount();
  await verifyWritePaths(fullTopic);
  console.log("api contract smoke passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
