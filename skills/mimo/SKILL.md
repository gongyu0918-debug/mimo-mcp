---
name: mimo
description: Use Xiaomi MiMo MCP tools with low context overhead for web search, image/audio/video understanding, and TTS.
---

# Xiaomi MiMo MCP Skill

Use this skill when a user wants Xiaomi MiMo capabilities through MCP and the tool schema alone is not enough to choose the right tool or parameters.

Keep the MCP server lightweight. Do not paste long official documentation into prompts. Prefer these compact routing rules.

## Tool Choice

- Use `mimo_web_search` for fresh facts, news, prices, weather, releases, or anything time-sensitive.
- Use `mimo_image_understand` for images, screenshots, charts, OCR-like inspection, and visual comparison.
- Use `mimo_audio_understand` for audio transcription, audio description, speaker/content analysis, and short audio QA.
- Use `mimo_video_understand` for video summary, scene description, visual QA, and audio+video description.
- Use `mimo_tts` when the user wants speech/audio output.

## Media Inputs

Media fields accept:

- Public `https://...` URLs
- `data:*/*;base64,...` data URIs
- Local file paths readable by the MCP server process

For local files, set `mime_type` only when the extension is ambiguous.

Supported official multimodal models are generally `mimo-v2.5` and `mimo-v2-omni`; use the default unless the user asks.

## Web Search

The Xiaomi Web Search Plugin must be enabled in the MiMo console before search works. If it was just enabled, allow several minutes for cache propagation.

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
- `MIMO_MULTIMODAL_MODEL`
- `MIMO_TTS_MODEL`
- `MIMO_MAX_LOCAL_MEDIA_MB`

Set `MIMO_API_KEY` explicitly. The MCP server intentionally does not read `OPENAI_*` or `ANTHROPIC_*` variables to avoid sending unrelated credentials to MiMo.

For token-plan keys beginning with `tp-`, set `MIMO_REGION` to `cn`, `sgp`, or `ams` unless `MIMO_BASE_URL` is explicitly set.

## Failure Handling

- Search failures often mean the Web Search Plugin is disabled or cache has not refreshed.
- Multimodal local-file failures usually mean the MCP process cannot read the path.
- TTS clone failures often mean the voice sample is too large, unsupported, or not a clean mp3/wav sample.
- If the response shape is unexpected, retry once with `include_raw: true`, but avoid returning base64 audio into chat.
