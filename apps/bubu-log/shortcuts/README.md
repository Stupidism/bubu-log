# bubu-log shortcuts assets

该目录由 `git subtree` 管理，用于保存快捷指令相关模板。

## 文件

- `voice-input-shortcut.template.json`: Siri 快捷指令配置模板（将 `url` 与 `Authorization: Bearer <token>` 替换成你的真实值）

## 当前用户自动绑定（推荐）

1. 登录 App，进入 `/settings`
2. 点击「新建快捷指令」按钮
3. 系统会自动生成并复制当前用户 + 当前宝宝绑定的 token 配置
4. 在 iPhone 快捷指令中粘贴使用

## 推荐 webhook

- `POST /api/webhooks/voice-input`
- Header: `Authorization: Bearer <SIGNED_WEBHOOK_TOKEN>`
- Body: `{ "text": "宝宝喝了 60 毫升奶", "localTime": "2026-02-20 21:30" }`
