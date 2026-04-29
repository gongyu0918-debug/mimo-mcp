import { mediaInputToUrl, writeBase64File } from "./media.js";

const DEFAULT_BASE_URL = "https://api.xiaomimimo.com/v1";
const TOKEN_PLAN_BASE_URLS = {
  cn: "https://token-plan-cn.xiaomimimo.com/v1",
  sgp: "https://token-plan-sgp.xiaomimimo.com/v1",
  ams: "https://token-plan-ams.xiaomimimo.com/v1"
};
const DEFAULT_MODEL = "mimo-v2.5-pro";
const DEFAULT_MULTIMODAL_MODEL = "mimo-v2.5";
const DEFAULT_TTS_MODEL = "mimo-v2.5-tts";

export function getConfig(env = process.env) {
  const apiKey = env.MIMO_API_KEY;
  return {
    apiKey,
    baseUrl: resolveBaseUrl(apiKey, env),
    model: env.MIMO_MODEL || DEFAULT_MODEL,
    multimodalModel: env.MIMO_MULTIMODAL_MODEL || DEFAULT_MULTIMODAL_MODEL,
    ttsModel: env.MIMO_TTS_MODEL || DEFAULT_TTS_MODEL,
    timeoutMs: toInt(env.MIMO_TIMEOUT_MS, 60000),
    defaultMaxKeyword: toInt(env.MIMO_SEARCH_MAX_KEYWORD, 3),
    defaultLimit: toInt(env.MIMO_SEARCH_LIMIT, 3),
    country: env.MIMO_SEARCH_COUNTRY || "",
    region: env.MIMO_SEARCH_REGION || "",
    city: env.MIMO_SEARCH_CITY || ""
  };
}

export function resolveBaseUrl(apiKey = "", env = process.env) {
  if (env.MIMO_BASE_URL) {
    return normalizeBaseUrl(env.MIMO_BASE_URL);
  }

  const plan = String(env.MIMO_PLAN || "").trim().toLowerCase().replace(/_/g, "-");
  const region = String(env.MIMO_REGION || "cn").trim().toLowerCase();

  if (plan === "token-plan" || String(apiKey).startsWith("tp-")) {
    return TOKEN_PLAN_BASE_URLS[region] || TOKEN_PLAN_BASE_URLS.cn;
  }

  return DEFAULT_BASE_URL;
}

export function normalizeBaseUrl(value) {
  let url = String(value || DEFAULT_BASE_URL).trim().replace(/\/+$/, "");
  url = url.replace(/\/chat\/completions$/, "");
  return url;
}

export async function searchWithMiMo(input, env = process.env) {
  const config = getConfig(env);

  const query = String(input.query || "").trim();
  if (!query) {
    throw new Error("Missing required search query.");
  }

  const maxKeyword = clampInt(input.max_keyword, config.defaultMaxKeyword, 1, 10);
  const limit = clampInt(input.limit, config.defaultLimit, 1, 10);
  const maxCompletionTokens = clampInt(input.max_completion_tokens, 1024, 64, 8192);
  const temperature = clampNumber(input.temperature, 0.2, 0, 2);

  const userLocation = buildLocation({
    country: input.country || config.country,
    region: input.region || config.region,
    city: input.city || config.city
  });

  const data = await createChatCompletion({
    model: config.model,
    messages: [
      {
        role: "system",
        content:
          input.system_prompt ||
          "You are a concise web search assistant. Use web search results when available, answer directly, and preserve source facts accurately."
      },
      {
        role: "user",
        content: query
      }
    ],
    tools: [
      {
        type: "web_search",
        max_keyword: maxKeyword,
        force_search: input.force_search ?? true,
        limit,
        ...(userLocation ? { user_location: userLocation } : {})
      }
    ],
    tool_choice: "auto",
    max_completion_tokens: maxCompletionTokens,
    temperature,
    top_p: clampNumber(input.top_p, 0.95, 0, 1),
    stream: false,
    stop: null,
    frequency_penalty: 0,
    presence_penalty: 0,
    thinking: {
      type: "disabled"
    }
  }, env);

  return normalizeSearchResponse(data);
}

