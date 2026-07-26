## 1. API 分页基础

- [x] 1.1 在 `apps/api/src/routes/admin.ts` 中添加统一分页参数解析逻辑，支持 `page`、`limit`、最大 limit 和 offset 计算。
- [x] 1.2 为分页列表响应统一返回 `data`、`total`、`page`、`limit`。
- [x] 1.3 保持 `/admin/stats`、`/admin/recent-users`、`/admin/recent-topics` 等概览摘要接口不分页。

## 2. 后台列表 API 接入

- [x] 2.1 为 `/admin/topics` 接入分页和 total，保持当前权限与排序语义。
- [x] 2.2 为用户管理相关列表接口接入分页和 total，包括普通用户列表、禁言用户列表或现有用户管理接口。
- [x] 2.3 为 `/admin/audit` 或现有审计日志接口接入分页和 total。
- [x] 2.4 为举报队列接口接入分页和 total，保留状态筛选。
- [x] 2.5 为敏感词管理接口接入分页和 total，保留搜索或分类筛选。
- [x] 2.6 为用户封禁和 IP 封禁列表接口接入分页和 total。

## 3. Web 分页基础

- [x] 3.1 检查 `apps/web/app/components/Pagination.tsx` 是否满足后台表格使用；必要时增加非破坏性可选参数。
- [x] 3.2 为后台页面 loader 统一读取 URL 中的 `page`、`limit` 和筛选参数。
- [x] 3.3 确保分页链接保留当前搜索、状态、分类等筛选参数。

## 4. 后台页面接入

- [x] 4.1 为 `apps/web/app/routes/admin/topics.tsx` 接入分页数据和分页控件。
- [x] 4.2 为 `apps/web/app/routes/admin/users.tsx` 接入分页数据和分页控件。
- [x] 4.3 为 `apps/web/app/routes/admin/audit.tsx` 接入分页数据和分页控件。
- [x] 4.4 为 `apps/web/app/routes/admin/reports.tsx` 接入分页数据和分页控件。
- [x] 4.5 为 `apps/web/app/routes/admin/keywords.tsx` 接入分页数据和分页控件。
- [x] 4.6 为 `apps/web/app/routes/admin/bans.tsx` 接入分页数据和分页控件。

## 5. 验证

- [x] 5.1 补充或更新 API 验证，覆盖默认第一页、指定页、limit 上限、空页稳定结构。
- [x] 5.2 补充或更新 Web 验证，覆盖分页链接保留筛选参数。
- [x] 5.3 运行相关测试或验证脚本，确认后台列表分页行为通过。
- [x] 5.4 运行 `pnpm typecheck`；如被既有 TypeScript 配置问题阻塞，记录阻塞原因和不相关错误范围。
