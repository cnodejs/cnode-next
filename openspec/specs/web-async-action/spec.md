# web-async-action Specification

## Purpose

定义 Web 前端统一异步 mutation 模式，通过 `useAsyncAction` hook 封装 pending 状态、防重复调用和错误处理，替换所有手写 `useState(false)` mutation 状态管理。

## Requirements

### Requirement: useAsyncAction 统一 mutation 模式

`apps/web/app/hooks/use-async-action.ts` SHALL 导出 `useAsyncAction` hook，封装异步 mutation 的 pending 状态、防重复调用和错误处理。hook 签名 SHALL 为：

```typescript
function useAsyncAction<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  opts?: {
    successMessage?: string | ((result: TResult) => string);
    errorMessage?: string | ((error: unknown) => string);
    onSuccess?: (result: TResult) => void;
    onError?: (error: unknown) => void;
  }
): { run: (...args: TArgs) => void; pending: boolean }
```

#### Scenario: 基本 pending 状态

- **WHEN** 组件调用 `run()` 触发异步操作
- **THEN** `pending` 立即变为 `true`
- **AND** 操作完成（成功或失败）后 `pending` 变为 `false`

#### Scenario: 防重复点击

- **WHEN** `pending` 为 `true` 时再次调用 `run()`
- **THEN** 第二次调用直接 return，不执行 `fn`

#### Scenario: 成功时自动 toast

- **WHEN** 配置了 `successMessage` 且 `fn` resolve
- **THEN** 自动调用 `toast.success(message)`
- **AND** 调用 `onSuccess` 回调（如配置）

#### Scenario: 失败时自动 toast

- **WHEN** `fn` reject 或抛出异常
- **THEN** 自动调用 `toast.error(message)`，message 取 `errorMessage` 配置或异常信息
- **AND** 调用 `onError` 回调（如配置）
- **AND** `pending` 变为 `false`

### Requirement: 全量替换手写 mutation 状态

`apps/web/app/routes/` 下所有使用手写 `useState(false)` 管理 mutation pending 状态的文件 SHALL 替换为 `useAsyncAction`。替换范围 SHALL 包括但不限于：`topic.create.tsx`、`topic.$tid.tsx`、`topic.$tid.edit.tsx`、`my.messages.tsx`、`setting.tsx`、`reply.$id.edit.tsx`、`user.$name.tsx`、`signin.tsx`、`signup.tsx`、`reset_pass.tsx`、`search_pass.tsx`、`auth.github.new.tsx`、`admin/mod.tsx`、`admin/bans.tsx`、`admin/keywords.tsx`、`admin/reports.tsx`、`admin/settings.tsx`、`admin/topics.tsx`、`admin/users.tsx`。

#### Scenario: 收藏操作使用 useAsyncAction

- **WHEN** 用户在话题详情页点击"收藏话题"
- **THEN** 按钮立即显示 pending 状态（disabled + 文案变化）
- **AND** 成功后 toast 提示并 revalidate
- **AND** 失败后 toast 显示错误信息

#### Scenario: 标记已读使用 useAsyncAction

- **WHEN** 用户在消息页点击"标记已读"
- **THEN** 操作期间有 pending 反馈（此前无任何状态）
- **AND** 成功后列表局部更新

#### Scenario: grep 检查无遗留手写模式

- **WHEN** 在 `apps/web/app/routes/` 下搜索 `useState(false)` 且上下文为 mutation pending 语义
- **THEN** 无匹配项（`useState(false)` 仅允许用于非 mutation 的 UI 开关，如 dialog open 状态）

### Requirement: useAsyncAction 不替代 useRevalidator

`useAsyncAction` SHALL NOT 内置 revalidate 逻辑。调用方 SHALL 在 `onSuccess` 回调中自行决定是否调用 `useRevalidator().revalidate()`。

#### Scenario: 收藏成功后 revalidate

- **WHEN** 收藏操作成功
- **THEN** `onSuccess` 中调用 `revalidate()` 重跑当前路由 loader
- **AND** `useAsyncAction` 本身不调用 revalidate