export async function understandMediaWithMiMo(kind, input, env = process.env) {
  const config = getConfig(env);
  const prompt = String(input.prompt || defaultMediaPrompt(kind)).trim();
  const mediaValues = normalizeMediaValues(input);
  const maxCompletionTokens = clampInt(input.max_completion_tokens, 1024, 64, 8192);
  const model = input.model || config.multimodalModel;

  const content = [];
  for (const value of mediaValues) {
    const mediaUrl = await mediaInputToUrl(value, input.mime_type);
    if (kind === "image") {
      content.push({ type: "image_url", image_url: { url: mediaUrl } });
    } else if (kind === "audio") {
      content.push({ type: "input_audio", input_audio: { data: mediaUrl } });
    } else if (kind === "video") {
      content.push({
        type: "video_url",
        video_url: { url: mediaUrl },
        fps: clampNumber(input.fps, 2, 0.1, 10),
        media_resolution: input.media_resolution || "default"
      });
    } else {
      throw new Error(`Unsupported media kind: ${kind}`);
    }
  }
  content.push({ type: "text", text: prompt });

  const data = await createChatCompletion({
    model,
    messages: [
      {
        role: "system",
        content:
          input.system_prompt ||
          "You are MiMo, an AI assistant developed by Xiaomi. Analyze the provided media and answer accurately."
      },
      {
        role: "user",
        content
      }
    ],
    max_completion_tokens: maxCompletionTokens,
    temperature: clampNumber(input.temperature, 0.2, 0, 2),
    top_p: clampNumber(input.top_p, 0.95, 0, 1),
    thinking: {
      type: "disabled"
    }
  }, env);

  return normalizeChatResponse(data);
}

export async function synthesizeSpeechWithMiMo(input, env = process.env) {
  const config = getConfig(env);
  const text = String(input.text || "").trim();
  if (!text) {
    throw new Error("Missing text to synthesize.");
  }

  const mode = input.mode || "preset";
  const format = input.format || "wav";
  const model = input.model || ttsModelForMode(mode, config.ttsModel);
  const stylePrompt = String(input.style_prompt || "").trim();
  const audio = { format };

  if (mode === "preset") {
    audio.voice = input.voice || "mimo_default";
  } else if (mode === "voiceclone") {
    const voiceSample = input.voice_sample || input.voice || "";
    if (!voiceSample) {
      throw new Error("voiceclone mode requires voice_sample as a URL, data URI, or local file path.");
    }
    audio.voice = await mediaInputToUrl(voiceSample, input.voice_sample_mime_type);
  } else if (mode !== "voicedesign") {
    throw new Error("mode must be one of: preset, voicedesign, voiceclone.");
  }

  const data = await createChatCompletion({
    model,
    messages: [
      {
        role: "user",
        content: stylePrompt
      },
      {
        role: "assistant",
        content: text
      }
    ],
    audio
  }, env);

  const message = data?.choices?.[0]?.message || {};
  const audioData = message?.audio?.data;
  const outputPath = await writeBase64File(audioData, input.output_path, format);

  return {
    output_path: outputPath,
    format,
    model: data.model || model,
    voice: mode === "voiceclone" ? "voice_sample" : audio.voice || mode,
    text: normalizeContent(message.content),
    usage: data.usage || null,
    raw: input.include_raw ? sanitizeAudioRaw(data) : undefined
  };
}

export async function createChatCompletion(body, env = process.env) {
  const config = getConfig(env);

  if (!config.apiKey) {
    throw new Error(
      "Missing API key. Set MIMO_API_KEY to your Xiaomi MiMo API key."
    );
  }

  const response = await fetchWithTimeout(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "api-key": config.apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  }, config.timeoutMs);

  const responseText = await response.text();
  let data;
  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    throw new Error(`MiMo returned non-JSON response (${response.status}): ${responseText.slice(0, 500)}`);
  }

  if (!response.ok) {
    const message = data?.error?.message || data?.message || responseText || response.statusText;
    throw new Error(`MiMo API error ${response.status}: ${message}`);
  }

  return data;
}

export function formatSearchResult(result, includeRaw = false) {
  const parts = [];
  if (result.answer) {
    parts.push(result.answer.trim());
  }

  if (result.sources.length) {
    parts.push(
      [
        "Sources:",
        ...result.sources.map((source, index) => {
          const bits = [`${index + 1}. ${source.title || source.url}`];
          if (source.site_name) bits.push(`   Site: ${source.site_name}`);
          if (source.publish_time) bits.push(`   Published: ${source.publish_time}`);
          if (source.url) bits.push(`   URL: ${source.url}`);
          if (source.summary) bits.push(`   Summary: ${source.summary}`);
          return bits.join("\n");
        })
      ].join("\n")
    );
  }

  if (!parts.length) {
    parts.push("MiMo returned no answer text or web search annotations.");
  }

  if (result.error_message) {
    parts.push(`Web search error: ${result.error_message}`);
  }

  if (includeRaw) {
    parts.push(`Raw response:\n${JSON.stringify(result.raw, null, 2)}`);
  }

  return parts.join("\n\n");
}

