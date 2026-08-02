## ADDED Requirements

### Requirement: 后台高风险动作保护

后台删除、真实删除、批量删除、确认违规并删除、角色或账号安全变更等不可逆或高影响动作 SHALL 在执行前要求确认。可完整恢复的批量状态治理动作 MAY 立即执行，但仅在页面提供明确、限时且可完成恢复的 undo 时免除事前确认；仅显示成功 toast 不构成 undo。

#### Scenario: 确认不可逆单项操作

- **WHEN** 管理员触发删除内容、重置凭证或其他不可逆单项目标操作
- **THEN** 确认界面 MUST 明确显示动作、目标和主要影响
- **AND** 初始焦点 MUST NOT 落在 destructive 确认按钮上
- **AND** 取消 MUST 不发送 mutation 且焦点返回触发入口。

#### Scenario: 确认批量破坏性操作

- **WHEN** 管理员触发批量删除、批量确认违规或其他会影响多个对象的破坏性操作
- **THEN** 确认界面 MUST 显示动作类型和目标数量
- **AND** 在目标集合可概括时 MUST 显示当前筛选范围或目标摘要
- **AND** 只有最终确认按钮使用 destructive 语义。

#### Scenario: 可恢复批量状态操作提供 undo

- **WHEN** 后台对可完整恢复的批量状态操作选择免除事前确认
- **THEN** 操作成功后 MUST 显示明确的 undo 动作、可撤销对象数量和可用时限
- **AND** 用户在时限内触发 undo MUST 恢复所有成功处理对象的操作前状态
- **AND** 部分失败时 MUST 说明成功、失败和可撤销的对象数量。

#### Scenario: 无可靠 undo 时要求确认

- **WHEN** 某项治理动作无法完整恢复、恢复会覆盖后续更改或 undo 时限无法保证
- **THEN** 页面 MUST 在执行前要求确认
- **AND** 不得以关闭通知、重新加载列表或手动执行相反动作冒充 undo。

### Requirement: 后台治理反馈与列表上下文

后台单项和批量治理动作 SHALL 提供可见且可播报的 pending、success、partial success 和 error 状态。操作完成或失败后，页面 MUST 保留当前 URL 表示的 tab、搜索、筛选、排序和分页上下文。

#### Scenario: 筛选列表中的单项治理成功

- **WHEN** 管理员在筛选后的后台列表执行单项治理并成功
- **THEN** 页面 MUST 更新当前列表中的对象状态
- **AND** URL 中的 tab、搜索、筛选、排序和页码 MUST 保持不变
- **AND** 页面 MUST 播报包含动作结果的成功反馈。

#### Scenario: 批量治理部分成功

- **WHEN** 批量操作仅成功处理部分目标
- **THEN** 页面 MUST 明确展示成功数、失败数和可重试范围
- **AND** 已失败对象 MUST 保持可识别或可重新选择
- **AND** 当前列表和筛选上下文 MUST 不回退到默认状态。

#### Scenario: 治理请求失败

- **WHEN** 后台治理请求失败
- **THEN** 页面 MUST 清除 pending 状态并恢复可操作控件
- **AND** 当前选择、筛选和分页上下文 MUST 保持可用
- **AND** 页面 MUST 展示并播报错误，且不得把失败对象显示为成功状态。

### Requirement: 后台筛选、分页与空结果协同

后台列表的 GET 筛选 SHALL 使用与高密度管理界面相适配的原生选择行为，并 SHALL 与 URL-backed pagination 和 Empty 状态协同工作。

#### Scenario: 提交后台筛选

- **WHEN** 管理员选择筛选条件并提交 GET 筛选表单
- **THEN** URL MUST 表示所选筛选条件
- **AND** 结果 MUST 从第一页开始，除非 URL 明确指定仍有效的页码
- **AND** 刷新和浏览器后退 MUST 恢复筛选控件与结果。

#### Scenario: 当前筛选无结果

- **WHEN** 当前后台筛选没有匹配记录
- **THEN** 页面 MUST 展示说明当前筛选无结果的 Empty 状态
- **AND** 提供清除筛选或返回完整列表的入口
- **AND** 不得展示可导航到不存在结果页的分页控件。

#### Scenario: 删除当前页最后一项

- **WHEN** 治理动作使非第一页的当前页不再有任何结果
- **THEN** 页面 MUST 保留当前筛选和排序条件
- **AND** 导航到最近的有效页或展示明确空状态
- **AND** 不得显示空表格同时保留指向无效页码的 current page 状态。
