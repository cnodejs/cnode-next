# legacy Web URL parity 清单

来源：`nodeclub/web_router.js`

| URL                       | legacy 行为            | cnode-next 状态                                |
| ------------------------- | ---------------------- | ---------------------------------------------- |
| `/`                       | 首页话题列表           | 已实现等价页面                                 |
| `/sitemap.xml`            | XML sitemap            | 已实现 XML 响应                                |
| `/app/download`           | 跳转移动端 README      | 已实现兼容 redirect                            |
| `/signup`                 | 注册页或 GitHub 跳转   | 已实现注册页                                   |
| `/signin`                 | 登录页                 | 已实现等价页面                                 |
| `/active_account`         | 账号激活               | 已实现页面和 API                               |
| `/search_pass`            | 找回密码               | 已实现页面和 API                               |
| `/reset_pass`             | 重置密码               | 已实现页面和 API                               |
| `/user/:name`             | 用户主页               | 已实现等价页面                                 |
| `/setting`                | 用户设置               | 已实现等价页面                                 |
| `/stars`                  | 达人列表               | 已实现等价页面                                 |
| `/users/top100`           | 积分榜                 | 已实现等价页面                                 |
| `/user/:name/collections` | 用户收藏列表           | 已实现页面，分页在本 change 后续任务补齐       |
| `/user/:name/topics`      | 用户话题列表           | 已实现页面，分页在本 change 后续任务补齐       |
| `/user/:name/replies`     | 用户参与列表           | 已实现页面，分页在本 change 后续任务补齐       |
| `/user/set_star`          | 管理员设达人           | 已有 API                                       |
| `/user/cancel_star`       | 管理员取消达人         | 已有 API                                       |
| `/user/:name/block`       | 管理员禁言/解禁        | 已有 API                                       |
| `/user/:name/delete_all`  | 管理员删除用户所有发言 | 已有 API                                       |
| `/user/refresh_token`     | 刷新 accessToken       | 已有 API                                       |
| `/my/messages`            | 消息页                 | 已实现页面，自动已读在本 change 后续任务补齐   |
| `/topic/create`           | 创建话题页             | 已实现页面                                     |
| `/topic/:tid`             | 话题详情               | 已实现页面                                     |
| `/topic/:tid/top`         | 管理员置顶             | 已有 API                                       |
| `/topic/:tid/good`        | 管理员加精             | 已有 API                                       |
| `/topic/:tid/edit`        | 编辑话题               | 已实现页面和 API                               |
| `/topic/:tid/lock`        | 管理员锁定             | 已有 API                                       |
| `/topic/:tid/delete`      | 删除话题               | 已有 API                                       |
| `/topic/collect`          | 收藏话题               | 已有等价 API                                   |
| `/topic/de_collect`       | 取消收藏               | 已有等价 API                                   |
| `/:topic_id/reply`        | 创建回复               | 已有等价 API/Web 行为                          |
| `/reply/:reply_id/edit`   | 编辑回复               | 已实现页面和 API                               |
| `/reply/:reply_id/delete` | 删除回复               | 本 change 后续任务补齐                         |
| `/reply/:reply_id/up`     | 回复点赞               | 已有等价 API/Web 行为                          |
| `/upload`                 | 图片上传               | 已有等价 API/Web 行为                          |
| `/about`                  | 关于页面               | 已实现等价页面                                 |
| `/faq`                    | FAQ 页面               | 已实现等价页面                                 |
| `/getstart`               | 新手入门               | 已实现等价页面                                 |
| `/robots.txt`             | robots 文本            | 已实现 text/plain 响应                         |
| `/api`                    | API 文档页面           | 已实现等价页面                                 |
| `/rss`                    | RSS XML                | 已实现 XML 响应                                |
| `/auth/github`            | GitHub OAuth 发起      | 已实现入口                                     |
| `/auth/github/callback`   | GitHub OAuth 回调      | 已实现，关联老账号流程在本 change 后续任务补齐 |
| `/auth/github/new`        | GitHub 新用户选择页    | 本 change 后续任务补齐                         |
| `/auth/github/create`     | GitHub 新用户创建/绑定 | 本 change 后续任务补齐                         |
| `/search`                 | 搜索                   | 已实现页面                                     |
| `/:name`                  | 生产用户短路径         | 已实现兼容 redirect                            |
