## 1. MVP：消息目标链接已读行为

- [x] 1.1 在 `/my/messages` 的未读消息关联话题 `Link` 点击时启动现有单条标记已读 action，并保持默认 React Router 导航
- [x] 1.2 保持作者头像、用户名和已读消息话题链接为纯导航，不发送单条标记已读请求

## 2. 功能完整：回归与发布验证

- [x] 2.1 增加 Web 路由测试，覆盖未读目标链接启动 mutation 并导航、作者链接仅导航、已读目标链接仅导航
- [x] 2.2 运行消息页专项测试、Web 测试、lint、typecheck 和 OpenSpec strict validate；确认无 API、数据库、文档、响应式、主题、键盘、焦点、空态、错误态、pending 态或设计系统变更
- [x] 2.3 复核 proposal、design、spec 和实现一致，确认变更可归档
