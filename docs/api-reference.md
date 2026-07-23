# API Reference

本文档描述 CNode API v1 契约,与 nodeclub `api_router_v1.js` 对齐。

## 认证

API 请求通过 `accesstoken` 参数认证 (query 或 body):

```
GET /api/v1/topics?accesstoken=xxx
POST /api/v1/topics { "accesstoken": "xxx", ... }
```

## 端点

### 话题

#### GET /api/v1/topics

- Query: `page`, `limit`, `tab`, `mdrender`
- Response: `{ success: true, data: TopicDTO[] }`

#### GET /api/v1/topic/:id

- Query: `mdrender`, `accesstoken`
- Response: `{ success: true, data: FullTopicDTO }`
- 包含 `replies[]`, `author`, `is_collect`, `is_uped`

#### POST /api/v1/topics

- Body: `accesstoken`, `title`, `tab`, `content`
- Response: `{ success: true, topic_id }`

#### POST /api/v1/topics/update

- Body: `accesstoken`, `topic_id`, `title`, `tab`, `content`

### 用户

#### GET /api/v1/user/:loginname

- Response: `{ success: true, data: UserDTO }`
- 包含 `recent_topics` (最近 15 篇) 和 `recent_replies` (最近 5 条)

#### POST /api/v1/accesstoken

- Body: `accesstoken`
- Response: `{ success: true, loginname, avatar_url, id }`

### 消息

#### GET /api/v1/messages

- Query: `mdrender`, `accesstoken`
- Response: `{ success: true, data: { has_read_messages, hasnot_read_messages } }`

#### GET /api/v1/message/count

- Query: `accesstoken`
- Response: `{ success: true, data: count }`

#### POST /api/v1/message/mark_all

- Response: `{ success: true, marked_msgs: [{ id }] }`

#### POST /api/v1/message/mark_one/:msg_id

- Response: `{ success: true, marked_msg_id }`

### 回复

#### POST /api/v1/topic/:topic_id/replies

- Body: `accesstoken`, `content`, `reply_id`
- Response: `{ success: true, reply_id }`

#### POST /api/v1/reply/:reply_id/ups

- Response: `{ success: true, action: 'up' | 'down' }`

### 收藏

#### POST /api/v1/topic_collect/collect

- Body: `accesstoken`, `topic_id`

#### POST /api/v1/topic_collect/de_collect

- Body: `accesstoken`, `topic_id`

#### GET /api/v1/topic_collect/:loginname

- Response: `{ success: true, data: TopicDTO[] }`

## DTO 定义

### TopicDTO

`id, author_id, tab, content, title, last_reply_at, good, top, reply_count, visit_count, create_at, author { loginname, avatar_url }`

### UserDTO

`loginname, avatar_url, githubUsername, create_at, score, recent_topics[], recent_replies[]`

## 注意事项

- API 返回的 content 必须先经过 `linkUsers` (@username → 链接化) 再 markdown 渲染
- 消息列表的 reply 字段必须包含 `id, content, ups, create_at`
- message/count 返回 `{ success, data }` 格式,不是 `{ count }`
