## ADDED Requirements

### Requirement: 独立用户治理动作确认

后台用户列表和公开用户页中的 block、mute、角色变更、重置密码及删除所有发言 SHALL 使用与风险相称的确认界面。确认 MUST 使用用户可读文案区分“屏蔽用户内容”与“禁言用户”，并 MUST NOT 改变既有权限、状态语义或审计规则。

#### Scenario: 确认屏蔽用户内容

- **WHEN** admin 对目标用户触发 block
- **THEN** 确认界面 MUST 显示目标用户并说明其公开内容将不再可见
- **AND** MUST 说明该动作不等同于禁言
- **AND** 用户取消时不得改变目标用户的 block 或 mute 状态。

#### Scenario: 确认禁言用户

- **WHEN** admin 对目标用户触发 mute
- **THEN** 确认界面 MUST 显示目标用户并说明其将无法新增话题和回复
- **AND** MUST 说明已有内容不会仅因 mute 自动隐藏
- **AND** 用户取消时不得改变目标用户的 mute 或 block 状态。

#### Scenario: 确认角色变更

- **WHEN** admin 授予或撤销目标用户角色
- **THEN** 确认界面 MUST 显示目标用户、当前角色和变更后的角色
- **AND** MUST 说明该角色变化影响的管理访问范围
- **AND** 不得因确认界面而允许当前操作者执行原本无权限的角色变更。

#### Scenario: 确认重置密码

- **WHEN** admin 触发目标用户密码重置
- **THEN** 确认界面 MUST 说明目标用户及现有凭证将受影响
- **AND** 取消 MUST 不发送重置请求
- **AND** 新凭证或一次性结果 MUST 仅按既有安全行为在成功后展示。

#### Scenario: 确认删除所有发言

- **WHEN** admin 从后台用户列表或公开用户页触发删除目标用户所有发言
- **THEN** 确认界面 MUST 显示目标用户并明确说明将影响其全部话题和回复
- **AND** 最终确认 MUST 使用 destructive 语义
- **AND** 取消 MUST 不修改用户、话题、回复或计数状态。

#### Scenario: 恢复性操作保持明确

- **WHEN** admin 对已 block 或 mute 的用户执行 unblock 或 unmute
- **THEN** 页面 MUST 使用“恢复内容可见”或“解除禁言”等对应文案
- **AND** 操作结果 MUST 只改变既有业务规则定义的目标状态
- **AND** 不得把 unblock 与 unmute 合并为一个含义不明的恢复动作。

### Requirement: 用户治理反馈与上下文保留

用户治理动作 SHALL 提供可见且可播报的 pending、success 和 error 状态；请求进行中 MUST 防止重复提交。动作完成或失败后，后台用户列表 MUST 保留当前搜索、筛选和分页上下文，公开用户页 MUST 保留当前用户上下文。

#### Scenario: 搜索结果中治理成功

- **WHEN** admin 在带搜索或筛选条件的用户列表中确认治理动作且请求成功
- **THEN** 页面 MUST 更新目标用户的可见状态并播报成功结果
- **AND** URL、搜索词、筛选值和页码 MUST 保持不变
- **AND** 页面 MUST NOT 返回未筛选的默认用户列表。

#### Scenario: 用户治理进行中

- **WHEN** admin 已确认用户治理动作且请求尚未完成
- **THEN** 确认控件 MUST 显示进行中状态并禁止重复提交
- **AND** 页面 MUST 播报操作正在进行
- **AND** 不得提前显示目标状态已改变。

#### Scenario: 用户治理失败

- **WHEN** block、mute、角色变更、密码重置或删除所有发言失败
- **THEN** 页面 MUST 保留操作前的用户状态和当前列表上下文
- **AND** 展示并播报可理解的错误
- **AND** 用户 MUST 能在修正条件后重试。

#### Scenario: 公开用户页治理完成

- **WHEN** admin 在公开用户页执行治理动作并成功
- **THEN** 页面 MUST 保持在同一用户页并更新可见治理状态
- **AND** 若动作使内容列表为空，页面 MUST 展示与该状态匹配的 Empty 说明
- **AND** 不得将无内容误报为加载失败。

### Requirement: 用户批量治理确认与结果

批量解除禁言、批量恢复内容可见及其他批量用户治理动作 SHALL 在提交前展示目标数量和动作范围；执行后 MUST 分别报告成功、跳过和失败数量，并保持当前列表上下文。

#### Scenario: 确认批量解除禁言

- **WHEN** admin 选择多个用户并触发批量解除禁言
- **THEN** 确认界面 MUST 显示所选用户数量并说明仅取消 mute 状态
- **AND** MUST 说明不会取消 block 或恢复已删除内容
- **AND** 取消时所选用户状态 MUST 保持不变。

#### Scenario: 确认批量恢复内容可见

- **WHEN** admin 选择多个用户并触发批量恢复内容可见
- **THEN** 确认界面 MUST 显示所选用户数量并说明仅取消 block 状态
- **AND** MUST 说明不会取消 mute 或恢复已删除内容
- **AND** 取消时所选用户状态 MUST 保持不变。

#### Scenario: 批量用户治理部分失败

- **WHEN** 批量用户治理包含无权限、自操作或其他无法处理的目标
- **THEN** 页面 MUST 展示成功、跳过和失败数量
- **AND** 当前 tab、搜索、筛选和分页 MUST 保持不变
- **AND** 响应反馈 MUST 允许管理员识别需要重新处理的目标范围。