export function formatChatResult(result, includeRaw = false) {
  const parts = [];
  if (result.answer) {
    parts.push(result.answer.trim());
  }

  if (result.usage) {
    parts.push(`Usage: ${JSON.stringify(result.usage)}`);
  }

  if (includeRaw) {
    parts.push(`Raw response:\n${JSON.stringify(result.raw, null, 2)}`);
  }

  return parts.join("\n\n") || "MiMo returned no answer text.";
}

export function formatSpeechResult(result, includeRaw = false) {
  const parts = [
    `Audio written to: ${result.output_path}`,
    `Format: ${result.format}`,
    `Model: ${result.model}`,
    `Voice: ${result.voice}`
  ];

  if (result.text) {
    parts.push(`Text response: ${result.text}`);
  }

  if (result.usage) {
    parts.push(`Usage: ${JSON.stringify(result.usage)}`);
  }

  if (includeRaw && result.raw) {
    parts.push(`Raw response:\n${JSON.stringify(result.raw, null, 2)}`);
  }

  return parts.join("\n");
}

function normalizeSearchResponse(data) {
  const choice = data?.choices?.[0] || {};
  const message = choice.message || {};
  const content = normalizeContent(message.content);
  const annotations = message.annotations || choice.annotations || [];
  const sources = dedupeSources(Array.isArray(annotations) ? annotations : []);

  return {
    answer: content,
    sources,
    error_message: message.error_message || choice.error_message || "",
    usage: data.usage || null,
    raw: data
  };
}

function normalizeChatResponse(data) {
  const choice = data?.choices?.[0] || {};
  const message = choice.message || {};
  return {
    answer: normalizeContent(message.content),
    reasoning_content: message.reasoning_content || "",
    usage: data.usage || null,
    raw: data
  };
}

function sanitizeAudioRaw(data) {
  const clone = JSON.parse(JSON.stringify(data));
  for (const choice of clone?.choices || []) {
    const audio = choice?.message?.audio || choice?.delta?.audio;
    if (audio?.data) {
      audio.data = `<base64 audio omitted: ${audio.data.length} chars>`;
    }
  }
  return clone;
}

function normalizeContent(content) {
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part?.type === "text") return part.text || "";
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

function dedupeSources(annotations) {
  const seen = new Set();
  const sources = [];

  for (const annotation of annotations) {
    const url = annotation?.url || "";
    const key = url || `${annotation?.title || ""}:${annotation?.summary || ""}`;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    sources.push({
      type: annotation.type || "url_citation",
      url,
      title: annotation.title || "",
      summary: annotation.summary || "",
      site_name: annotation.site_name || "",
      publish_time: annotation.publish_time || "",
      logo_url: annotation.logo_url || ""
    });
  }

  return sources;
}

function buildLocation(location) {
  const country = String(location.country || "").trim();
  const region = String(location.region || "").trim();
  const city = String(location.city || "").trim();

  if (!country && !region && !city) {
    return null;
  }

  return {
    type: "approximate",
    ...(country ? { country } : {}),
    ...(region ? { region } : {}),
    ...(city ? { city } : {})
  };
}

function normalizeMediaValues(input) {
  const values = input.media ?? input.media_url ?? input.media_path ?? input.url ?? input.path;
  const array = Array.isArray(values) ? values : [values];
  const normalized = array.map((value) => String(value || "").trim()).filter(Boolean);
  if (!normalized.length) {
    throw new Error("Missing media. Provide media, media_url, media_path, url, or path.");
  }
  return normalized;
}

function defaultMediaPrompt(kind) {
  if (kind === "image") return "Please describe the image and answer any visible details.";
  if (kind === "audio") return "Please describe and transcribe the audio content.";
  if (kind === "video") return "Please describe the video, including notable visual and audio content.";
  return "Please analyze the provided media.";
}

function ttsModelForMode(mode, presetModel) {
  if (mode === "preset") return presetModel || "mimo-v2.5-tts";
  if (mode === "voicedesign") return "mimo-v2.5-tts-voicedesign";
  if (mode === "voiceclone") return "mimo-v2.5-tts-voiceclone";
  return presetModel || "mimo-v2.5-tts";
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`MiMo API request timed out after ${timeoutMs}ms.`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function toInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampInt(value, fallback, min, max) {
  const parsed = Number.parseInt(value ?? fallback, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function clampNumber(value, fallback, min, max) {
  const parsed = Number.parseFloat(value ?? fallback);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}
