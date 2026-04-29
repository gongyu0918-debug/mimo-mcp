# Client Compatibility

This project is a MiMo tool bridge, not a replacement model provider.

Xiaomi's official integration pages describe how to use MiMo directly as a
model provider in popular AI coding tools. If that is all you need, configure
the client with Xiaomi's OpenAI-compatible or Anthropic-compatible endpoint and
do not add this MCP.

Use this MCP only when the client can load MCP servers and you want MiMo's
non-text capabilities as explicit tools:

- Web Search
- Image understanding
- Audio understanding
- Video understanding
- TTS with preset voices, voice design, or voice clone
- Local media files encoded by the MCP server process

## Native Provider vs MCP

| Scenario | Recommendation |
| --- | --- |
| Text/code chat with MiMo | Use the official OpenAI-compatible or Anthropic-compatible provider setup. |
| A client already supports OpenAI-compatible image input and it works with MiMo | Use the native provider path first. |
| Audio understanding, video understanding, TTS, or Web Search as a named tool | Use this MCP, if the client supports MCP. |
| Claude Code with MiMo multimodal/TTS tools | Use native MiMo provider for the main model and add this MCP for tools. |
| A client only supports model providers and has no MCP server setting | This MCP cannot be loaded directly; use the official provider setup only. |

## MiMo Endpoints

Use the endpoint family that matches the client's provider protocol.

| Usage | OpenAI-compatible base URL | Anthropic-compatible base URL |
| --- | --- | --- |
| Pay-as-you-go MiMo API | `https://api.xiaomimimo.com/v1` | `https://api.xiaomimimo.com/anthropic` |
| Token Plan China | `https://token-plan-cn.xiaomimimo.com/v1` | `https://token-plan-cn.xiaomimimo.com/anthropic` |
| Token Plan Singapore | `https://token-plan-sgp.xiaomimimo.com/v1` | `https://token-plan-sgp.xiaomimimo.com/anthropic` |
| Token Plan Europe | `https://token-plan-ams.xiaomimimo.com/v1` | `https://token-plan-ams.xiaomimimo.com/anthropic` |

For Token Plan, Xiaomi says the Base URL shown on the Subscription page takes
priority. Token Plan keys use the `tp-xxxxx` format. Pay-as-you-go keys use the
`sk-xxxxx` format. Keep them separate.

## MCP Configuration

For clients that accept stdio MCP configuration, point them at this server:

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

Prefer setting `MIMO_API_KEY` in the OS or shell environment instead of putting
it in a client config file.

When `MIMO_API_KEY` is a Token Plan key, `mimo_web_search` is disabled unless
you also set `MIMO_WEB_SEARCH_API_KEY` to a pay-as-you-go MiMo key. The other
tools can continue to use Token Plan routing.

## Official Integration Matrix

The table below summarizes Xiaomi's official MiMo integration pages as checked
on 2026-04-29.

