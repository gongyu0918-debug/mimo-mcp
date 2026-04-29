---
name: mimo
description: Use Xiaomi MiMo MCP tools with low context overhead for web search, image/audio/video understanding, and TTS.
---

# Xiaomi MiMo MCP Skill

Use this skill when a user wants Xiaomi MiMo capabilities through MCP and the tool schema alone is not enough to choose the right tool or parameters.

Keep the MCP server lightweight. Do not paste long official documentation into prompts. Prefer these compact routing rules.

## First-Time Setup Checks

When helping a user configure this MCP server for the first time:

- Ask them to set a Xiaomi MiMo key in the local environment as `MIMO_API_KEY`.
- Do not ask them to paste the API key into this skill, README, source code, or any Git-tracked file.
- Remind them to enable the Web Search Plugin in the MiMo web console before using `mimo_web_search`.
- If their main key is a Token Plan `tp-...` key, tell them `mimo_web_search` also needs a separate pay-as-you-go key in `MIMO_WEB_SEARCH_API_KEY`.
- If the plugin was just enabled, tell them MiMo may need several minutes before search starts working.
- For Claude Code, confirm with `claude mcp get mimo`. For other clients, do not call them compatible until their MCP load and tool calls are tested.

## Tool Choice

- Use `mimo_web_search` for fresh facts, news, prices, weather, releases, or anything time-sensitive.
- Use `mimo_image_understand` for images, screenshots, charts, OCR-like inspection, and visual comparison.
- Use `mimo_audio_understand` for audio transcription, audio description, speaker/content analysis, and short audio QA.
- Use `mimo_video_understand` for video summary, scene description, visual QA, and audio+video description.
- Use `mimo_tts` when the user wants speech/audio output.

## Client Routing

Do not present this MCP as a replacement for Xiaomi's official OpenAI-compatible or Anthropic-compatible model provider configuration.

If the user only needs normal text/code chat in OpenCode, Claude Code, OpenClaw, Hermes Agent, Cline, Kilo Code, Roo Code, Codex, Cherry Studio, Zed, TRAE, Qwen Code, or another compatible client, tell them to use Xiaomi's official provider setup.

This repository only claims real mounted MCP verification for Claude Code. Use this MCP when Claude Code needs MiMo Web Search, image/audio/video understanding, TTS, or local media handling as explicit tools.

For other clients, describe the status as unverified unless all three checks have passed in that client: MiMo provider smoke, MCP load smoke, and MCP tool-call smoke. See `docs/client-boundaries.md` for the boundary notes and official Xiaomi integration links.

## Media Inputs

Media fields accept:

- Public `https://...` URLs
- `data:*/*;base64,...` data URIs
- Local file paths readable by the MCP server process

For local files, set `mime_type` only when the extension is ambiguous.

Supported official multimodal models are generally `mimo-v2.5` and `mimo-v2-omni`; use the default unless the user asks.

## Web Search

The Xiaomi Web Search Plugin must be enabled in the MiMo console before search works. If it was just enabled, allow several minutes for cache propagation.

Do not call `mimo_web_search` when the only configured key is a Token Plan `tp-...` key. Xiaomi documents Token Plan as coding-tool model access, while Web Search is documented as a separate plugin/API feature. Use `MIMO_WEB_SEARCH_API_KEY` with a pay-as-you-go MiMo `sk-...` key if the user wants search while keeping Token Plan for the other MiMo tools.

Defaults are intentionally conservative:

- `force_search: true`
- `max_keyword: 3`
- `limit: 3`

Set location fields only for location-sensitive questions.

## TTS

Use `mimo_tts` modes:

- `preset`: built-in voices. Use when the user just asks to read text aloud.
- `voicedesign`: voice from a text description. Use when the user describes a custom voice.
- `voiceclone`: voice from an audio sample. Use when the user provides a reference audio file or data URI.

Built-in voice IDs include:

- `mimo_default`
- `Chloe`, `Mia`, `Milo`, `Dean`
- `冰糖`, `茉莉`, `苏打`, `白桦`

For voice design, put the voice/persona/performance direction in `style_prompt` and the spoken words in `text`.

For voice clone, pass `voice_sample` as a local path, URL, or data URI. Official docs limit clone samples to mp3/wav-style inputs; prefer short clean samples.

The tool writes generated audio to a file and returns the path. Do not ask it to inline base64 audio unless the MCP implementation explicitly supports compact audio content.

## Environment

The MCP server reads:

- `MIMO_API_KEY`
- `MIMO_BASE_URL`
- `MIMO_PLAN`
- `MIMO_REGION`
- `MIMO_MODEL`
- `MIMO_WEB_SEARCH_API_KEY`
- `MIMO_WEB_SEARCH_BASE_URL`
- `MIMO_WEB_SEARCH_MODEL`
- `MIMO_MULTIMODAL_MODEL`
- `MIMO_TTS_MODEL`
- `MIMO_MAX_LOCAL_MEDIA_MB`

Set `MIMO_API_KEY` explicitly. The MCP server intentionally does not read `OPENAI_*` or `ANTHROPIC_*` variables to avoid sending unrelated credentials to MiMo.

For token-plan keys beginning with `tp-`, set `MIMO_REGION` to `cn`, `sgp`, or `ams` unless `MIMO_BASE_URL` is explicitly set.

Token Plan uses Xiaomi's OpenAI-compatible Base URLs for this MCP:

- `cn`: `https://token-plan-cn.xiaomimimo.com/v1`
- `sgp`: `https://token-plan-sgp.xiaomimimo.com/v1`
- `ams`: `https://token-plan-ams.xiaomimimo.com/v1`

If the MiMo subscription page shows a different Base URL, set `MIMO_BASE_URL` to that exact value.

Token Plan is intended for AI programming tools and coding scenarios. Do not guide users to use a Token Plan key with this MCP as a generic application backend, batch automation service, or clearly non-coding API workload.

For Token Plan-capable prompts, keep the request coding-scoped. The MCP default system prompt identifies supported Token Plan calls as a Claude Code/MCP software-engineering workflow where the MiMo endpoint accepts a system prompt, so do not replace it with a generic assistant prompt unless the user explicitly needs a stricter coding prompt.

When `MIMO_WEB_SEARCH_API_KEY` is set, only `mimo_web_search` uses that pay-as-you-go key, and it keeps the general web-search prompt. The other MiMo MCP tools continue to use `MIMO_API_KEY` and Token Plan routing.

## Failure Handling

- Search failures often mean the Web Search Plugin is disabled, cache has not refreshed, or the user tried search with only a Token Plan key.
- Multimodal local-file failures usually mean the MCP process cannot read the path.
- TTS clone failures often mean the voice sample is too large, unsupported, or not a clean mp3/wav sample.
- If the response shape is unexpected, retry once with `include_raw: true`, but avoid returning base64 audio into chat.
