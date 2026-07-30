## ADDED Requirements

### Requirement: 发布话题页写作区优先级

发布话题页 SHALL 将 MarkdownEditor 作为页面主任务区域，正文编辑器高度必须高于通用回复编辑器默认高度，提交按钮必须位于清晰的表单操作区。写作类页面的提交型主动作 SHALL 统一右侧对齐。

#### Scenario: 发布页编辑器默认更高

- **WHEN** 用户访问 `/topic/create`
- **THEN** 正文 MarkdownEditor 的可输入区域默认高度 SHALL 明显高于通用默认回复编辑器
- **AND** 用户无需立即手动拖拽即可看到足够的写作空间。

#### Scenario: 发布按钮右侧对齐

- **WHEN** 发布话题表单渲染提交操作
- **THEN** “发布”按钮位于表单底部操作区的右侧或等价主操作位置
- **AND** 不与正文、Turnstile 或辅助说明混在同一视觉层级。

#### Scenario: 编辑内容页面主动作位置一致

- **WHEN** 用户在编辑话题或编辑回复页面修改 Markdown 内容
- **THEN** 保存/提交按钮位于表单底部操作区右侧
- **AND** 取消等辅助按钮不比主提交按钮更突出。
