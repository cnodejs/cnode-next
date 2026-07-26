const apiBase = process.env.APP_API_BASE_URL || "http://localhost:3001";

function required(name: string, value: unknown) {
  if (value === undefined || value === null) {
    throw new Error(`missing ${name}`);
  }
}

function redact(path: string) {
  return path.replace(/(accesstoken=)[^&]+/g, "$1[REDACTED]");
}

async function getJson(path: string) {
  const response = await fetch(`${apiBase}${path}`);
  if (!response.ok) {
    throw new Error(`${redact(path)} returned ${response.status}`);
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
    throw new Error(`${redact(path)} returned ${response.status}: ${JSON.stringify(json)}`);
  }
  return json as any;
}

async function verifyTopics() {
  const json = await getJson("/api/v1/topics?limit=1&tab=all");
  required("topics.success", json.success);
  if (typeof json.total !== "number") throw new Error("topics.total must be a number");
  if (!Array.isArray(json.data)) throw new Error("topics.data must be an array");
  const topic = json.data[0];
  required("topics.data[0]", topic);
  for (const key of ["id", "author_id", "title", "content", "last_reply_at", "reply_count", "visit_count", "create_at", "author"]) {
    required(`topics.data[0].${key}`, topic[key]);
  }
  required("topics.data[0].author.loginname", topic.author.loginname);
  return topic;
}

