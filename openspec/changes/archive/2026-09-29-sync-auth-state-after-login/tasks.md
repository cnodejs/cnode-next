## 1. MVP 认证状态同步

- [x] 1.1 调整 `hydrateFromLoader`，使 root loader 的后续认证结果可以同步到 auth store，并避免同一用户重复拉取未读数
- [x] 1.2 在本地登录和 Web 内 GitHub 登录成功后重新验证 root loader，再导航首页

## 2. 完整验证

- [x] 2.1 增加 auth store 后续水合与登录成功 revalidation 的回归测试
- [x] 2.2 运行受影响 Web 测试、typecheck 和 build，并确认 Header 的响应式、主题、键盘与焦点行为未改变
- [x] 2.3 校验 OpenSpec change 及设计图与实现一致，确认可归档
