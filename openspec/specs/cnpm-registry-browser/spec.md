# cnpm-registry-browser Specification

## Purpose

定义 cnode-next 中 npm 包搜索与浏览（npmmirror 镜像）能力必须满足的页面、数据源与交互要求。

## Requirements

### Requirement: 导航入口

系统 SHALL 在 cnode-next 站点导航栏提供 CNPM 菜单项，指向 `/cnpm`。菜单项 MUST 同时出现在桌面端顶栏导航与移动端底部 sheet 导航中，并复用现有 `Layout` 的 Header/Footer 与主题系统。

#### Scenario: 桌面端显示菜单项

- **WHEN** 用户在桌面端访问任意 cnode 页面
- **THEN** 顶栏导航中显示 CNPM 菜单项，点击后导航至 `/cnpm`

#### Scenario: 移动端显示菜单项

- **WHEN** 用户在移动端打开导航 sheet
- **THEN** sheet 中显示 CNPM 菜单项，点击后导航至 `/cnpm`

#### Scenario: 页面渲染在现有 Layout 内

- **WHEN** 用户访问任意 `/cnpm/*` 页面
- **THEN** 页面显示在 cnode 现有 Header 与 Footer 之间，无独立的第二套页面外壳

### Requirement: Landing 页

系统 SHALL 在 `/cnpm` 提供极简 landing 页，包含包搜索入口、registry 统计与最近访问的包。

#### Scenario: 展示搜索入口

- **WHEN** 用户访问 `/cnpm`
- **THEN** 页面展示居中搜索框，输入关键词并提交后跳转至 `/cnpm/search?q=<关键词>`

#### Scenario: 展示 registry 统计

- **WHEN** 用户访问 `/cnpm` 且 registry 统计请求成功
- **THEN** 页面展示 registry 文档数（doc_count）与本周下载量

#### Scenario: registry 统计失败

- **WHEN** registry 统计请求失败
- **THEN** 统计条隐藏，不阻塞搜索功能

#### Scenario: 展示最近访问的包

- **WHEN** 用户访问过至少一个包详情页后回到 `/cnpm`
- **THEN** 页面展示最近访问的包列表（来自 localStorage），点击可跳转包详情，并可逐个移除

### Requirement: 包搜索

系统 SHALL 在 `/cnpm/search` 提供 npm 包搜索结果页，按关键词查询并分页展示。

#### Scenario: 执行搜索

- **WHEN** 用户访问 `/cnpm/search?q=react`
- **THEN** 页面展示搜索结果列表，每项包含包名、最新版本、描述、关键词与下载量，并链接到对应包详情页

#### Scenario: 空搜索词

- **WHEN** 用户访问 `/cnpm/search` 且无 `q` 参数
- **THEN** 页面展示空状态，提示输入关键词

#### Scenario: 无结果

- **WHEN** 搜索关键词无匹配结果
- **THEN** 页面展示"未找到相关包"空状态

#### Scenario: 分页

- **WHEN** 搜索结果超过一页
- **THEN** 页面展示分页控件，切换后重新查询并更新 URL 查询参数

### Requirement: 包详情主页

系统 SHALL 在 `/cnpm/pkg/:name` 展示包详情主页，含 README 与包元信息。

#### Scenario: 展示包元信息

- **WHEN** 用户访问一个存在的包（如 `/cnpm/pkg/react`）
- **THEN** 页面展示包名、描述、许可证、仓库地址、主页、维护者列表与 dist-tags

#### Scenario: 渲染 README

- **WHEN** 包的 manifest 含 readme 字段
- **THEN** 页面渲染 README（Markdown，含代码高亮），未取得时展示占位

#### Scenario: 版本选择

- **WHEN** 用户通过包内版本选择器选择某个版本
- **THEN** URL 更新 `?version=<版本号>` 并刷新对应版本的元信息与下载数据

#### Scenario: scoped 包

- **WHEN** 用户访问 scoped 包如 `/cnpm/pkg/@babel/core`
- **THEN** 页面正确解析包名为 `@babel/core` 并展示其详情

#### Scenario: 包不存在

- **WHEN** 用户访问 registry 中不存在的包名
- **THEN** 页面展示 404 状态，提示该包可能尚未同步到镜像站

### Requirement: 版本列表

系统 SHALL 在 `/cnpm/pkg/:name/versions` 展示包的全部版本列表。

#### Scenario: 版本排序

- **WHEN** 用户访问版本列表页
- **THEN** 版本按发布时间倒序展示，每项包含版本号与发布时间

#### Scenario: 标签标注

- **WHEN** 某版本被 dist-tags 指向（如 latest、beta）
- **THEN** 该版本展示对应标签徽标

### Requirement: 文件浏览

系统 SHALL 在 `/cnpm/pkg/:name/files` 提供包产物文件浏览与预览能力。

#### Scenario: 展示文件树

- **WHEN** 用户访问文件页
- **THEN** 页面展示包文件的目录树，目录可按需展开加载

#### Scenario: 预览文件内容

- **WHEN** 用户点击文件树中的文件
- **THEN** 页面右侧展示文件内容，代码文件带语法高亮，并更新 URL 中的文件路径

#### Scenario: 文件加载失败

- **WHEN** 指定版本的产物文件请求失败
- **THEN** 页面展示错误状态与重试入口，不导致整页崩溃

### Requirement: 依赖信息

系统 SHALL 在 `/cnpm/pkg/:name/deps` 展示当前版本的依赖关系。

#### Scenario: 展示依赖分组

- **WHEN** 用户访问依赖页
- **THEN** 页面按 dependencies / devDependencies / optionalDependencies / peerDependencies 分组展示依赖名与版本范围

#### Scenario: 依赖跳转

- **WHEN** 用户点击某个依赖项
- **THEN** 跳转到该依赖的包详情页

### Requirement: 下载趋势预留

系统 SHALL 预留下载趋势能力：提供 `/cnpm/pkg/:name/trends` 路由与下载数据 hook，主页展示下载量数字与基础趋势图；多包对比与时间范围切换留作后续。

#### Scenario: 路由可达

- **WHEN** 用户访问 `/cnpm/pkg/:name/trends`
- **THEN** 页面渲染（可为基础图或占位），不返回 404

#### Scenario: 主页下载量

- **WHEN** 用户访问包详情主页且下载数据请求成功
- **THEN** 侧栏展示近 7 天下载总量与基础趋势图

#### Scenario: 下载数据无数据

- **WHEN** 包的下载数据为空
- **THEN** 展示空状态文案，不报错

### Requirement: 数据源

系统 SHALL 通过浏览器直连 `https://registry.npmmirror.com` 获取数据，不经过本站 API。

#### Scenario: 直连 registry

- **WHEN** 页面需要包数据
- **THEN** 浏览器直接请求 npmmirror registry 的 JSON API（manifest / search / downloads / files），不请求本站 `/api` 接口

#### Scenario: 网络错误

- **WHEN** registry 请求发生网络错误
- **THEN** 页面展示错误状态并提供重试入口

#### Scenario: 加载态

- **WHEN** 数据请求进行中
- **THEN** 页面展示加载态，避免布局抖动