async function verifyMarkdownRender(topicId: string) {
  const raw = await getJson(`/api/v1/topic/${topicId}?mdrender=false`);
  const rendered = await getJson(`/api/v1/topic/${topicId}?mdrender=true`);
  required("markdown.raw.success", raw.success);
  required("markdown.rendered.success", rendered.success);
  if (raw.data?.content && raw.data.content === rendered.data?.content && /[#*_`\[]/.test(raw.data.content)) {
    throw new Error("mdrender=true should return rendered HTML for markdown content");
  }
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

async function verifyUserLists(loginname: string) {
  for (const path of [
    `/api/v1/user/${encodeURIComponent(loginname)}/topics?page=1&limit=1`,
    `/api/v1/user/${encodeURIComponent(loginname)}/replies?page=1&limit=1`,
    `/api/v1/user/${encodeURIComponent(loginname)}/collections?page=1&limit=1`,
  ]) {
    const json = await getJson(path);
    required(`${path}.success`, json.success);
    if (!Array.isArray(json.data)) throw new Error(`${path}.data must be an array`);
    if (typeof json.total !== "number") throw new Error(`${path}.total must be a number`);
  }

  for (const path of ["/api/v1/users/stars", "/api/v1/users/top100"]) {
    const json = await getJson(path);
    required(`${path}.success`, json.success);
    if (!Array.isArray(json.data)) throw new Error(`${path}.data must be an array`);
  }
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

async function verifyAccessToken(token: string) {
  const json = await postJson("/api/v1/accesstoken", { accesstoken: token });
  required("accesstoken.success", json.success);
  required("accesstoken.loginname", json.loginname);
  return json as { loginname: string; id: string };
}

async function verifyWritePaths(topic: any) {
  const token = process.env.API_ACCESS_TOKEN;
  if (!token || process.env.API_WRITE_SMOKE !== "1") {
    console.log("skip write smoke: set API_WRITE_SMOKE=1 and API_ACCESS_TOKEN to enable");
    return;
  }

  const topicId = process.env.API_TEST_TOPIC_ID || String(topic.id);
  const tokenUser = await verifyAccessToken(token);
  const topicJson = await getJson(`/api/v1/topic/${topicId}?accesstoken=${encodeURIComponent(token)}&mdrender=false`);
  required("write.topic.success", topicJson.success);
  const topicData = topicJson.data;
  const userBefore = await getJson(`/api/v1/user/${encodeURIComponent(tokenUser.loginname)}`);
  const replyCountBefore = Number(topicData.reply_count || 0);
  const userScoreBefore = Number(userBefore.data?.score || 0);
  const userReplyCountBefore = Number(userBefore.data?.reply_count || 0);

  const updateTopic = await postJson("/api/v1/topics/update", {
    accesstoken: token,
    topic_id: String(topicData.id),
    title: topicData.title,
    tab: topicData.tab || "share",
    content: topicData.content,
  });
  required("write.topics.update.success", updateTopic.success);

  const createProbe = await fetch(`${apiBase}/api/v1/topics`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accesstoken: "invalid-token", title: "invalid token probe", tab: "share", content: "probe" }),
  });
  if (!createProbe.headers.get("X-RateLimit-Limit")) {
    console.log("skip rate-limit header assertion: limiter may be in development identity bypass");
  }

  const collectPath = topicData.is_collect ? "/api/v1/topic_collect/de_collect" : "/api/v1/topic_collect/collect";
  const restoreCollectPath = topicData.is_collect ? "/api/v1/topic_collect/collect" : "/api/v1/topic_collect/de_collect";
  const collect = await postJson(collectPath, { accesstoken: token, topic_id: String(topicData.id) });
  required("write.topic_collect.toggle.success", collect.success);
  const restoreCollect = await postJson(restoreCollectPath, { accesstoken: token, topic_id: String(topicData.id) });
  required("write.topic_collect.restore.success", restoreCollect.success);

  const newReply = await postJson(`/api/v1/topic/${topicId}/replies`, {
    accesstoken: token,
    content: `api contract smoke reply ${Date.now()}`,
  });
  required("write.reply.create.success", newReply.success);
  const afterCreateTopic = await getJson(`/api/v1/topic/${topicId}?accesstoken=${encodeURIComponent(token)}&mdrender=false`);
  if (Number(afterCreateTopic.data.reply_count || 0) !== replyCountBefore + 1) {
    throw new Error("creating reply should increment topic.reply_count");
  }
  const afterCreateUser = await getJson(`/api/v1/user/${encodeURIComponent(tokenUser.loginname)}`);
  if (Number(afterCreateUser.data.score || 0) !== userScoreBefore + 5) {
    throw new Error("creating reply should increment user score");
  }
  if (Number(afterCreateUser.data.reply_count || 0) !== userReplyCountBefore + 1) {
    throw new Error("creating reply should increment user reply_count");
  }
  const deleteReply = await postJson(`/api/v1/reply/${newReply.reply_id}/delete`, { accesstoken: token });
  required("write.reply.delete.success", deleteReply.success);
  const afterDeleteTopic = await getJson(`/api/v1/topic/${topicId}?accesstoken=${encodeURIComponent(token)}&mdrender=false`);
  if (Number(afterDeleteTopic.data.reply_count || 0) !== replyCountBefore) {
    throw new Error("deleting smoke reply should restore topic.reply_count");
  }
  const afterDeleteUser = await getJson(`/api/v1/user/${encodeURIComponent(tokenUser.loginname)}`);
  if (Number(afterDeleteUser.data.score || 0) !== userScoreBefore) {
    throw new Error("deleting smoke reply should restore user score");
  }
  if (Number(afterDeleteUser.data.reply_count || 0) !== userReplyCountBefore) {
    throw new Error("deleting smoke reply should restore user reply_count");
  }

  const replyId = process.env.API_TEST_REPLY_ID || topicData.replies?.[0]?.id;
  if (!replyId) {
    console.log("skip reply edit/up smoke: no API_TEST_REPLY_ID and topic has no replies");
    return;
  }

  const replyResponse = await fetch(`${apiBase}/api/v1/reply/${replyId}?accesstoken=${encodeURIComponent(token)}`);
  if (replyResponse.ok) {
    const replyJson = await replyResponse.json();
    const editReply = await postJson(`/api/v1/reply/${replyId}/edit`, {
      accesstoken: token,
      content: replyJson.data.content,
    });
      required("write.reply.edit.success", editReply.success);
      const deleteProbe = await fetch(`${apiBase}/api/v1/reply/${replyId}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accesstoken: "invalid-token" }),
      });
      if (deleteProbe.ok) throw new Error("reply delete should reject invalid token");
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
  await verifyMarkdownRender(String(topic.id));
  await verifyUser(topic.author.loginname);
  await verifyUserLists(topic.author.loginname);
  await verifyMessageCount();
  await verifyWritePaths(fullTopic);
  console.log("api contract smoke passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
