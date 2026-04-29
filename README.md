# mimo-mcp

Lightweight Model Context Protocol server for Xiaomi MiMo. It exposes MiMo web
search, multimodal understanding, and speech synthesis to Claude Code and other
MCP clients over stdio.

English is the primary documentation language. A concise Chinese guide is
available in [中文说明](#中文说明).

## Highlights

- Five compact MCP tools for search, image, audio, video, and TTS workflows.
- Web search support through Xiaomi MiMo's OpenAI-compatible `web_search` tool.
- Multimodal media support from public URLs, data URIs, or local files.
- TTS output is written to disk and returned as a path, avoiding large base64
  blobs in chat context.
- MiMo-only environment variables by design, so unrelated OpenAI or Anthropic
  credentials are never reused accidentally.
- Optional Skill documentation in `skills/mimo/SKILL.md` for usage guidance
  without bloating the MCP schema.

The MCP tool descriptions stay intentionally short to reduce context overhead.
Usage guidance lives in `skills/mimo/SKILL.md` and can be loaded only when needed.

## Contents

- [Quick Start](#quick-start)
- [Client Configuration](#client-configuration)
- [Tools](#tools)
- [Configuration](#configuration)
- [Token Plan Support](#token-plan-support)
- [Smoke Tests](#smoke-tests)
- [Security Notes](#security-notes)
- [Troubleshooting](#troubleshooting)
- [GitHub Landscape](#github-landscape)
- [License And Xiaomi Terms](#license-and-xiaomi-terms)
- [中文说明](#中文说明)

## GitHub Landscape

Before building this, I checked public GitHub projects on April 29, 2026.

Related projects found:

- `BambooGap/mimo-mcp-server`: TypeScript, covers chat, image vision, and TTS. It does not appear to cover MiMo `web_search`, audio understanding, or video understanding, and the npm package was not published when checked.
- `NanAquarius/Xiaomi-MiMo-TTS-MCP`: Python, well-scoped TTS MCP with Token Plan routing and HTTP deployment notes, but it is TTS-only.

Both repositories were newly pushed on April 28-29, 2026 and had 0 stars / 0 forks when checked. This repository is therefore a small purpose-built implementation rather than a fork of an established mature package.

## License And Xiaomi Terms

This repository's own code is MIT licensed.

Xiaomi's public MiMo-V2.5 open-source announcement says the MiMo-V2.5 model weights are released under the MIT License. Xiaomi MiMo Open Platform API usage is still governed by Xiaomi's platform service agreement and privacy policy. In particular:

- Keep API keys secret; do not publish them in code, browser clients, logs, or screenshots.
- Follow applicable laws and Xiaomi platform rules when using generated or synthesized content.
- Add required labels or marks for AI-generated or synthesized content when applicable.
- This project is not an official Xiaomi project. Xiaomi, MiMo, and related marks belong to their owners.

## Requirements

- Node.js 18+
- Xiaomi MiMo API key
- Claude Code or another MCP client

For web search, enable the MiMo Web Search Plugin in the Xiaomi console:

https://platform.xiaomimimo.com/#/console/plugin

MiMo may take a few minutes to apply plugin enable/disable changes.

## Quick Start

### First-time checklist

1. Create or copy a Xiaomi MiMo API key in the MiMo console.
2. Set it locally as `MIMO_API_KEY`. This means an OS or shell environment
   variable, not repository content.
3. Do not commit or paste the real key into this repository, README, Skill file,
   screenshots, or chat logs.
4. Enable the Web Search Plugin in the MiMo console before using
   `mimo_web_search`.
5. Wait a few minutes after enabling or disabling the plugin, because MiMo may
   cache plugin state briefly.
6. Register the MCP server in Claude Code or another MCP client.

Clone and install dependencies:

```bash
git clone https://github.com/gongyu0918-debug/mimo-mcp.git
cd mimo-mcp
npm install
```

Set an API key:

```bash
# macOS/Linux
export MIMO_API_KEY="<your-mimo-api-key>"

# Windows PowerShell
setx MIMO_API_KEY "<your-mimo-api-key>"
```

Use a MiMo key here. The server intentionally does not read `OPENAI_*` or `ANTHROPIC_*` variables to avoid accidentally sending unrelated credentials to MiMo.

Run local checks:

```bash
npm run check
npm run smoke -- "latest Xiaomi MiMo model updates"
```

## Client Configuration

### Claude Code

Add the MCP server:

```bash
claude mcp add -s user mimo -- node /absolute/path/to/mimo-mcp/src/server.js
```

Windows PowerShell example:

```powershell
claude mcp add -s user mimo -- node "C:\path\to\mimo-mcp\src\server.js"
```

Check the server:

```bash
claude mcp get mimo
```

### Generic MCP JSON

For MCP clients that accept JSON configuration, use the stdio form below. Prefer
setting `MIMO_API_KEY` in your shell or OS environment instead of committing it
to a config file.

```json
{
  "mcpServers": {
    "mimo": {
      "command": "node",
      "args": ["/absolute/path/to/mimo-mcp/src/server.js"],
      "env": {
        "MIMO_MODEL": "mimo-v2.5-pro",
        "MIMO_MULTIMODAL_MODEL": "mimo-v2.5",
        "MIMO_TTS_MODEL": "mimo-v2.5-tts"
      }
    }
  }
}
```

Windows path example:

```json
{
  "mcpServers": {
    "mimo": {
      "command": "node",
      "args": ["C:\\Users\\you\\mimo-mcp\\src\\server.js"]
    }
  }
}
```

## Tools

| Tool | Purpose |
| --- | --- |
| `mimo_web_search` | Fresh/time-sensitive web answers through MiMo Web Search |
| `mimo_image_understand` | Image and screenshot analysis |
| `mimo_audio_understand` | Audio transcription or audio QA |
| `mimo_video_understand` | Video description and QA |
| `mimo_tts` | TTS with preset voices, voice design, or voice clone |

Media tools accept public URLs, data URIs, or local file paths readable by the MCP server process.

TTS writes generated audio to a file and returns the path, avoiding large base64 audio blobs in chat context.

### Usage Examples

Ask the MCP client to use the appropriate MiMo tool:

```text
Use mimo_web_search to check the latest Xiaomi MiMo V2.5 license details.
```

```text
Use mimo_image_understand on this local screenshot and summarize the UI issues.
```

```text
Use mimo_tts to synthesize this sentence with the preset voice, writing a wav file.
```

## Configuration

| Name | Default | Description |
| --- | --- | --- |
| `MIMO_API_KEY` | empty | Xiaomi MiMo API key. Required. |
| `MIMO_BASE_URL` | auto | Explicit OpenAI-compatible base URL override. |
| `MIMO_PLAN` | auto | `pay-as-you-go` or `token-plan`. Usually inferred from key prefix. |
| `MIMO_REGION` | `cn` | Token Plan region: `cn`, `sgp`, or `ams`. |
| `MIMO_MODEL` | `mimo-v2.5-pro` | Model used for web search answers. |
| `MIMO_MULTIMODAL_MODEL` | `mimo-v2.5` | Model used for image/audio/video understanding. |
| `MIMO_TTS_MODEL` | `mimo-v2.5-tts` | Default preset TTS model. |
| `MIMO_SEARCH_MAX_KEYWORD` | `3` | Default max keywords per search round. |
| `MIMO_SEARCH_LIMIT` | `3` | Default max pages returned per search. |
| `MIMO_SEARCH_COUNTRY` | empty | Optional default country for search. |
| `MIMO_SEARCH_REGION` | empty | Optional default region/state for search. |
| `MIMO_SEARCH_CITY` | empty | Optional default city for search. |
| `MIMO_TIMEOUT_MS` | `60000` | Request timeout. |
| `MIMO_MAX_LOCAL_MEDIA_MB` | `50` | Max local media file size encoded into data URIs. |

Default base URL behavior:

- `sk-...` keys use `https://api.xiaomimimo.com/v1`
- `tp-...` keys use `https://token-plan-cn.xiaomimimo.com/v1` unless `MIMO_REGION` changes it
- `MIMO_BASE_URL` overrides all automatic routing

## Token Plan Support

This MCP supports Xiaomi MiMo Token Plan keys for coding-tool usage.

Official Token Plan docs say Token Plan keys use the `tp-xxxxx` format and are
independent from pay-as-you-go `sk-xxxxx` keys. They cannot be mixed. For this
MCP, set the Token Plan key as `MIMO_API_KEY`.

Token Plan routing in this server:

- `tp-...` keys are detected automatically.
- `MIMO_PLAN=token-plan` can force Token Plan routing.
- `MIMO_REGION=cn` uses `https://token-plan-cn.xiaomimimo.com/v1`.
- `MIMO_REGION=sgp` uses `https://token-plan-sgp.xiaomimimo.com/v1`.
- `MIMO_REGION=ams` uses `https://token-plan-ams.xiaomimimo.com/v1`.
- If the MiMo subscription page shows a different Base URL, set
  `MIMO_BASE_URL` explicitly. It has priority over automatic routing.

The server uses the official OpenAI-compatible protocol and sends credentials in
the `api-key` request header, matching Xiaomi's Token Plan examples.

Important scope note: Xiaomi describes Token Plan as a subscription plan for AI
programming scenarios and mainstream AI development tools such as Claude Code,
OpenCode, and OpenClaw. Do not use a Token Plan key with this MCP as a generic
application backend, batch automation service, or clearly non-coding API
workload.

Web search still requires the Web Search Plugin to be enabled in the MiMo
console, and web search may add separate plugin usage charges plus model input
tokens according to Xiaomi's pricing rules.

## Optional Skill

The optional skill is at:

```text
skills/mimo/SKILL.md
```

Use it in environments that support skills when you want routing guidance, prompt tips, supported voice IDs, or troubleshooting notes without bloating the MCP schema.

## Smoke Tests

Syntax check:

```bash
npm run check
```

API smoke test:

```bash
npm run smoke -- "latest Xiaomi MiMo model updates"
```

All-modality MCP smoke test:

```bash
npm run smoke:all
```

If web search fails but normal MiMo calls work, check whether the Web Search Plugin is enabled and whether the cache delay has passed.

## Security Notes

- Do not commit API keys to Git or paste real keys into README, Skill files,
  screenshots, issue comments, or chat logs. Use OS-level environment variables
  or your MCP client's secret handling.
- This server only reads `MIMO_*` environment variables. It intentionally avoids
  `OPENAI_*` and `ANTHROPIC_*` fallbacks.
- Local media files are read by the MCP server process and encoded for MiMo API
  requests. Keep `MIMO_MAX_LOCAL_MEDIA_MB` conservative for large audio or video.
- Treat model output and search results as untrusted content when using them in
  automation or code changes.
- Mark AI-generated or synthesized content when applicable under your local
  rules and Xiaomi platform terms.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| `Missing MIMO_API_KEY` | Set `MIMO_API_KEY` in the same environment that launches the MCP client. |
| Web search returns normal chat only | Enable the MiMo Web Search Plugin in the Xiaomi console and wait for cache propagation. |
| Token Plan key fails | Set `MIMO_PLAN=token-plan` and verify `MIMO_REGION` is `cn`, `sgp`, or `ams`. |
| Local media upload fails | Check file path quoting, file permissions, and `MIMO_MAX_LOCAL_MEDIA_MB`. |
| Claude Code does not show the server | Run `claude mcp get mimo`, then restart the Claude Code session if needed. |

## Why MCP plus Skill?

MCP is the executable layer: it calls MiMo APIs, reads local media, and writes generated audio.

Skill is the guidance layer: it explains when to use each tool and how to shape prompts, but only when needed. This keeps Claude Code's regular context smaller.

## 中文说明

这是一个面向 Xiaomi MiMo 的轻量 MCP 服务器，可以把 MiMo 的联网搜索、图像理解、音频理解、视频理解和语音合成接入 Claude Code 或其他 MCP 客户端。

英文部分是主文档；本节提供中文快速说明，方便首次配置和排障。

### 功能亮点

- 提供 5 个精简 MCP 工具：联网搜索、图像理解、音频理解、视频理解、TTS。
- 联网搜索使用 MiMo OpenAI 兼容接口里的 `web_search` 工具。
- 多模态输入支持公网 URL、data URI、以及 MCP 进程可读取的本地文件路径。
- TTS 会把音频写入本地文件并返回路径，避免把大段 base64 音频塞进上下文。
- 只读取 `MIMO_*` 环境变量，不读取 `OPENAI_*` 或 `ANTHROPIC_*`，避免误用其他平台密钥。
- 可选 Skill 位于 `skills/mimo/SKILL.md`，用于保存使用建议，减少 MCP schema 的常驻上下文占用。

### 首次配置清单

1. 在 MiMo 控制台创建或复制 API key。
2. 在本机环境变量里设置 `MIMO_API_KEY`。这是本机配置，不是提交到仓库。
3. 不要把真实 API key 提交或粘贴到 README、Skill、源码、截图、聊天记录或任何 Git 跟踪文件。
4. 使用 `mimo_web_search` 前，请在 MiMo 网页控制台启用 Web Search Plugin。
5. 插件启用或关闭后，等待几分钟让 MiMo 缓存状态刷新。
6. 在 Claude Code 里注册 MCP，并用 `claude mcp get mimo` 确认连接状态。

### 安装

```bash
git clone https://github.com/gongyu0918-debug/mimo-mcp.git
cd mimo-mcp
npm install
```

在本机环境变量中设置 API key（这是本地配置，不是提交到 GitHub）：

```bash
# macOS/Linux
export MIMO_API_KEY="<your-mimo-api-key>"

# Windows PowerShell
setx MIMO_API_KEY "<your-mimo-api-key>"
```

### Claude Code 配置

```bash
claude mcp add -s user mimo -- node /absolute/path/to/mimo-mcp/src/server.js
claude mcp get mimo
```

Windows PowerShell 示例：

```powershell
claude mcp add -s user mimo -- node "C:\path\to\mimo-mcp\src\server.js"
claude mcp get mimo
```

### 工具列表

| 工具 | 用途 |
| --- | --- |
| `mimo_web_search` | 使用 MiMo 联网搜索回答最新或时效性问题 |
| `mimo_image_understand` | 图片、截图、图表、视觉内容分析 |
| `mimo_audio_understand` | 音频转写、音频描述、音频问答 |
| `mimo_video_understand` | 视频总结、画面描述、视频问答 |
| `mimo_tts` | 预设音色、声音设计、声音克隆 TTS |

### 常用环境变量

| 名称 | 说明 |
| --- | --- |
| `MIMO_API_KEY` | 必填，Xiaomi MiMo API key |
| `MIMO_MODEL` | 联网搜索回答模型，默认 `mimo-v2.5-pro` |
| `MIMO_MULTIMODAL_MODEL` | 图像/音频/视频理解模型，默认 `mimo-v2.5` |
| `MIMO_TTS_MODEL` | 默认 TTS 模型，默认 `mimo-v2.5-tts` |
| `MIMO_PLAN` | `pay-as-you-go` 或 `token-plan`，通常可自动判断 |
| `MIMO_REGION` | Token Plan 区域：`cn`、`sgp` 或 `ams` |
| `MIMO_MAX_LOCAL_MEDIA_MB` | 本地媒体文件大小上限，默认 50 MB |

### Token Plan 支持

这个 MCP 支持小米 MiMo Token Plan key，但使用边界要按官方 Token Plan 文档来。

- Token Plan key 格式是 `tp-xxxxx`，普通按量 API key 格式是 `sk-xxxxx`，两者独立，不能混用。
- 使用 Token Plan 时，把 `tp-...` key 设置为本机环境变量 `MIMO_API_KEY`。
- MCP 会自动识别 `tp-...` 并走 Token Plan 专用 OpenAI 兼容 Base URL。
- `MIMO_REGION=cn` 对应 `https://token-plan-cn.xiaomimimo.com/v1`。
- `MIMO_REGION=sgp` 对应 `https://token-plan-sgp.xiaomimimo.com/v1`。
- `MIMO_REGION=ams` 对应 `https://token-plan-ams.xiaomimimo.com/v1`。
- 如果 MiMo 订阅管理页面显示的 Base URL 不同，以控制台显示为准，设置 `MIMO_BASE_URL` 覆盖自动路由。

官方文档把 Token Plan 定位为 AI 编程工具场景，支持 Claude Code、OpenCode、OpenClaw 等主流开发工具。这个 MCP 在 Claude Code 里作为编程工具能力使用是匹配的；不要把 Token Plan key 用在普通应用后端、批量自动化脚本或明显非 Coding 的 API 工作负载里。

联网搜索仍然需要在 MiMo 控制台启用 Web Search Plugin；联网搜索可能产生插件调用费用，并增加模型输入 tokens。

### 冒烟测试

语法检查：

```bash
npm run check
```

联网搜索快速测试：

```bash
npm run smoke -- "latest Xiaomi MiMo model updates"
```

全模态 MCP 测试：

```bash
npm run smoke:all
```

`smoke:all` 会依次测试联网搜索、图像理解、音频理解、视频理解、预设 TTS、声音设计 TTS 和声音克隆 TTS。

### 常见问题

| 现象 | 检查项 |
| --- | --- |
| 提示 `Missing MIMO_API_KEY` | 确认启动 MCP 客户端的同一个环境里设置了 `MIMO_API_KEY` |
| 联网搜索没有触发 | 到 MiMo 控制台启用 Web Search Plugin，并等待缓存刷新 |
| Token Plan key 失败 | 设置 `MIMO_PLAN=token-plan`，并检查 `MIMO_REGION` |
| 本地媒体文件失败 | 检查路径引号、文件权限和 `MIMO_MAX_LOCAL_MEDIA_MB` |
| Claude Code 看不到 MCP | 运行 `claude mcp get mimo`，必要时重启 Claude Code 会话 |

### 安全提醒

- 不要把真实 API key 提交到 Git 仓库。
- 不要把真实 API key 写进 Skill、README、截图、issue 或聊天记录。
- 不要把生成音频的 base64 内容直接塞进聊天上下文。
- 对搜索结果和模型输出保持校验，尤其是在自动化或代码修改场景里。
- 按照本地规则和小米平台条款标识 AI 生成或合成内容。

## License

MIT
