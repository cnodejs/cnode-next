# Migration Guide

本文档描述从 nodeclub (MongoDB) 迁移到 cnode-next (PostgreSQL) 的数据映射和行为差异。

## 数据映射

### ObjectId → BIGINT

MongoDB 的 ObjectId 转为 PostgreSQL 的 BIGINT 自增 ID。老链接 (`/topic/<24字符hex>`) 将 404,不做重定向 (可接受)。

### 字段类型映射

| MongoDB           | PostgreSQL       |
| ----------------- | ---------------- |
| ObjectId          | BIGINT (自增)    |
| Date              | TIMESTAMP        |
| Boolean           | BOOLEAN          |
| Number (整数)     | INTEGER          |
| [ObjectId] (数组) | 联表 (reply_ups) |

### reply.ups[] → reply_ups 联表

MongoDB 的 Reply.ups 是 ObjectId 数组,迁移时拆为 `reply_ups` 联表,每行一条 (reply_id, user_id)。

### 密码 hash

nodeclub 用 bcryptjs (cost=10) hash 密码。cnode-next 用同样的参数,老 hash 可直接验证,用户无需重设密码。

## 行为差异 (新项目修正的 bug)

### 积分计数器

nodeclub 发帖时 `topic_count +1`,但 egg-cnode 错误地调用 `incrementScoreAndReplyCount` (reply_count +1)。新项目用两个独立函数:

- 发帖: `incrementScoreAndTopicCount(userId, 5, 1)`
- 回复: `incrementScoreAndReplyCount(userId, 5, 1)`

### GitHub OAuth 两段式流程

nodeclub 支持 GitHub 登录时选择"注册新账号"或"关联老账号"。egg-cnode 丢失了这个流程。新项目必须补回。

### API linkUsers

nodeclub API 返回内容前会调用 `at.linkUsers`。egg-cnode 跳过了这步。新项目必须补回。

### reply2 消息

nodeclub 定义了 reply2 消息类型 (回复了你的回复) 但从未发送。新项目必须补回。

### 邮件通知

nodeclub 有 `receive_reply_mail` / `receive_at_mail` 字段但从未检查。新项目必须检查并发邮件。

## 数据核对清单

迁移后验证:

- [ ] 用户数对账
- [ ] 话题数对账
- [ ] 回复数对账
- [ ] 密码 hash 可验证 (抽样登录测试)
- [ ] 回复点赞数对账 (reply_ups 行数 = 原 ups[] 总长)
- [ ] 消息记录数对账
