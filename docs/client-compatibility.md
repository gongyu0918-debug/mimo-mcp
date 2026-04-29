# Client Boundaries and Verification

This project is a MiMo tool bridge for Claude Code. It is not a replacement for
Xiaomi's official model-provider integrations.

## Current Verification Status

Only the Claude Code MCP path is claimed as verified.

Verified on 2026-04-29:

- `claude mcp get mimo` showed the server as connected.
- `claude -p` invoked mounted `mcp__mimo__...` tools through Claude Code.
- Token Plan-only `mimo_web_search` returned the MCP boundary message instead
  of a raw provider `400`.
- With a separate pay-as-you-go web-search key, the mounted tools passed:
  `mimo_web_search`, `mimo_image_understand`, `mimo_audio_understand`,
  `mimo_video_understand`, and `mimo_tts`.

The other tools listed in Xiaomi's official integration docs are not claimed as
MCP-compatible by this repository until someone tests them in that specific
client.

## Native Provider vs MCP

Xiaomi's official integration pages mostly describe how to use MiMo directly as
a model provider in AI coding tools. If that is all you need, configure the
client with Xiaomi's OpenAI-compatible or Anthropic-compatible endpoint and do
not add this MCP.

Use this MCP when you are in Claude Code, or another MCP-capable client that you
are prepared to test, and you want MiMo's non-text capabilities as explicit
tools:

- Web Search
- Image understanding
- Audio understanding
- Video understanding
- TTS with preset voices, voice design, or voice clone
- Local media files encoded by the MCP server process

| Scenario | Recommendation |
| --- | --- |
| Text/code chat with MiMo | Use Xiaomi's official OpenAI-compatible or Anthropic-compatible provider setup. |
| A client already supports OpenAI-compatible image input and it works with MiMo | Use the native provider path first. |
| Claude Code needs audio/video understanding, TTS, explicit Web Search, or local-file media handling | Use this MCP; this path is verified. |
| Another MCP-capable client needs MiMo tools | Treat it as unverified until you run client-specific MCP tests. |
| A client has no MCP server setting | Use the official provider setup only; this MCP cannot be loaded directly. |

## What Counts as Compatibility

Do not treat "the client supports OpenAI-compatible MiMo provider" as "this MCP
is compatible with the client." Those are different layers.

Before marking another client as verified, run all three checks:

1. Provider smoke: MiMo works as the client's model provider for text/code chat.
2. MCP load smoke: the client loads this stdio server and lists the MiMo tools.
3. MCP tool smoke: the client actually calls each required tool and receives a
   usable result.

Suggested tool smoke coverage:

- `mimo_web_search`, with pay-as-you-go search key when needed.
- `mimo_image_understand`, using an official public sample image.
- `mimo_audio_understand`, using an official public sample audio file.
- `mimo_video_understand`, using an official public sample video file.
- `mimo_tts`, writing a small wav file and confirming it exists.

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

## Claude Code MCP Configuration

Claude Code is the primary verified target for this repository.

```bash
claude mcp add -s user mimo -- node /absolute/path/to/mimo-mcp/src/server.js
claude mcp get mimo
```

For clients that accept a generic stdio MCP JSON configuration, this server can
be tried with:

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

## Official Integration Docs

The table below summarizes what Xiaomi's official pages document. It is a
provider-reference table, not an MCP compatibility matrix.

| Client | Official MiMo provider path | MCP status in this repo |
| --- | --- | --- |
| OpenCode | OpenAI-compatible provider via `opencode.json`; the official page notes image input can be enabled with model modalities. | Not verified. Use official provider for text/code chat. |
| Claude Code | Anthropic-compatible provider through `ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN`, and MiMo model env vars. | Verified for mounted MCP tool calls. |
| OpenClaw | Xiaomi provider preset for pay-as-you-go; Token Plan uses manual OpenAI-compatible config. | Not verified. |
| Hermes Agent | Xiaomi MiMo predefined provider or a custom provider with Base URL, API key, and model. | Not verified. |
| Cline | OpenAI-compatible provider in CLI or VS Code plugin. | Not verified. |
| Kilo Code | OpenAI-compatible provider in CLI; VS Code plugin includes Xiaomi provider options. | Not verified. |
| Roo Code | OpenAI Compatible provider in the VS Code extension. | Not verified. |
| Codex | Xiaomi's page says MiMo works only with older Codex versions that still use ChatCompletions, not the Responses API. | Not verified; separate from Codex provider compatibility. |
| Cherry Studio | Built-in Xiaomi MiMo model service; Token Plan can use the dedicated API host and key. | Not verified. |
| Zed | Custom OpenAI-compatible provider; Xiaomi notes Zed does not support custom Anthropic-compatible Base URLs. | Not verified. |
| TRAE | Custom OpenAI model using a full `BASE_URL/chat/completions` request URL. | Not verified. |
| Qwen Code | Custom OpenAI provider in `~/.qwen/settings.json` or the IDE companion. | Not verified. |

Official references:

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

本项目的已验证边界是 Claude Code MCP。其他工具即使能按小米官方文档配置 OpenAI 兼容或 Anthropic 兼容 provider，也不等于已经验证了本 MCP。

如果只是普通文本对话和 coding agent 模型调用，直接按小米官方 provider 文档配置 MiMo 即可，不需要这个 MCP。

如果要把 MiMo 的联网搜索、图像理解、音频理解、视频理解和 TTS 包装成显式工具，目前只声明 Claude Code 已完成真实挂载烟测。其他客户端需要分别完成 provider、MCP 加载、MCP 工具调用三层测试后，才能标记为已兼容。
