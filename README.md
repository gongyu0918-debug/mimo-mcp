# mimo-mcp

Lightweight MCP server for Xiaomi MiMo:

- Web search
- Image understanding
- Audio understanding
- Video understanding
- Speech synthesis

The MCP tool descriptions stay intentionally short to reduce context overhead.
Usage guidance lives in `skills/mimo/SKILL.md` and can be loaded only when needed.

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

## Install

```bash
git clone https://github.com/YOUR_NAME/mimo-mcp.git
cd mimo-mcp
npm install
```

Set an API key:

```bash
# macOS/Linux
export MIMO_API_KEY="sk-..."

# Windows PowerShell
setx MIMO_API_KEY "sk-..."
```

Use a MiMo key here. The server intentionally does not read `OPENAI_*` or `ANTHROPIC_*` variables to avoid accidentally sending unrelated credentials to MiMo.

## Claude Code

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

## Optional Skill

The optional skill is at:

```text
skills/mimo/SKILL.md
```

Use it in environments that support skills when you want routing guidance, prompt tips, supported voice IDs, or troubleshooting notes without bloating the MCP schema.

## Smoke Test

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

## Why MCP plus Skill?

MCP is the executable layer: it calls MiMo APIs, reads local media, and writes generated audio.

Skill is the guidance layer: it explains when to use each tool and how to shape prompts, but only when needed. This keeps Claude Code's regular context smaller.

## License

MIT