| Client | Official MiMo provider path | Does native provider make this MCP unnecessary? | MCP note |
| --- | --- | --- | --- |
| OpenCode | OpenAI-compatible provider via `opencode.json`; the official page notes image input can be enabled with model modalities. | Yes for text/code chat, and likely for native image input when configured. | Use this MCP for audio, video, TTS, Web Search tools, or local media handling if your OpenCode setup supports MCP servers. |
| Claude Code | Anthropic-compatible provider through `ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN`, and MiMo model env vars. | Yes for the main coding model. | This repo has been smoke-tested through real `claude mcp get` and `claude -p` mounted MCP tool calls. |
| OpenClaw | Xiaomi provider preset for pay-as-you-go; Token Plan uses manual config with an OpenAI-compatible provider. | Yes for normal OpenClaw model calls. | Add this MCP only if your OpenClaw environment supports external MCP servers/tools. |
| Hermes Agent | Xiaomi MiMo predefined provider or a custom provider with Base URL, API key, and model. | Yes for normal agent model calls. | Use MCP only where Hermes exposes MCP tool/server integration. |
| Cline | OpenAI-compatible provider in CLI or VS Code plugin. | Yes for normal model calls. | Add this MCP in Cline MCP settings if you want MiMo media/TTS/search tools. |
| Kilo Code | OpenAI-compatible provider in CLI; VS Code plugin includes Xiaomi provider options. | Yes for normal model calls. | Add this MCP only for named MiMo tools beyond provider chat. |
| Roo Code | OpenAI Compatible provider in the VS Code extension. | Yes for normal model calls. | Add this MCP through Roo's MCP support when you need MiMo tools. |
| Codex | Xiaomi's page says MiMo works only with older Codex versions that still use ChatCompletions, not the Responses API. | Yes only for those older ChatCompletions-based Codex versions. | This MCP is separate from Codex model-provider compatibility; load it only in Codex environments that support MCP tools. |
| Cherry Studio | Built-in Xiaomi MiMo model service; Token Plan can use the dedicated API host and key. | Yes for normal conversations. | Add this MCP only if Cherry Studio's MCP/tool settings are available in your version. |
| Zed | Custom OpenAI-compatible provider; Xiaomi notes Zed does not support custom Anthropic-compatible Base URLs. | Yes for Zed model threads. | MCP availability depends on Zed's tool integration support; otherwise use native provider only. |
| TRAE | Custom OpenAI model using a full `BASE_URL/chat/completions` request URL. | Yes for normal model calls. | Use this MCP only if TRAE exposes MCP server configuration. |
| Qwen Code | Custom OpenAI provider in `~/.qwen/settings.json` or the IDE companion. | Yes for normal Qwen Code model calls. | Add this MCP only where Qwen Code supports MCP servers/tools. |

## Official References

- [MiMo AI Tools Overview](https://platform.xiaomimimo.com/static/docs/integration/tools-overview.md)
- [OpenCode Configuration](https://platform.xiaomimimo.com/static/docs/integration/opencode.md)
- [Claude Code Configuration](https://platform.xiaomimimo.com/static/docs/integration/claudecode.md)
- [OpenClaw Configuration](https://platform.xiaomimimo.com/static/docs/integration/openclaw.md)
- [Hermes Agent Configuration](https://platform.xiaomimimo.com/static/docs/integration/hermes-agent.md)
- [Cline Configuration](https://platform.xiaomimimo.com/static/docs/integration/cline.md)
- [Kilo Code Configuration](https://platform.xiaomimimo.com/static/docs/integration/kilocode.md)
- [Roo Code Configuration](https://platform.xiaomimimo.com/static/docs/integration/roocode.md)
- [Codex Configuration](https://platform.xiaomimimo.com/static/docs/integration/codex.md)
- [Cherry Studio Configuration](https://platform.xiaomimimo.com/static/docs/integration/cherrystudio.md)
- [Zed Configuration](https://platform.xiaomimimo.com/static/docs/integration/zed.md)
- [TRAE Configuration](https://platform.xiaomimimo.com/static/docs/integration/trae.md)
- [Qwen Code Configuration](https://platform.xiaomimimo.com/static/docs/integration/qwencode.md)

## 中文简述

如果工具本身已经支持 OpenAI 兼容协议或 Anthropic 兼容协议，那么普通文本对话和 coding agent 模型调用不需要这个 MCP，直接按小米官方文档配置 MiMo provider 即可。

这个 MCP 的价值在于把 MiMo 的联网搜索、图像理解、音频理解、视频理解和 TTS 包装成显式工具。只有当客户端支持 MCP server，并且你希望在该客户端内调用这些 MiMo 工具能力时，才需要加载本 MCP。

Claude Code 场景已用真实挂载方式验证：`claude mcp get mimo` 显示 Connected，并通过 `claude -p` 调用了挂载后的 `mcp__mimo__...` 工具。
