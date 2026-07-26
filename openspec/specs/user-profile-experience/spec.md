# user-profile-experience Specification

## Purpose

定义用户主页及其话题、参与、收藏列表对齐 nodeclub 线上分页语义的要求。

## Requirements

### Requirement: 用户内容列表必须支持 legacy 分页语义

用户主页相关列表 SHALL 对齐 `nodeclub/controllers/user.js` 的分页行为，不能只展示 profile recent 数据。

#### Scenario: 用户话题分页

- **WHEN** 用户访问 `/user/:name/topics?page=N`
- **THEN** 系统展示该用户创建的话题列表
- **AND** 结果按 create_at 降序排列
- **AND** 页面返回总页数并渲染分页控件

#### Scenario: 用户参与分页

- **WHEN** 用户访问 `/user/:name/replies?page=N`
- **THEN** 系统展示该用户参与过回复的话题列表
- **AND** 按该用户回复时间降序去重话题
- **AND** 页面返回总页数并渲染分页控件

#### Scenario: 用户收藏分页

- **WHEN** 用户访问 `/user/:name/collections?page=N`
- **THEN** 系统展示该用户收藏的话题列表
- **AND** 保持收藏记录顺序
- **AND** 页面返回总页数并渲染分页控件
