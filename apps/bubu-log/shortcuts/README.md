# bubu-log shortcuts assets

该目录由 `git subtree` 管理，用于保存快捷指令相关模板。

## 文件

- `voice-input-shortcut.template.json`: Siri 快捷指令配置模板（将 `url` 与 `x-api-key` 替换成你的真实值）

## 推荐 webhook

- `POST /api/webhooks/voice-input`
- Header: `x-api-key: <VOICE_WEBHOOK_API_KEY>`
- Body: `{ "text": "宝宝喝了 60 毫升奶", "localTime": "2026-02-20 21:30" }`
