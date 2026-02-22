# 多宝宝 URL 路由与导航说明

## 路由规范

- 主路由采用 `baby-scope`：`/b/[babyId]`
- 核心页面：
  - 首页：`/b/[babyId]`
  - 统计：`/b/[babyId]/stats`
  - 趋势：`/b/[babyId]/stats/trends`
  - 审计：`/b/[babyId]/audits`
  - 宝宝管理：`/b/[babyId]/babies`
  - 设置：`/b/[babyId]/settings`
- 旧路由兼容重定向（自动跳转到默认宝宝）：
  - `/`
  - `/stats`
  - `/stats/trends`
  - `/audits`
  - `/babies`
  - `/settings`

## URL 作为数据上下文

- 前端请求 API 时会自动附带当前 URL 的 `babyId`（query + header）。
- 后端会校验当前用户是否绑定该 `babyId`，并仅返回该宝宝的数据。
- 错误语义统一：
  - `401`：未登录
  - `403`：无宝宝绑定或访问未授权宝宝
  - `404`：绑定宝宝不存在

## 抽屉菜单导航

- 首页右上角为抽屉菜单入口。
- 菜单项：历史数据、统计数据、操作记录、宝宝管理、设置。
- 菜单跳转会保留当前 `babyId`，并根据当前路径显示 active 态。

## 接口迁移清单（BBL-012）

- 已完成：
  - `GET/POST/PUT/DELETE /api/activities`
  - `GET/PATCH/DELETE /api/activities/{id}`
  - `GET /api/activities/latest`
  - `GET/POST /api/daily-stats`
  - `GET /api/daily-stats/{date}`
  - `GET /api/audits`
  - `GET/PATCH /api/baby-profile`
  - `POST/DELETE /api/baby-profile/avatar`
  - `POST /api/voice-input`
  - `GET /api/auth/context`
  - `GET/POST /api/babies`
  - `PATCH /api/babies/{id}`
- 暂不纳入 baby-scope（管理后台能力）：
  - `/api/admin/*`

## 常见排障

- 打开 URL 后显示无权限：
  - 确认当前账号已绑定目标 `babyId`
  - 切回默认宝宝路由后再从头像切换器切换
- 页面请求反复 403：
  - 检查地址栏 `babyId` 是否为历史失效 ID
  - 通过首页头像切换器重新选择宝宝
