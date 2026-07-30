## ADDED Requirements

### Requirement: Topic action surface 分层

话题详情正文后的 action surface SHALL 将主互动、页内导航和更多/管理动作分层展示，避免收藏、查看回复、编辑、举报和管理操作以同级按钮零散平铺。

#### Scenario: 主互动和页内导航分离

- **WHEN** 话题详情正文渲染完成
- **THEN** 收藏/取消收藏作为主互动操作展示
- **AND** “查看回复”作为页内导航操作展示
- **AND** 两者在视觉上不与高风险管理动作同级混排。

#### Scenario: 更多和管理动作归组

- **WHEN** 当前用户具备编辑、举报或管理权限
- **THEN** 编辑话题、举报、置顶、高亮和删除等动作 SHALL 归入更多/管理区域或等价分组
- **AND** destructive 动作必须保持明确危险语义和确认流程。

#### Scenario: 移动端 action surface 可用

- **WHEN** 话题详情页在移动端渲染
- **THEN** 主互动和查看回复仍可直接触达
- **AND** 低频或管理动作可以折叠，但不得消失或变成不可发现的死控件。
